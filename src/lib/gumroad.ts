/**
 * Gumroad Webhook Helpers — Phase 3 B.4
 *
 * Gumroad webhook payload'unu HMAC SHA256 ile verify eder, sale event'ini
 * normalize eder. Signature header formati Gumroad docs:
 *   "sha256=<hex>" (tek imza; rotating secret kullanilmaz)
 *
 * Env:
 *   GUMROAD_WEBHOOK_SECRET   → HMAC secret (Gumroad → Settings → Advanced)
 *   GUMROAD_PRODUCT_MAP      → JSON: { "<gumroad_product_id>": "<template_slug>" }
 *   GUMROAD_API_KEY          → Gumroad API key (fetchGumroadSale icin)
 *
 * NOT: Bu modul sadece server-side API route'lardan cagrilir. Crypto Node-only
 * API kullanir (createHmac).
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from './logger';

// =================== CONFIG ===================

/**
 * Tum Gumroad env'ler set mi? Tek secret yeterli; product map opsiyonel
 * (yoksa webhook payload'indaki product_id kullanilir, template slug
 * olarak kabul edilir — ileride strict map zorunlu kilinabilir).
 */
export function isGumroadConfigured(): boolean {
  return Boolean(process.env.GUMROAD_WEBHOOK_SECRET);
}

/**
 * GUMROAD_PRODUCT_MAP env'sini parse eder. Format:
 *   { "<gumroad_product_id>": "<template_slug>", ... }
 *
 * Bozuk JSON veya tanimsiz durumda bos doner — strict map zorunlu degil
 * cunku Gumroad'in product_permalink alani da slug olarak kullanilabilir.
 */
export function getGumroadProductMap(): Record<string, string> {
  const raw = process.env.GUMROAD_PRODUCT_MAP;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    // Sadece string → string eslesmeleri al
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim().length > 0) {
        out[k] = v.trim();
      }
    }
    return out;
  } catch (err) {
    logger.warn('[Gumroad] GUMROAD_PRODUCT_MAP JSON parse failed', { error: err });
    return {};
  }
}

// =================== SIGNATURE ===================

/**
 * Gumroad webhook imzasi "sha256=<hex>" formatinda gelir.
 * HMAC SHA256(secret, raw_body) ile hesaplanan deger esit mi diye bakar.
 * timingSafeEqual length-attack'a karsi once length check yapar.
 *
 * @returns boolean — gecerli imzaliysa true
 */
export function verifyGumroadWebhook(payload: string, signature: string | null): boolean {
  const secret = process.env.GUMROAD_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('[Gumroad] GUMROAD_WEBHOOK_SECRET not configured');
    return false;
  }
  if (!signature) return false;

  // "sha256=abcdef..." prefix'i Gumroad docs'a gore; dogrudan hex de kabul et
  const expectedHex = signature.startsWith('sha256=') ? signature.slice(7) : signature;

  // Hex decode — gecersiz hex ise dogrudan false (timingSafeEqual oncesi length check)
  if (!/^[0-9a-fA-F]+$/.test(expectedHex)) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(expectedHex, 'hex');
  } catch {
    return false;
  }

  const computed = createHmac('sha256', secret).update(payload, 'utf8').digest();
  if (expected.length !== computed.length) return false;

  return timingSafeEqual(expected, computed);
}

// =================== PARSING ===================

/**
 * Gumroad sale webhook payload'unun normalize edilmis hali.
 *
 * Gumroad docs: https://gumroad.com/ping
 * Tipik alanlar:
 *   seller_id, product_id, product_permalink, email, full_name,
 *   price (cents), currency, sale_id, refunded, dispute_started,
 *   sale_timestamp, ...
 *
 * NOT: Gumroad 'price' string olarak gelir (USD cent) — "1000" gibi.
 */
export interface ParsedGumroadSale {
  saleId: string;
  email: string;
  name?: string;
  productId: string;
  productSlug?: string; // GUMROAD_PRODUCT_MAP'ten veya product_permalink'ten
  priceCents: number;
  currency: string;
  refunded: boolean;
  raw: Record<string, unknown>;
}

/**
 * Gumroad payload'unu typed objeye cevirir. Zorunlu alanlar (saleId, email,
 * productId) eksikse null doner — route handler 400 ile reddeder.
 */
export function parseGumroadSale(payload: Record<string, unknown>): ParsedGumroadSale | null {
  // Gumroad farkli event tipleri gonderir; biz sadece "sale" event'ini isleriz.
  // route.ts'de resource_name kontrolu yapilir; burada raw payload'a bakip
  // alanlari cekiyoruz.
  const saleIdRaw =
    (payload.sale_id as string | undefined) ??
    (payload.id as string | undefined);
  const emailRaw = payload.email as string | undefined;
  const productIdRaw =
    (payload.product_id as string | undefined) ??
    (payload.short_product_id as string | undefined);

  if (!saleIdRaw || !emailRaw || !productIdRaw) return null;

  // Fiyat: Gumroad cents string doner ("1000" = $10.00). Number parse.
  const priceRaw = payload.price;
  let priceCents = 0;
  if (typeof priceRaw === 'string' && priceRaw.trim().length > 0) {
    const num = Number(priceRaw);
    if (Number.isFinite(num) && num >= 0) priceCents = Math.round(num);
  } else if (typeof priceRaw === 'number' && priceRaw >= 0) {
    priceCents = Math.round(priceRaw);
  }

  // Refund flag — Gumroad 'refunded' (bool) ve 'dispute_started' (bool) alanlari
  const refunded = Boolean(payload.refunded) || Boolean(payload.dispute_started);

  const productMap = getGumroadProductMap();
  const productSlug =
    productMap[productIdRaw] ??
    (typeof payload.product_permalink === 'string' ? payload.product_permalink : undefined);

  return {
    saleId: saleIdRaw,
    email: emailRaw,
    name: typeof payload.full_name === 'string' ? payload.full_name : undefined,
    productId: productIdRaw,
    productSlug,
    priceCents,
    currency: (typeof payload.currency === 'string' && payload.currency) || 'USD',
    refunded,
    raw: payload,
  };
}

// =================== API FETCH (ADVANCED) ===================

/**
 * Gumroad API'den tek bir sale kaydini cekmek icin kullanilir (advanced/
 * verification scenario'lari). Normal webhook akisinda cagrilmaz.
 *
 * Endpoint: https://api.gumroad.com/v2/sales/:id
 * Auth: ?access_token=<GUMROAD_API_KEY>
 */
export interface GumroadApiSale {
  id: string;
  email: string;
  full_name?: string;
  product_id: string;
  product_permalink?: string;
  price: number; // cents
  currency: string;
  refunded: boolean;
  created_at: string;
}

export async function fetchGumroadSale(saleId: string): Promise<GumroadApiSale | null> {
  const apiKey = process.env.GUMROAD_API_KEY;
  if (!apiKey) {
    logger.warn('[Gumroad] GUMROAD_API_KEY not configured, fetchGumroadSale unavailable');
    return null;
  }
  if (!saleId || saleId.length > 128) return null;

  try {
    const url = `https://api.gumroad.com/v2/sales/${encodeURIComponent(saleId)}?access_token=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) {
      logger.warn('[Gumroad] fetchGumroadSale non-OK', { saleId, status: res.status });
      return null;
    }
    const json = (await res.json()) as { success?: boolean; sale?: GumroadApiSale };
    if (!json.success || !json.sale) return null;
    return json.sale;
  } catch (err) {
    logger.error('[Gumroad] fetchGumroadSale error', { saleId, error: err });
    return null;
  }
}
