/**
 * iyzico ödeme doğrulama + fulfillment.
 *
 * Checkout Form token'ını (POST body veya query) retrieve eder,
 * eşleşen PENDING siparişi / INCOMPLETE aboneliği tamamlar.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { iyzicoService } from './iyzicoService';
import { commerceService } from './service';

export type IyzicoFulfillResult =
  | { ok: true; kind: 'order'; orderNumber: string }
  | { ok: true; kind: 'subscription'; planSlug: string }
  | { ok: false; reason: 'invalid_token' | 'verify_failed' | 'not_found' | 'failed' };

function firstPaymentTransactionId(result: {
  itemTransactions?: Array<{ paymentTransactionId?: string }>;
}): string | undefined {
  const tx = result.itemTransactions?.[0];
  return tx?.paymentTransactionId;
}

export async function fulfillIyzicoToken(token: string): Promise<IyzicoFulfillResult> {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, reason: 'invalid_token' };

  let retrieve;
  try {
    retrieve = await iyzicoService.retrieveCheckout(trimmed);
  } catch (err) {
    logger.error('[iyzico] retrieve threw', { error: err });
    return { ok: false, reason: 'verify_failed' };
  }

  if (retrieve.status !== 'success' || retrieve.paymentStatus !== 'SUCCESS') {
    return { ok: false, reason: 'failed' };
  }

  const paymentTransactionId = firstPaymentTransactionId(retrieve);

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: trimmed },
  });

  if (order) {
    if (paymentTransactionId) {
      const metadata = {
        ...((order.metadata as Record<string, unknown> | null) ?? {}),
        paymentProvider: 'iyzico',
        paymentTransactionId,
      };
      await prisma.order.update({
        where: { id: order.id },
        data: { metadata, paymentProvider: 'iyzico' },
      });
    }

    await commerceService.handleCheckoutCompleted({
      id: trimmed,
      payment_intent: paymentTransactionId ?? trimmed,
    });

    logger.info('[iyzico] Order fulfilled', {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    return { ok: true, kind: 'order', orderNumber: order.orderNumber };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: trimmed },
    include: { customer: true, plan: true },
  });

  if (subscription) {
    await commerceService.activateIyzicoSubscription(subscription.id, {
      paymentTransactionId,
    });
    logger.info('[iyzico] Subscription fulfilled', {
      subscriptionId: subscription.id,
      planSlug: subscription.plan.slug,
    });
    return { ok: true, kind: 'subscription', planSlug: subscription.plan.slug };
  }

  return { ok: false, reason: 'not_found' };
}
