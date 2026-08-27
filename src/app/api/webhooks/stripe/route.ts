/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook endpoint. Signature doğrular, idempotency kontrolü yapar,
 * ilgili event handler'ı dispatch eder.
 *
 * Raw body gerekli olduğu için Next.js'in body parser'ı devre dışı bırakılmaz,
 * ama route handler req.text() ile raw body okur.
 */

import { NextRequest } from 'next/server';
import { commerceService } from '@/modules/commerce';
import { logger } from '@/lib/logger';
import { isStripeConfigured } from '@/lib/stripe';

// Stripe webhook için raw body gerekli — dynamic zorunlu
export const dynamic = 'force-dynamic';

export const POST = async (req: NextRequest) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  // Mock mode'da webhook'lar kabul edilmez (gerçek Stripe olmadan event üretilemez)
  if (!isStripeConfigured()) {
    return new Response('Stripe not configured', { status: 503 });
  }

  const payload = await req.text();

  let event;
  try {
    event = commerceService.verifyWebhook(payload, signature);
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err });
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    await commerceService.processWebhookEvent(event);
    return new Response('OK', { status: 200 });
  } catch (err) {
    logger.error('Webhook processing failed', { eventId: event.id, type: event.type, error: err });
    return new Response('Processing error', { status: 500 });
  }
};