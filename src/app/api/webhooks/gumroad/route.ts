/**
 * POST /api/webhooks/gumroad
 *
 * Gumroad webhook endpoint — Phase 3 B.4
 *
 * Akis:
 *   1. Signature verify (HMAC SHA256, GUMROAD_WEBHOOK_SECRET)
 *   2. Payload parse → { saleId, email, productId, priceCents, currency, refunded }
 *   3. productId → templateSlug map (GUMROAD_PRODUCT_MAP veya product_permalink fallback)
 *   4. Slug'dan TemplateListing bul (yoksa 404 log, 200 don ki Gumroad retry etmesin)
 *   5. recordPurchaseAndIssueLicense() — idempotent (source+externalId)
 *   6. License olustuysa → emailService.sendTemplatePurchase()
 *   7. Refund durumu → license.revoke + installation delete (cascading)
 *
 * Gumroad docs: https://gumroad.com/ping
 * Event tipleri:
 *   "sale" — yeni satis
 *   "refund" — iade (refunded=true ile ayni event olarak da gelebilir)
 *   "dispute" — chargeback (refunded olarak ele al)
 *   "cancellation" — subscription iptali
 *
 * Idempotency: Prisma @@unique([source, externalId]) + recordPurchaseAndIssueLicense
 * kendi icinde idempotent. Iki kez ayni webhook gelirse 2. kez 200 doner,
 * yeni purchase olusmaz.
 *
 * Response her durumda 200 doner ki Gumroad retry etmesin — sadece
 * ciddi signature hatasi 400 doner (gercekten invalid).
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { normalizeCurrency } from '@/lib/currency';
import {
  isGumroadConfigured,
  parseGumroadSale,
  verifyGumroadWebhook,
} from '@/lib/gumroad';
import { recordPurchaseAndIssueLicense } from '@/modules/marketplace/templateService';
import { emailService } from '@/lib/emailService';

// Gumroad webhook raw body okumali — dynamic zorunlu
export const dynamic = 'force-dynamic';

export const POST = async (req: NextRequest) => {
  // 1. Signature header
  const signature = req.headers.get('gumroad-signature');
  if (!signature) {
    logger.warn('[Gumroad] webhook missing signature header');
    return Response.json(
      { success: false, error: 'Missing gumroad-signature header' },
      { status: 400 }
    );
  }

  // 2. Configured check (mock-mode defensive)
  if (!isGumroadConfigured()) {
    logger.warn('[Gumroad] webhook received but not configured');
    return Response.json(
      { success: false, error: 'Gumroad webhook not configured' },
      { status: 503 }
    );
  }

  // 3. Raw body + verify
  const rawBody = await req.text();
  if (!verifyGumroadWebhook(rawBody, signature)) {
    logger.warn('[Gumroad] webhook signature verification failed');
    return Response.json(
      { success: false, error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // 4. JSON parse + normalize
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    logger.warn('[Gumroad] webhook JSON parse failed', { error: err });
    return Response.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  // Gumroad resource_name kontrolu (sale/refund/dispute/cancellation)
  const resourceName = typeof payload.resource_name === 'string' ? payload.resource_name : null;
  if (!resourceName || !['sale', 'refund', 'dispute', 'cancellation'].includes(resourceName)) {
    logger.info('[Gumroad] ignoring unknown resource_name', { resourceName });
    return Response.json({ success: true, ignored: true });
  }

  const sale = parseGumroadSale(payload);
  if (!sale) {
    logger.warn('[Gumroad] webhook payload missing required fields', { payload });
    return Response.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // 5. Template bul — productSlug > productId fallback (direct lookup)
  let template = null;
  if (sale.productSlug) {
    template = await prisma.templateListing.findUnique({
      where: { slug: sale.productSlug },
      select: { id: true, slug: true, name: true, licenseType: true, active: true },
    });
  }
  if (!template && sale.productId) {
    // Son care: productId'yi slug olarak dene (admins may have set permalink = slug)
    template = await prisma.templateListing.findFirst({
      where: { slug: sale.productId },
      select: { id: true, slug: true, name: true, licenseType: true, active: true },
    });
  }

  if (!template) {
    logger.warn('[Gumroad] no template matched product', {
      saleId: sale.saleId,
      productId: sale.productId,
      productSlug: sale.productSlug,
    });
    // 200 don ki Gumroad retry etmesin; log ile admin farkeder
    return Response.json({ success: true, ignored: true, reason: 'no-template-match' });
  }

  // 6. Refund / cancellation akisi
  const isRevocation = sale.refunded || resourceName === 'refund' || resourceName === 'dispute' || resourceName === 'cancellation';
  if (isRevocation) {
    await handleGumroadRevocation({
      saleId: sale.saleId,
      email: sale.email,
      templateId: template.id,
      reason: resourceName,
    });
    return Response.json({ success: true, action: 'revoked' });
  }

  // 7. Yeni satis → idempotent purchase + license
  try {
    const purchase = await recordPurchaseAndIssueLicense({
      templateId: template.id,
      buyerEmail: sale.email,
      buyerName: sale.name,
      source: 'gumroad',
      externalId: sale.saleId,
      amountCents: sale.priceCents,
      currency: normalizeCurrency(sale.currency),
      status: 'completed',
      webhookPayload: payload as Record<string, unknown>,
    });

    await logAudit({
      action: 'CREATE',
      resource: 'TemplatePurchase',
      resourceId: purchase.id,
      details: {
        source: 'gumroad',
        externalId: sale.saleId,
        templateId: template.id,
        amountCents: sale.priceCents,
      },
      userEmail: sale.email,
    });

    // 8. Lisans bilgisini cek → email gonder
    const license = await prisma.templateLicense.findFirst({
      where: { purchasePriceCents: sale.priceCents, buyerEmail: sale.email, templateId: template.id },
      orderBy: { createdAt: 'desc' },
      select: { licenseKey: true, type: true },
    });

    if (license) {
      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
      await emailService.sendTemplatePurchase({
        buyerName: sale.name,
        buyerEmail: sale.email,
        templateName: template.name,
        templateSlug: template.slug,
        licenseKey: license.licenseKey,
        licenseType: license.type,
        amountCents: sale.priceCents,
        currency: sale.currency,
        orderNumber: purchase.id,
        dashboardUrl: `${baseUrl}/dashboard/templates`,
        installUrl: `${baseUrl}/dashboard/templates/install?key=${license.licenseKey}`,
        source: 'gumroad',
      });
    }

    logger.info('[Gumroad] webhook processed', {
      saleId: sale.saleId,
      purchaseId: purchase.id,
      templateSlug: template.slug,
    });

    return Response.json({ success: true, action: 'purchase-recorded' });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      // Duplicate (source, externalId) — zaten islenmis, idempotent 200
      logger.info('[Gumroad] webhook duplicate (already processed)', { saleId: sale.saleId });
      return Response.json({ success: true, action: 'duplicate' });
    }
    logger.error('[Gumroad] webhook processing failed', {
      saleId: sale.saleId,
      error: err,
    });
    // 500 ile Gumroad'a retry hakki ver (gercek hata)
    return Response.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
};

// =================== INTERNAL ===================

interface RevocationParams {
  saleId: string;
  email: string;
  templateId: string;
  reason: string;
}

/**
 * Gumroad refund/dispute/cancellation → license revoke + installation cleanup.
 *
 * Idempotent: license zaten revoked ise no-op. Mevcut TemplatePurchase
 * status'unu 'refunded' olarak isaretler (audit trail).
 */
async function handleGumroadRevocation(params: RevocationParams): Promise<void> {
  const { saleId, email, templateId, reason } = params;

  // Mevcut purchase'i bul
  const purchase = await prisma.templatePurchase.findUnique({
    where: {
      source_externalId: { source: 'gumroad', externalId: saleId },
    },
    select: { id: true },
  });

  if (!purchase) {
    logger.warn('[Gumroad] revocation: no purchase found', { saleId });
    return;
  }

  // Purchase status'u refunded olarak guncelle
  await prisma.templatePurchase.update({
    where: { id: purchase.id },
    data: { status: 'refunded' },
  });

  // Bu purchase'a bagli lisanslari revoke et + iliskili installation'lari sil
  const licenses = await prisma.templateLicense.findMany({
    where: {
      templateId,
      buyerEmail: email,
      purchasePriceCents: { gt: 0 }, // exclude free/manual issued ones
    },
    select: { id: true },
  });

  for (const lic of licenses) {
    // Installation'lari cascading delete (FK onDelete: Cascade)
    await prisma.templateInstallation.deleteMany({
      where: { licenseId: lic.id },
    });
    await prisma.templateLicense.update({
      where: { id: lic.id },
      data: { status: 'revoked' },
    });
  }

  await logAudit({
    action: 'REFUND',
    resource: 'TemplateLicense',
    resourceId: licenses[0]?.id,
    details: {
      source: 'gumroad',
      saleId,
      reason,
      licenseCount: licenses.length,
      purchaseId: purchase.id,
    },
    userEmail: email,
  });

  logger.info('[Gumroad] license(s) revoked', {
    saleId,
    reason,
    licenseCount: licenses.length,
  });
}
