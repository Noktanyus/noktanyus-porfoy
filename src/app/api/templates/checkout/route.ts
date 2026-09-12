/**
 * POST /api/templates/checkout — Phase 3 B.4
 *
 * Marketplace checkout baslatici. Body:
 *   {
 *     slug: string,                // TemplateListing.slug
 *     licenseType?: string,        // "single" | "white-label" | "agency" (default: template.licenseType)
 *     buyerEmail: string,
 *     buyerName?: string,
 *     workspaceId?: string,        // opsiyonel — once workspace secili ise
 *     provider?: "gumroad" | "lemonsqueezy"  // default: hangisi yapilandirilmissa
 *   }
 *
 * Akis:
 *   1. Body validate (Zod)
 *   2. TemplateListing bul (active olmali)
 *   3. Provider sec — body.provider varsa onu kullan; yoksa config'e gore auto
 *      (ikisi de yapiliysa gumroad oncelikli — Gumroad daha genis kitle)
 *   4. Reverse product-map lookup: slug → gumroad product_id / ls variant_id
 *   5. Pending TemplatePurchase olustur (externalId = "pending_<purchaseId>")
 *      — webhook gelince idempotent merge yapilacak
 *   6. Checkout URL olustur:
 *      - Gumroad:   https://<permalink>.gumroad.com/l/<product>?wanted=true
 *      - Lemon:     createLemonSqueezyCheckout() (programmatic API)
 *   7. { checkoutUrl, purchaseId, provider } don
 *
 * Buyer odemeyi tamamlar → webhook → license olusur → install baslar.
 *
 * Idempotency: Ayni (slug, buyerEmail) ile ikinci kez gelirse pending purchase
 * varsa onu tekrar kullanir (cancelled degilse).
 *
 * Rate limit (withRateLimit) — public endpoint; spam/abuse korumasi.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit, RateLimits } from '@/lib/rateLimitMiddleware';
import {
  getGumroadProductMap,
  isGumroadConfigured,
} from '@/lib/gumroad';
import {
  createLemonSqueezyCheckout,
  getLemonSqueezyProductMap,
  isLemonSqueezyCheckoutConfigured,
  isLemonSqueezyConfigured,
} from '@/lib/lemonsqueezy';

export const dynamic = 'force-dynamic';

const CheckoutSchema = z.object({
  slug: z.string().min(1, 'slug zorunlu'),
  licenseType: z.enum(['single', 'white-label', 'agency']).optional(),
  buyerEmail: z.string().email('Gecerli email zorunlu'),
  buyerName: z.string().min(1).max(120).optional(),
  workspaceId: z.string().min(1).optional(),
  provider: z.enum(['gumroad', 'lemonsqueezy']).optional(),
});
export type CheckoutInput = z.infer<typeof CheckoutSchema>;

interface CheckoutResponse {
  checkoutUrl: string;
  purchaseId: string;
  provider: 'gumroad' | 'lemonsqueezy';
  amountCents: number;
  currency: string;
  externalId: string;
}

/**
 * GUMROAD_PRODUCT_MAP { "<product_id>": "<slug>" } → ters cevirip
 * slug → product_id eslemesi uretir.
 */
function reverseProductMap(map: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [pid, slug] of Object.entries(map)) {
    out[slug] = pid;
  }
  return out;
}

async function handler(req: NextRequest) {
  return withErrorHandling(async () => {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return fail(new z.ZodError([{ code: 'custom', path: [], message: 'Body JSON olmali' }]));
    }

    const parsed = CheckoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return fail(parsed.error);
    }

    const input = parsed.data;

    // 1. Template bul
    const template = await prisma.templateListing.findUnique({
      where: { slug: input.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        priceCents: true,
        currency: true,
        licenseType: true,
        active: true,
      },
    });
    if (!template || !template.active) {
      return fail(new z.ZodError([{ code: 'custom', path: ['slug'], message: 'Template bulunamadi veya aktif degil' }]));
    }

    // 2. Provider sec
    const provider = resolveProvider(input.provider);
    if (!provider) {
      return fail(new z.ZodError([{
        code: 'custom',
        path: ['provider'],
        message: 'Satis kanali (gumroad veya lemonsqueezy) yapilandirilmamis',
      }]));
    }

    // 3. Reverse product-map → slug → provider-specific product/variant id
    let productExternalId: string | undefined;
    if (provider === 'gumroad') {
      const reverse = reverseProductMap(getGumroadProductMap());
      productExternalId = reverse[template.slug];
    } else {
      const reverse = reverseProductMap(getLemonSqueezyProductMap());
      productExternalId = reverse[template.slug];
    }

    if (!productExternalId) {
      return fail(new z.ZodError([{
        code: 'custom',
        path: ['slug'],
        message: `Template "${template.slug}" icin ${provider} urun eslemesi yok. ${provider === 'gumroad' ? 'GUMROAD_PRODUCT_MAP' : 'LEMONSQUEEZY_PRODUCT_MAP'} env'sine ekleyin.`,
      }]));
    }

    // 4. Pending purchase olustur veya mevcut pending'i kullan
    const existingPending = await prisma.templatePurchase.findFirst({
      where: {
        templateId: template.id,
        buyerEmail: input.buyerEmail,
        status: 'pending',
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    const licenseType = input.licenseType ?? template.licenseType;

    let purchaseId: string;
    if (existingPending) {
      purchaseId = existingPending.id;
    } else {
      try {
        const created = await prisma.templatePurchase.create({
          data: {
            template: { connect: { id: template.id } },
            buyerEmail: input.buyerEmail,
            buyerName: input.buyerName ?? null,
            workspace: input.workspaceId ? { connect: { id: input.workspaceId } } : undefined,
            source: provider,
            // externalId unique — pending icin unique placeholder uretiyoruz.
            // Webhook geldikten sonra gercek externalId ile UPDATE edilecek.
            externalId: `pending_${cuidLike()}`,
            amountCents: template.priceCents,
            currency: template.currency,
            status: 'pending',
            webhookPayload: { initiatedAt: new Date().toISOString(), licenseType } as Prisma.InputJsonValue,
          },
          select: { id: true },
        });
        purchaseId = created.id;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          // externalId cakismasi — yeniden dene (cok dusuk olasilik)
          return fail(new z.ZodError([{ code: 'custom', path: [], message: 'Lutfen tekrar deneyin' }]));
        }
        throw err;
      }
    }

    // 5. Checkout URL olustur
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/dashboard/templates?purchase=${purchaseId}`;

    let checkoutUrl: string;

    if (provider === 'gumroad') {
      // Gumroad hosted checkout URL — product_permalink slug ile eslesir.
      // ?wanted=true query param'i "Add to cart" yerine direkt checkout'a goturur.
      // Email/name query params doldurulursa Gumroad otomatik onceden doldurur.
      const params = new URLSearchParams({
        wanted: 'true',
        email: input.buyerEmail,
      });
      if (input.buyerName) params.set('name', input.buyerName);
      // purchaseId custom_data olarak Gumroad tarafindan webhook payload'inda geri gelir
      params.set('purchases[0][variants][0]', productExternalId);
      checkoutUrl = `https://noktanyus.gumroad.com/l/${encodeURIComponent(productExternalId)}?${params.toString()}`;
    } else {
      const lsResult = await createLemonSqueezyCheckout({
        variantId: productExternalId,
        buyerEmail: input.buyerEmail,
        buyerName: input.buyerName,
        redirectUrl,
        customData: {
          purchaseId,
          templateSlug: template.slug,
          licenseType,
        },
      });

      if (!lsResult.success || !lsResult.checkoutUrl) {
        logger.error('[Checkout] Lemon Squeezy checkout create failed', {
          purchaseId,
          error: lsResult.error,
        });
        return fail(new z.ZodError([{
          code: 'custom',
          path: [],
          message: lsResult.error ?? 'Checkout URL olusturulamadi',
        }]));
      }

      checkoutUrl = lsResult.checkoutUrl;
    }

    logger.info('[Checkout] pending purchase + checkout url generated', {
      purchaseId,
      provider,
      templateSlug: template.slug,
      amountCents: template.priceCents,
    });

    const response: CheckoutResponse = {
      checkoutUrl,
      purchaseId,
      provider,
      amountCents: template.priceCents,
      currency: template.currency,
      externalId: productExternalId,
    };

    return ok(response, { status: 201 });
  });
}

export const POST = withRateLimit(RateLimits.api, handler);

/**
 * Provider secimi:
 *   1. body.provider verilmisse ve config OK ise onu kullan
 *   2. Aksi halde hangisi yapilandirilmissa onu sec (gumroad oncelikli)
 *   3. Hiçbiri yapili degilse null don
 */
function resolveProvider(requested?: 'gumroad' | 'lemonsqueezy'): 'gumroad' | 'lemonsqueezy' | null {
  if (requested === 'gumroad') return isGumroadConfigured() ? 'gumroad' : null;
  if (requested === 'lemonsqueezy') return isLemonSqueezyCheckoutConfigured() ? 'lemonsqueezy' : null;

  // Auto: gumroad oncelikli (daha basit, hosted URL)
  if (isGumroadConfigured()) return 'gumroad';
  if (isLemonSqueezyCheckoutConfigured()) return 'lemonsqueezy';
  // Sadece webhook secret tanimli ama checkout env'leri eksikse lemonsqueezy
  // uretemeyiz — null don ki hata mesaji anlamli olsun.
  if (isLemonSqueezyConfigured() && !isLemonSqueezyCheckoutConfigured()) return null;
  return null;
}

/**
 * Prisma'siz hizli unique ID (pending purchase externalId placeholder).
 * Cuid yerine dogrudan crypto.randomUUID kullanmak externalId cakisma riskini
 * ihmal edilebilir seviyeye indirir (36 char, hex+hyphen).
 */
function cuidLike(): string {
  // node:global crypto — Next 14+ ile uyumlu
  return (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, '');
}
