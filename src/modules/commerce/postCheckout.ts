/**
 * Ödeme Sonrası Yan Etkiler — çekirdek: receipt, webhook, notification.
 * Affiliate / loyalty / partner kaldırıldı (hedefe odaklı temizlik).
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { resolveOrderItems } from './orderUtils';
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

  const resolvedItems = resolveOrderItems(order);

  await step(
    'receipt-email',
    () =>
      emailService.sendReceipt({
        customerName: order.customer?.name ?? undefined,
        customerEmail: order.customerEmail,
        orderNumber: order.orderNumber,
        items: resolvedItems.map((item) => ({
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

  await step(
    'loyalty-points',
    async () => {
      let userId = order.userId;
      if (!userId && order.customerEmail) {
        const user = await prisma.user.findUnique({
          where: { email: order.customerEmail.toLowerCase().trim() },
          select: { id: true },
        });
        if (user) userId = user.id;
      }

      if (!userId || order.totalCents <= 0) {
        return;
      }

      // Her 1 TL için 1 sadakat puanı (100 cent = 1 TL = 1 puan)
      const earnedPoints = Math.max(1, Math.floor(order.totalCents / 100));

      // Idempotency: Bu sipariş için daha önce puan eklenmiş mi kontrol et
      const existingTx = await prisma.loyaltyTransaction.findFirst({
        where: { reference: order.id, type: 'earn' },
      });
      if (existingTx) return;

      let account = await prisma.loyaltyAccount.findUnique({ where: { userId } });
      if (!account) {
        account = await prisma.loyaltyAccount.create({ data: { userId } });
      }

      const newPoints = account.points + earnedPoints;
      const newLifetime = account.lifetimePoints + earnedPoints;

      let newTier = 'bronze';
      if (newLifetime >= 5000) newTier = 'platinum';
      else if (newLifetime >= 2000) newTier = 'gold';
      else if (newLifetime >= 500) newTier = 'silver';

      await prisma.$transaction([
        prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            points: newPoints,
            lifetimePoints: newLifetime,
            tier: newTier,
          },
        }),
        prisma.loyaltyTransaction.create({
          data: {
            accountId: account.id,
            type: 'earn',
            points: earnedPoints,
            balance: newPoints,
            reason: `#${order.orderNumber} siparişinden kazanılan puan`,
            reference: order.id,
          },
        }),
      ]);

      logger.info('[postCheckout] Sadakat puanı eklendi', {
        orderId: order.id,
        userId,
        earnedPoints,
        newPoints,
        tier: newTier,
      });
    },
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
