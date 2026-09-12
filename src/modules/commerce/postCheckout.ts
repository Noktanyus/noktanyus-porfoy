/**
 * Ödeme Sonrası Yan Etkiler (Post-Checkout Side Effects)
 *
 * `handleCheckoutCompleted` eskiden sipariş PAID olduktan sonra sırayla şunları
 * BEKLİYORDU: receipt e-postası (React email render + SMTP), giden webhook
 * dispatch (HTTP), in-app notification, affiliate komisyonu, loyalty puanı,
 * partner lead. Hepsi aynı istek içinde, `await` ile.
 *
 * Sorun bunun Stripe webhook route'unda çalışması: Stripe ~10 saniyede yanıt
 * bekler; alamazsa event'i başarısız sayıp tekrar gönderir. SMTP veya müşterinin
 * webhook endpoint'i yavaşsa sipariş DB'de PAID olmuş ama Stripe 500/timeout
 * görüp aynı event'i tekrar teslim eder.
 *
 * Bu modül o zinciri istek yolundan çıkarır. `Jobs.OrderPostCheckout` handler'ı
 * buradaki fonksiyonu çağırır.
 *
 * RETRY POLİTİKASI — bilinçli olarak attempts=1
 * ---------------------------------------------
 * Adımların çoğu idempotent DEĞİL (receipt e-postası tekrar gönderilir,
 * notification tekrar yaratılır). Job seviyesinde retry, müşteriye iki kez mail
 * gitmesi demek. Bu yüzden her adım kendi içinde izole edilir (biri patlarsa
 * diğerleri çalışır), sonuç raporlanır ve job FIRLATMAZ. affiliate/partner gibi
 * zaten kendi içinde idempotency taşıyan adımlar bundan etkilenmez.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { emailService } from '@/lib/emailService';
import { webhookService } from '@/modules/webhooks';
import { notificationService } from '@/modules/notifications';
import { affiliateService } from '@/modules/affiliate';
import { partnerService } from '@/modules/partners';
import { loyaltyService } from '@/modules/loyalty';

/** Tek bir yan etki adımının sonucu. */
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

/** Adımı izole eder: hata yukarı sızmaz, sonuç raporlanır. */
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

/**
 * Sipariş PAID olduktan sonraki tüm yan etkileri çalıştırır.
 * Sipariş bulunamazsa sessizce döner (silinmiş/replay edilmiş job).
 */
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

  // --- 1. Receipt e-postası (lisans anahtarları dahil) ---
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

  // --- 2. Giden webhook (order.paid) ---
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

  // --- 3. In-app notification ---
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

  // --- 4. Affiliate komisyonu ---
  await step('affiliate', () => affiliateService.trackConversion(order.id), outcomes);

  // --- 5. Loyalty puanı (yalnızca kayıtlı kullanıcı) ---
  if (order.userId) {
    const userId = order.userId;
    await step(
      'loyalty',
      () => loyaltyService.onPurchase(order.id, userId, order.totalCents),
      outcomes
    );
  } else {
    outcomes.push({ step: 'loyalty', ok: true, skipped: true });
  }

  // --- 6. Partner lead conversion ---
  await step(
    'partner-lead',
    () =>
      partnerService.markLeadConverted({
        customerEmail: order.customerEmail,
        orderId: order.id,
        orderAmountCents: order.totalCents,
      }),
    outcomes
  );

  const failedSteps = outcomes.filter((o) => !o.ok).map((o) => o.step);

  if (failedSteps.length) {
    // Job FIRLATMAZ (bkz. dosya başı retry politikası) — ama sessiz de kalmaz.
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
