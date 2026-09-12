/**
 * Post-Checkout Side Effects Tests (item 7)
 *
 * `handleCheckoutCompleted` eskiden receipt e-postası, giden webhook,
 * notification, affiliate, loyalty ve partner adımlarını istek yolunda `await`
 * ediyordu. Bu testler:
 *   1. Adımların hâlâ ÇALIŞTIĞINI doğrular (kuyruğa taşırken kaybolmadı) —
 *      "mevcut testlerde kırılan çağrıları telafi et".
 *   2. Bir adımın patlamasının diğerlerini ETKİLEMEDİĞİNİ doğrular.
 *   3. Fonksiyonun HİÇ throw etmediğini doğrular (attempts=1, çift mail yok).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { order: { findUnique: vi.fn() } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/emailService', () => ({
  emailService: { sendReceipt: vi.fn(async () => ({ success: true })) },
}));

vi.mock('@/modules/webhooks', () => ({
  webhookService: { dispatchEvent: vi.fn(async () => undefined) },
}));

vi.mock('@/modules/notifications', () => ({
  notificationService: { dispatch: vi.fn(async () => null) },
}));

vi.mock('@/modules/affiliate', () => ({
  affiliateService: { trackConversion: vi.fn(async () => null) },
}));

vi.mock('@/modules/partners', () => ({
  partnerService: { markLeadConverted: vi.fn(async () => null) },
}));

vi.mock('@/modules/loyalty', () => ({
  loyaltyService: { onPurchase: vi.fn(async () => null) },
}));

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { emailService } from '@/lib/emailService';
import { webhookService } from '@/modules/webhooks';
import { notificationService } from '@/modules/notifications';
import { affiliateService } from '@/modules/affiliate';
import { partnerService } from '@/modules/partners';
import { loyaltyService } from '@/modules/loyalty';
import { runPostCheckoutSideEffects } from '../postCheckout';

const ALL_STEPS = [
  'receipt-email',
  'webhook-dispatch',
  'notification',
  'affiliate',
  'loyalty',
  'partner-lead',
];

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order_1',
    orderNumber: 'NK-2601-ABC123',
    customerEmail: 'buyer@example.com',
    userId: 'user_1',
    totalCents: 15000,
    currency: 'try',
    customer: { name: 'Ada Lovelace' },
    items: [
      {
        productId: 'p1',
        productTitle: 'Şablon Paketi',
        quantity: 1,
        unitPriceCents: 15000,
      },
    ],
    licenses: [{ key: 'NOKT-AAAA-BBBB-CCCC-DDDD', productId: 'p1' }],
    ...overrides,
  };
}

describe('runPostCheckoutSideEffects — mutlu yol', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as any);
  });

  it('TÜM adımları çalıştırır (kuyruğa taşınırken hiçbiri kaybolmadı)', async () => {
    const result = await runPostCheckoutSideEffects('order_1');

    expect(result.found).toBe(true);
    expect(result.failedSteps).toEqual([]);
    expect(result.outcomes.map((o) => o.step)).toEqual(ALL_STEPS);
    expect(result.outcomes.every((o) => o.ok)).toBe(true);
  });

  it('receipt e-postası lisans anahtarları ve ürün başlıklarıyla gönderilir', async () => {
    await runPostCheckoutSideEffects('order_1');

    expect(emailService.sendReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: 'Ada Lovelace',
        customerEmail: 'buyer@example.com',
        orderNumber: 'NK-2601-ABC123',
        totalCents: 15000,
        currency: 'try',
        items: [{ title: 'Şablon Paketi', quantity: 1, priceCents: 15000 }],
        licenses: [{ key: 'NOKT-AAAA-BBBB-CCCC-DDDD', productTitle: 'Şablon Paketi' }],
      })
    );
  });

  it('order.paid webhook.u doğru payload ile dispatch edilir', async () => {
    await runPostCheckoutSideEffects('order_1');

    expect(webhookService.dispatchEvent).toHaveBeenCalledWith('order.paid', {
      orderId: 'order_1',
      orderNumber: 'NK-2601-ABC123',
      totalCents: 15000,
      currency: 'try',
      customerEmail: 'buyer@example.com',
    });
  });

  it('in-app notification kullanıcıya gönderilir', async () => {
    await runPostCheckoutSideEffects('order_1');

    expect(notificationService.dispatch).toHaveBeenCalledWith(
      'user_1',
      'order.paid',
      expect.objectContaining({
        title: 'Siparişiniz Tamamlandı',
        relatedType: 'Order',
        relatedId: 'order_1',
      })
    );
  });

  it('affiliate, loyalty ve partner adımları çağrılır', async () => {
    await runPostCheckoutSideEffects('order_1');

    expect(affiliateService.trackConversion).toHaveBeenCalledWith('order_1');
    expect(loyaltyService.onPurchase).toHaveBeenCalledWith('order_1', 'user_1', 15000);
    expect(partnerService.markLeadConverted).toHaveBeenCalledWith({
      customerEmail: 'buyer@example.com',
      orderId: 'order_1',
      orderAmountCents: 15000,
    });
  });

  it('lisans yoksa boş licenses listesiyle mail gider', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeOrder({ licenses: [] }) as any
    );

    await runPostCheckoutSideEffects('order_1');

    expect(emailService.sendReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ licenses: [] })
    );
  });

  it('customer null ise customerName undefined olur', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeOrder({ customer: null }) as any
    );

    await runPostCheckoutSideEffects('order_1');

    expect(emailService.sendReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ customerName: undefined })
    );
  });
});

describe('runPostCheckoutSideEffects — misafir sipariş (userId yok)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeOrder({ userId: null }) as any
    );
  });

  it('loyalty ATLANIR (eski davranış korunur)', async () => {
    const result = await runPostCheckoutSideEffects('order_1');

    expect(loyaltyService.onPurchase).not.toHaveBeenCalled();
    const loyalty = result.outcomes.find((o) => o.step === 'loyalty');
    expect(loyalty).toEqual({ step: 'loyalty', ok: true, skipped: true });
    expect(result.failedSteps).toEqual([]);
  });

  it('receipt/webhook/affiliate/partner yine çalışır', async () => {
    await runPostCheckoutSideEffects('order_1');

    expect(emailService.sendReceipt).toHaveBeenCalled();
    expect(webhookService.dispatchEvent).toHaveBeenCalled();
    expect(affiliateService.trackConversion).toHaveBeenCalled();
    expect(partnerService.markLeadConverted).toHaveBeenCalled();
  });

  it('notification userId null ile çağrılır (servis kendi içinde atlar)', async () => {
    await runPostCheckoutSideEffects('order_1');
    expect(notificationService.dispatch).toHaveBeenCalledWith(
      null,
      'order.paid',
      expect.anything()
    );
  });
});

describe('runPostCheckoutSideEffects — adım izolasyonu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as any);
  });

  it('receipt e-postası patlarsa diğer TÜM adımlar yine çalışır', async () => {
    vi.mocked(emailService.sendReceipt).mockRejectedValueOnce(new Error('SMTP down'));

    const result = await runPostCheckoutSideEffects('order_1');

    expect(result.failedSteps).toEqual(['receipt-email']);
    expect(webhookService.dispatchEvent).toHaveBeenCalled();
    expect(notificationService.dispatch).toHaveBeenCalled();
    expect(affiliateService.trackConversion).toHaveBeenCalled();
    expect(loyaltyService.onPurchase).toHaveBeenCalled();
    expect(partnerService.markLeadConverted).toHaveBeenCalled();
  });

  it('webhook dispatch patlarsa sonraki adımlar etkilenmez', async () => {
    vi.mocked(webhookService.dispatchEvent).mockRejectedValueOnce(new Error('timeout'));

    const result = await runPostCheckoutSideEffects('order_1');

    expect(result.failedSteps).toEqual(['webhook-dispatch']);
    expect(loyaltyService.onPurchase).toHaveBeenCalled();
  });

  it('affiliate patlarsa loyalty ve partner yine çalışır', async () => {
    vi.mocked(affiliateService.trackConversion).mockRejectedValueOnce(
      new Error('affiliate down')
    );

    const result = await runPostCheckoutSideEffects('order_1');

    expect(result.failedSteps).toEqual(['affiliate']);
    expect(loyaltyService.onPurchase).toHaveBeenCalled();
    expect(partnerService.markLeadConverted).toHaveBeenCalled();
  });

  it('TÜM adımlar patlasa bile fonksiyon throw ETMEZ', async () => {
    // mockRejectedValueOnce: kalıcı implementasyon bırakmaz, sonraki testlere
    // sızmaz (clearAllMocks çağrıları temizler ama implementasyonu temizlemez).
    vi.mocked(emailService.sendReceipt).mockRejectedValueOnce(new Error('e1'));
    vi.mocked(webhookService.dispatchEvent).mockRejectedValueOnce(new Error('e2'));
    vi.mocked(notificationService.dispatch).mockRejectedValueOnce(new Error('e3'));
    vi.mocked(affiliateService.trackConversion).mockRejectedValueOnce(new Error('e4'));
    vi.mocked(loyaltyService.onPurchase).mockRejectedValueOnce(new Error('e5'));
    vi.mocked(partnerService.markLeadConverted).mockRejectedValueOnce(new Error('e6'));

    const result = await runPostCheckoutSideEffects('order_1');

    expect(result.failedSteps).toEqual(ALL_STEPS);
    expect(result.outcomes.every((o) => !o.ok)).toBe(true);
  });

  it('başarısız adımlar error seviyesinde toplu loglanır', async () => {
    vi.mocked(emailService.sendReceipt).mockRejectedValueOnce(new Error('SMTP down'));

    await runPostCheckoutSideEffects('order_1');

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('yan etkiler başarısız'),
      expect.objectContaining({
        orderId: 'order_1',
        failedSteps: ['receipt-email'],
      })
    );
  });

  it('hata mesajı outcome içinde taşınır', async () => {
    vi.mocked(emailService.sendReceipt).mockRejectedValueOnce(new Error('SMTP down'));

    const result = await runPostCheckoutSideEffects('order_1');

    expect(result.outcomes.find((o) => o.step === 'receipt-email')).toMatchObject({
      ok: false,
      error: 'SMTP down',
    });
  });
});

describe('runPostCheckoutSideEffects — sipariş bulunamadı', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);
  });

  it('found=false döner, hiçbir yan etki tetiklenmez, throw etmez', async () => {
    const result = await runPostCheckoutSideEffects('yok');

    expect(result).toEqual({ orderId: 'yok', found: false, outcomes: [], failedSteps: [] });
    expect(emailService.sendReceipt).not.toHaveBeenCalled();
    expect(webhookService.dispatchEvent).not.toHaveBeenCalled();
  });

  it('uyarı loglar', async () => {
    await runPostCheckoutSideEffects('yok');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Sipariş bulunamadı'),
      expect.objectContaining({ orderId: 'yok' })
    );
  });
});
