/**
 * Ödeme Sonrası Yan Etkiler — çekirdek: receipt, webhook, notification.
 * Affiliate / loyalty / partner kaldırıldı (hedefe odaklı temizlik).
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { emailService } from '@/lib/emailService';
import { webhookService } from '@/modules/webhooks';
import { notificationService } from '@/modules/notifications';

export interface SideEffectOutcome {
  step: string;
  ok: boolean;
  error?: string;
  skipped?: boolean;
}

export interface PostCheckoutResult {
  orderId: string;
  found: boolean;
  outcomes: SideEffectOutcome[];
  failedSteps: string[];
}

async function step(
  name: string,
  fn: () => Promise<unknown>,
  outcomes: SideEffectOutcome[]
): Promise<void> {
  try {
    await fn();
    outcomes.push({ step: name, ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('[postCheckout] Adım başarısız', { step: name, error: message });
    outcomes.push({ step: name, ok: false, error: message });
  }
}

export async function runPostCheckoutSideEffects(orderId: string): Promise<PostCheckoutResult> {
  const outcomes: SideEffectOutcome[] = [];

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, licenses: true, customer: true },
  });

  if (!order) {
    logger.warn('[postCheckout] Sipariş bulunamadı, atlandı', { orderId });
    return { orderId, found: false, outcomes, failedSteps: [] };
  }

  await step(
    'receipt-email',
    () =>
      emailService.sendReceipt({
        customerName: order.customer?.name ?? undefined,
        customerEmail: order.customerEmail,
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          title: item.productTitle,
          quantity: item.quantity,
          priceCents: item.unitPriceCents,
        })),
        totalCents: order.totalCents,
        currency: order.currency,
        licenses: order.licenses.map((lic) => ({
          key: lic.key,
          productTitle:
            order.items.find((i) => i.productId === lic.productId)?.productTitle ?? 'Ürün',
        })),
      }),
    outcomes
  );

  await step(
    'webhook-dispatch',
    () =>
      webhookService.dispatchEvent('order.paid', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        currency: order.currency,
        customerEmail: order.customerEmail,
      }),
    outcomes
  );

  await step(
    'notification',
    () =>
      notificationService.dispatch(order.userId, 'order.paid', {
        title: 'Siparişiniz Tamamlandı',
        message: `#${order.orderNumber} numaralı siparişiniz başarıyla tamamlandı.`,
        link: `/dashboard/orders`,
        icon: '🛒',
        relatedType: 'Order',
        relatedId: order.id,
      }),
    outcomes
  );

  const failedSteps = outcomes.filter((o) => !o.ok).map((o) => o.step);

  if (failedSteps.length) {
    logger.error('[postCheckout] Bazı yan etkiler başarısız', {
      orderId,
      orderNumber: order.orderNumber,
      failedSteps,
    });
  } else {
    logger.info('[postCheckout] Tüm yan etkiler tamamlandı', {
      orderId,
      orderNumber: order.orderNumber,
    });
  }

  return { orderId, found: true, outcomes, failedSteps };
}
