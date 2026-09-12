/**
 * Lemon Squeezy Webhook Helpers — Phase 3 B.4
 *
 * Lemon Squeezy webhook payload'unu HMAC SHA256 ile verify eder, event'i
 * normalize eder. Signature header formati:
 *   "X-Signature: <hex>"   (HMAC SHA256(secret, raw_body))
 *
 * Env:
 *   LEMONSQUEEZY_WEBHOOK_SECRET  → HMAC signing secret
 *   LEMONSQUEEZY_API_KEY         → API key (checkout URL uretimi icin)
 *   LEMONSQUEEZY_STORE_ID        → Store ID (checkout icin)
 *   LEMONSQUEEZY_PRODUCT_MAP     → JSON: { "<ls_variant_id>": "<template_slug>" }
 *
 * NOT: Bu modul sadece server-side API route'lardan cagrilir. Crypto Node-only
 * API kullanir (createHmac).
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from './logger';

// =================== CONFIG ===================

/**
 * Lemon Squeezy webhook secret set mi? Tek secret yeterli; API key ayri
 * kontrol edilir (checkout URL uretimi icin).
 */
export function isLemonSqueezyConfigured(): boolean {
  return Boolean(process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
}

/**
 * Hem webhook secret hem checkout URL uretimi icin gerekli env'ler set mi?
 */
export function isLemonSqueezyCheckoutConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET &&
      process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID
  );
}

/**
 * LEMONSQUEEZY_PRODUCT_MAP env'sini parse eder. Format:
 *   { "<ls_variant_id>": "<template_slug>", ... }
 */
export function getLemonSqueezyProductMap(): Record<string, string> {
  const raw = process.env.LEMONSQUEEZY_PRODUCT_MAP;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim().length > 0) {
        out[k] = v.trim();
      }
    }
    return out;
  } catch (err) {
    logger.warn('[LemonSqueezy] LEMONSQUEEZY_PRODUCT_MAP JSON parse failed', { error: err });
    return {};
  }
}

// =================== SIGNATURE ===================

/**
 * Lemon Squeezy "X-Signature" header'i raw hex (HMAC SHA256(secret, body)).
 * timingSafeEqual ile constant-time karsilastirir; length oncesi kontrol.
 */
export function verifyLemonSqueezyWebhook(payload: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('[LemonSqueezy] LEMONSQUEEZY_WEBHOOK_SECRET not configured');
    return false;
  }
  if (!signature) return false;

  if (!/^[0-9a-fA-F]+$/.test(signature)) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }

  const computed = createHmac('sha256', secret).update(payload, 'utf8').digest();
  if (expected.length !== computed.length) return false;

  return timingSafeEqual(expected, computed);
}

// =================== EVENT PARSING ===================

/**
 * Lemon Squeezy webhook event payload shape'i (meta + data nested):
 *   {
 *     meta: {
 *       event_name: "order_created" | "subscription_created" |
 *                   "subscription_cancelled" | "subscription_resumed" | ...,
 *       custom_data?: { ... }
 *     },
 *     data: {
 *       id: "...",
 *       attributes: {
 *         order_number, customer_id, user_email, user_name,
 *         total, currency, status, ...
 *         first_order_item?: { variant_id, product_id, ... }
 *       }
 *     }
 *   }
 *
 * Phase 3 B.4 icin handle edilen event tipleri:
 *   - order_created
 *   - subscription_created  (ilk subscription olusturulmasi)
 *   - subscription_cancelled
 *
 * Subscription cancelled icin refund akisi tetiklenir (license revoked).
 */
export type LemonSqueezyEventName =
  | 'order_created'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'order_refunded';

export interface ParsedLemonSqueezyEvent {
  eventName: LemonSqueezyEventName | string;
  orderId: string;
  customerEmail: string;
  customerName?: string;
  productId: string;       // variant_id veya product_id
  productSlug?: string;
  amountCents: number;
  currency: string;
  isRefund: boolean;
  isCancellation: boolean;
  raw: Record<string, unknown>;
}

/**
 * Lemon Squeezy webhook payload'unu typed objeye cevirir.
 * Gerekli alanlar (data.attributes.*) eksikse null doner.
 */
export function parseLemonSqueezyEvent(payload: Record<string, unknown>): ParsedLemonSqueezyEvent | null {
  const meta = (payload.meta ?? {}) as Record<string, unknown>;
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const attrs = (data.attributes ?? {}) as Record<string, unknown>;

  const eventName = typeof meta.event_name === 'string' ? meta.event_name : '';
  const orderIdRaw = typeof data.id === 'string' ? data.id : '';
  const emailRaw = typeof attrs.user_email === 'string' ? attrs.user_email : '';

  if (!eventName || !orderIdRaw || !emailRaw) return null;

  // Fiyat: Lemon Squeezy cents integer doner (number). total/total_formatted
  // alanlarindan hangisi varsa onu kullan.
  let amountCents = 0;
  const totalRaw = attrs.total;
  if (typeof totalRaw === 'number' && totalRaw >= 0) {
    amountCents = Math.round(totalRaw);
  } else if (typeof totalRaw === 'string' && totalRaw.trim().length > 0) {
    const num = Number(totalRaw);
    if (Number.isFinite(num) && num >= 0) amountCents = Math.round(num);
  }

  // Product identification:
  //  - order event'lerinde first_order_item.variant_id
  //  - subscription event'lerinde variant_id (data.attributes veya nested)
  const firstItem = (attrs.first_order_item ?? {}) as Record<string, unknown>;
  let productIdRaw =
    (typeof firstItem.variant_id === 'string' ? firstItem.variant_id : undefined) ??
    (typeof firstItem.product_id === 'string' ? firstItem.product_id : undefined) ??
    (typeof attrs.variant_id === 'string' ? attrs.variant_id : undefined) ??
    (typeof attrs.product_id === 'string' ? attrs.product_id : undefined);

  // Order olmayan event'lerde (subscription) variant_name kullanilabilir fallback
  // olarak — bos birakmak yerine slug olarak kullan.
  if (!productIdRaw) {
    if (typeof attrs.variant_name === 'string') productIdRaw = attrs.variant_name;
  }

  if (!productIdRaw) return null;

  const productMap = getLemonSqueezyProductMap();
  const productSlug =
    productMap[productIdRaw] ??
    (typeof attrs.slug === 'string' ? attrs.slug : undefined);

  const isCancellation = eventName === 'subscription_cancelled';
  const isRefund =
    eventName === 'order_refunded' ||
    isCancellation ||
    (typeof attrs.status === 'string' && attrs.status === 'refunded');

  return {
    eventName,
    orderId: orderIdRaw,
    customerEmail: emailRaw,
    customerName: typeof attrs.user_name === 'string' ? attrs.user_name : undefined,
    productId: productIdRaw,
    productSlug,
    amountCents,
    currency: (typeof attrs.currency === 'string' && attrs.currency) || 'USD',
    isRefund,
    isCancellation,
    raw: payload,
  };
}

// =================== CHECKOUT URL ===================

/**
 * Lemon Squeezy "Buy now" / checkout URL'i uretir.
 *
 * Endpoint: POST https://api.lemonsqueezy.com/v1/checkouts
 * Body: {
 *   data: {
 *     type: "checkouts",
 *     attributes: {
 *       checkout_options: { ... },
 *       product_options: {
 *         redirect_url, receipt_button_text, enabled_variants: [{ variant_id }]
 *       }
 *     },
 *     relationships: { store: { data: { type: "stores", id: "<store_id>" } } }
 *   }
 * }
 *
 * Response: { data: { attributes: { url } } }
 *
 * Phase 3 B.4 icin su parametreler ile minimal checkout olusturur:
 *  - variant_id   → template'e eslenen LS variant
 *  - redirect_url → odeme sonrasi donus
 *  - custom data   → buyerEmail + buyerName (webhook'ta okunabilir)
 */
export interface CreateLemonSqueezyCheckoutInput {
  variantId: string;
  buyerEmail: string;
  buyerName?: string;
  redirectUrl?: string;
  customData?: Record<string, string | number | boolean>;
}

export interface LemonSqueezyCheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  checkoutId?: string;
  error?: string;
}

export async function createLemonSqueezyCheckout(
  input: CreateLemonSqueezyCheckoutInput
): Promise<LemonSqueezyCheckoutResult> {
  if (!isLemonSqueezyCheckoutConfigured()) {
    return { success: false, error: 'Lemon Squeezy checkout env\'leri eksik' };
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY!;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;

  const checkoutData = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_options: {
          embed: false,
          media: false,
          logo: true,
          desc: true,
          discount: true,
          custom_price: false,
        },
        product_options: {
          enabled_variants: [{ variant_id: input.variantId }],
          redirect_url: input.redirectUrl ?? '',
          receipt_button_text: 'Template\'e Git',
          receipt_thank_you_note: 'Odemeniz basariyla alindi. Template\'iniz hazirlaniyor.',
        },
        checkout_data: {
          email: input.buyerEmail,
          name: input.buyerName ?? '',
          custom: input.customData ?? {},
        },
      },
      relationships: {
        store: {
          data: { type: 'stores', id: storeId },
        },
      },
    },
  };

  try {
    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(checkoutData),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      logger.error('[LemonSqueezy] checkout create failed', {
        status: res.status,
        body: errText.slice(0, 500),
      });
      return { success: false, error: `Lemon Squeezy API ${res.status}` };
    }

    const json = (await res.json()) as {
      data?: { id?: string; attributes?: { url?: string } };
      errors?: Array<{ detail?: string }>;
    };

    if (json.errors && json.errors.length > 0) {
      return { success: false, error: json.errors.map((e) => e.detail).join('; ') };
    }

    const url = json.data?.attributes?.url;
    if (!url) return { success: false, error: 'Checkout URL donmedi' };

    return {
      success: true,
      checkoutUrl: url,
      checkoutId: json.data?.id,
    };
  } catch (err) {
    logger.error('[LemonSqueezy] checkout create error', { error: err });
    return { success: false, error: 'Checkout olusturulamadi' };
  }
}
