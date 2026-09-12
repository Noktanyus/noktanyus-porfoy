/**
 * POST /api/webhooks/lemonsqueezy
 *
 * Lemon Squeezy webhook endpoint — Phase 3 B.4
 *
 * Akis:
 *   1. Signature verify (HMAC SHA256, X-Signature header, LEMONSQUEEZY_WEBHOOK_SECRET)
 *   2. Payload parse → { eventName, orderId, customerEmail, productId, amountCents, currency }
 *   3. productId → templateSlug map (LEMONSQUEEZY_PRODUCT_MAP)
 *   4. Slug'dan TemplateListing bul (yoksa 200 + log)
 *   5. Event tipine gore dispatch:
 *      - order_created / subscription_created → purchase + license + email
 *      - subscription_cancelled / order_refunded → revoke license
 *      - diger eventler → ignored
 *
 * Lemon Squeezy docs: https://docs.lemonsqueezy.com/api/webhooks
 * Event tipleri (meta.event_name):
 *   order_created, order_refunded,
 *   subscription_created, subscription_updated, subscription_cancelled,
 *   subscription_resumed, subscription_expired, subscription_payment_failed
 *
 * Idempotency: Prisma @@unique([source, externalId]) + recordPurchaseAndIssueLicense.
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { normalizeCurrency } from '@/lib/currency';
import {
  isLemonSqueezyConfigured,
  parseLemonSqueezyEvent,
  verifyLemonSqueezyWebhook,
} from '@/lib/lemonsqueezy';
import { recordPurchaseAndIssueLicense } from '@/modules/marketplace/templateService';
import { emailService } from '@/lib/emailService';

export const dynamic = 'force-dynamic';

/** Phase 3 B.4 kapsaminda islenen event isimleri. */
const PURCHASE_EVENTS = new Set(['order_created', 'subscription_created']);
const REVOCATION_EVENTS = new Set([
  'order_refunded',
  'subscription_cancelled',
]);

export const POST = async (req: NextRequest) => {
  // 1. Signature header
  const signature = req.headers.get('x-signature');
  if (!signature) {
    logger.warn('[LemonSqueezy] webhook missing X-Signature header');
    return Response.json(
      { success: false, error: 'Missing X-Signature header' },
      { status: 400 }
    );
  }

  // 2. Configured check
  if (!isLemonSqueezyConfigured()) {
    logger.warn('[LemonSqueezy] webhook received but not configured');
    return Response.json(
      { success: false, error: 'Lemon Squeezy webhook not configured' },
      { status: 503 }
    );
  }

  // 3. Raw body + verify
  const rawBody = await req.text();
  if (!verifyLemonSqueezyWebhook(rawBody, signature)) {
    logger.warn('[LemonSqueezy] webhook signature verification failed');
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
    logger.warn('[LemonSqueezy] webhook JSON parse failed', { error: err });
    return Response.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const event = parseLemonSqueezyEvent(payload);
  if (!event) {
    logger.warn('[LemonSqueezy] webhook payload missing required fields', { payload });
    return Response.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // 5. Event routing
  if (!PURCHASE_EVENTS.has(event.eventName) && !REVOCATION_EVENTS.has(event.eventName)) {
    logger.info('[LemonSqueezy] ignoring event', { eventName: event.eventName });
    return Response.json({ success: true, ignored: true, eventName: event.eventName });
  }

  // 6. Template bul
  let template = null;
  if (event.productSlug) {
    template = await prisma.templateListing.findUnique({
      where: { slug: event.productSlug },
      select: { id: true, slug: true, name: true, licenseType: true, active: true },
    });
  }
  if (!template && event.productId) {
    template = await prisma.templateListing.findFirst({
      where: { slug: event.productId },
      select: { id: true, slug: true, name: true, licenseType: true, active: true },
    });
  }

  if (!template) {
    logger.warn('[LemonSqueezy] no template matched product', {
      orderId: event.orderId,
      productId: event.productId,
      productSlug: event.productSlug,
    });
    return Response.json({ success: true, ignored: true, reason: 'no-template-match' });
  }

  // 7. Revocation
  if (REVOCATION_EVENTS.has(event.eventName)) {
    await handleLemonSqueezyRevocation({
      orderId: event.orderId,
      email: event.customerEmail,
      templateId: template.id,
      reason: event.eventName,
    });
    return Response.json({ success: true, action: 'revoked' });
  }

  // 8. Purchase + license (idempotent)
  try {
    const purchase = await recordPurchaseAndIssueLicense({
      templateId: template.id,
      buyerEmail: event.customerEmail,
      buyerName: event.customerName,
      source: 'lemonsqueezy',
      externalId: event.orderId,
      amountCents: event.amountCents,
      currency: normalizeCurrency(event.currency),
      status: 'completed',
      webhookPayload: payload as Record<string, unknown>,
    });

    await logAudit({
      action: 'CREATE',
      resource: 'TemplatePurchase',
      resourceId: purchase.id,
      details: {
        source: 'lemonsqueezy',
        externalId: event.orderId,
        eventName: event.eventName,
        templateId: template.id,
        amountCents: event.amountCents,
      },
      userEmail: event.customerEmail,
    });

    // 9. License key cek → email gonder
    const license = await prisma.templateLicense.findFirst({
      where: {
        buyerEmail: event.customerEmail,
        templateId: template.id,
      },
      orderBy: { createdAt: 'desc' },
      select: { licenseKey: true, type: true },
    });

    if (license) {
      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
      await emailService.sendTemplatePurchase({
        buyerName: event.customerName,
        buyerEmail: event.customerEmail,
        templateName: template.name,
        templateSlug: template.slug,
        licenseKey: license.licenseKey,
        licenseType: license.type,
        amountCents: event.amountCents,
        currency: event.currency,
        orderNumber: purchase.id,
        dashboardUrl: `${baseUrl}/dashboard/templates`,
        installUrl: `${baseUrl}/dashboard/templates/install?key=${license.licenseKey}`,
        source: 'lemonsqueezy',
      });
    }

    logger.info('[LemonSqueezy] webhook processed', {
      orderId: event.orderId,
      eventName: event.eventName,
      purchaseId: purchase.id,
      templateSlug: template.slug,
    });

    return Response.json({ success: true, action: 'purchase-recorded' });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      logger.info('[LemonSqueezy] webhook duplicate (already processed)', {
        orderId: event.orderId,
      });
      return Response.json({ success: true, action: 'duplicate' });
    }
    logger.error('[LemonSqueezy] webhook processing failed', {
      orderId: event.orderId,
      error: err,
    });
    return Response.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
};

// =================== INTERNAL ===================

interface RevocationParams {
  orderId: string;
  email: string;
  templateId: string;
  reason: string;
}

async function handleLemonSqueezyRevocation(params: RevocationParams) {
  const { orderId, email, templateId, reason } = params;

  const purchase = await prisma.templatePurchase.findUnique({
    where: {
      source_externalId: { source: 'lemonsqueezy', externalId: orderId },
    },
    select: { id: true },
  });

  if (!purchase) {
    logger.warn('[LemonSqueezy] revocation: no purchase found', { orderId });
    return;
  }

  await prisma.templatePurchase.update({
    where: { id: purchase.id },
    data: { status: 'refunded' },
  });

  // Bu buyer+template'a ait tum lisanslari revoke et + installation'lari sil
  const licenses = await prisma.templateLicense.findMany({
    where: {
      templateId,
      buyerEmail: email,
    },
    select: { id: true },
  });

  for (const lic of licenses) {
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
      source: 'lemonsqueezy',
      orderId,
      reason,
      licenseCount: licenses.length,
      purchaseId: purchase.id,
    },
    userEmail: email,
  });

  logger.info('[LemonSqueezy] license(s) revoked', {
    orderId,
    reason,
    licenseCount: licenses.length,
  });
}
