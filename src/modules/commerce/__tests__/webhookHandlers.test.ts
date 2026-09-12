/**
 * Commerce Webhook Handler Wiring Tests
 *
 * Doğrulanan sözleşmeler:
 *   - handleCheckoutCompleted artık yan etkileri BEKLEMEZ, kuyruğa alır (item 7)
 *   - handleSubscriptionChange/Cancel subscriptionSync'e delege eder (item 1)
 *   - Bozuk Stripe payload'ı webhook'u 500'e düşürmez
 *   - processWebhookEvent idempotency'si korunur
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    digitalProduct: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    plan: { findMany: vi.fn(), findUnique: vi.fn() },
    order: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    customer: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    license: { create: vi.fn(), findUnique: vi.fn() },
    subscription: { upsert: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    userSubscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    webhookEvent: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
    billingPortal: { sessions: { create: vi.fn() } },
  },
  isStripeConfigured: vi.fn(() => false),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Kuyruk: gerçek queue'ya dokunmadan enqueue çağrısını gözlemle.
vi.mock('@/lib/queueService', () => ({
  queueService: {
    enqueueOrderPostCheckout: vi.fn(async () => undefined),
  },
}));

// subscriptionSync: normalize/fromStripeEpoch GERÇEK kalsın, servis mock'lansın.
vi.mock('../subscriptionSync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../subscriptionSync')>();
  return {
    ...actual,
    subscriptionSyncService: {
      syncFromStripe: vi.fn(async () => ({ synced: true, subscriptionId: 's1' })),
      cancelFromStripe: vi.fn(async () => ({
        synced: true,
        userSubscriptionUpdated: true,
      })),
    },
  };
});

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { queueService } from '@/lib/queueService';
import { commerceService } from '../service';
import { subscriptionSyncService } from '../subscriptionSync';

const NOW_SEC = 1_700_000_000;

const orderRow = {
  id: 'order_1',
  orderNumber: 'NK-2601-ABC123',
  status: 'PENDING',
  customerEmail: 'buyer@example.com',
  userId: 'user_1',
  totalCents: 15000,
  currency: 'try',
  customer: { name: 'Ada' },
  items: [{ productId: 'p1', productTitle: 'X', quantity: 1, unitPriceCents: 15000 }],
  licenses: [],
};

describe('handleCheckoutCompleted — bloklayıcı olmayan akış (item 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...orderRow } as any);
    vi.mocked(prisma.order.update).mockResolvedValue({ ...orderRow } as any);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({
      id: 'cust_1',
      email: 'buyer@example.com',
    } as any);
    // getOrCreate mevcut customer'ı update edip DÖNER — mock'un dönüş değeri şart.
    vi.mocked(prisma.customer.update).mockResolvedValue({
      id: 'cust_1',
      email: 'buyer@example.com',
    } as any);
    vi.mocked(prisma.license.create).mockResolvedValue({
      id: 'lic1',
      key: 'NOKT-A-B-C-D',
      productId: 'p1',
    } as any);
  });

  it('siparişi PAID yapar ve lisans üretir', async () => {
    await commerceService.handleCheckoutCompleted({ id: 'sess_1', payment_intent: 'pi_1' });

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PAID', stripePaymentIntent: 'pi_1' }),
      })
    );
    expect(prisma.license.create).toHaveBeenCalled();
  });

  it('yan etkileri KUYRUĞA alır (istek yolunda beklemez)', async () => {
    await commerceService.handleCheckoutCompleted({ id: 'sess_1', payment_intent: 'pi_1' });

    expect(queueService.enqueueOrderPostCheckout).toHaveBeenCalledWith({
      orderId: 'order_1',
    });
    expect(queueService.enqueueOrderPostCheckout).toHaveBeenCalledTimes(1);
  });

  it('order zaten PAID ise hiçbir şey yapmaz (idempotent)', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      ...orderRow,
      status: 'PAID',
    } as any);

    await commerceService.handleCheckoutCompleted({ id: 'sess_1' });

    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(queueService.enqueueOrderPostCheckout).not.toHaveBeenCalled();
  });

  it('order bulunamazsa sessizce döner', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    await expect(
      commerceService.handleCheckoutCompleted({ id: 'yok' })
    ).resolves.toBeUndefined();
    expect(queueService.enqueueOrderPostCheckout).not.toHaveBeenCalled();
  });
});

describe('handleSubscriptionChange — subscriptionSync delegasyonu (item 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function stripeSub(overrides: Record<string, unknown> = {}) {
    return {
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
      current_period_start: NOW_SEC,
      current_period_end: NOW_SEC + 30 * 86_400,
      cancel_at_period_end: false,
      items: { data: [{ price: { id: 'price_pro' } }] },
      ...overrides,
    };
  }

  it('normalize edilmiş girdiyle syncFromStripe çağırır', async () => {
    await commerceService.handleSubscriptionChange(stripeSub());

    expect(subscriptionSyncService.syncFromStripe).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        stripePriceId: 'price_pro',
        stripeStatus: 'active',
        cancelAtPeriodEnd: false,
      })
    );
  });

  it('Subscription tablosuna DOĞRUDAN yazmaz (tek sözleşme)', async () => {
    await commerceService.handleSubscriptionChange(stripeSub());

    // Artık upsert subscriptionSync içinde; servis katmanı elini sürmez.
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it('bozuk payload.ta sync ÇAĞRILMAZ ve hata fırlatılmaz (webhook 500 olmasın)', async () => {
    await expect(
      commerceService.handleSubscriptionChange({ id: 'sub_1' })
    ).resolves.toBeUndefined();

    expect(subscriptionSyncService.syncFromStripe).not.toHaveBeenCalled();
  });

  it('price listesi boşsa atlar', async () => {
    await commerceService.handleSubscriptionChange(stripeSub({ items: { data: [] } }));
    expect(subscriptionSyncService.syncFromStripe).not.toHaveBeenCalled();
  });

  it('bilinmeyen status.ta bile normalize edip sync.e verir (mapping orada)', async () => {
    await commerceService.handleSubscriptionChange(
      stripeSub({ status: 'some_future_status' })
    );

    expect(subscriptionSyncService.syncFromStripe).toHaveBeenCalledWith(
      expect.objectContaining({ stripeStatus: 'some_future_status' })
    );
  });
});

describe('handleSubscriptionCancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancelFromStripe.a delege eder', async () => {
    await commerceService.handleSubscriptionCancel({
      id: 'sub_123',
      canceled_at: NOW_SEC,
    });

    expect(subscriptionSyncService.cancelFromStripe).toHaveBeenCalledWith({
      stripeSubscriptionId: 'sub_123',
      canceledAt: new Date(NOW_SEC * 1000),
    });
  });

  it('canceled_at yoksa şimdiki zamanı kullanır', async () => {
    await commerceService.handleSubscriptionCancel({ id: 'sub_123' });

    const arg = vi.mocked(subscriptionSyncService.cancelFromStripe).mock.calls[0]![0];
    expect(arg.stripeSubscriptionId).toBe('sub_123');
    expect(arg.canceledAt).toBeInstanceOf(Date);
  });

  it('id yoksa uyarır ve cancel çağırmaz', async () => {
    await commerceService.handleSubscriptionCancel({});

    expect(subscriptionSyncService.cancelFromStripe).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('without id')
    );
  });
});

describe('processWebhookEvent — dispatch ve idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.webhookEvent.create).mockResolvedValue({} as any);
  });

  it('daha önce işlenmiş event.i atlar', async () => {
    vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue({
      stripeEventId: 'evt_1',
    } as any);

    await commerceService.processWebhookEvent({
      id: 'evt_1',
      type: 'customer.subscription.updated',
      data: { object: {} },
    });

    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
    expect(subscriptionSyncService.syncFromStripe).not.toHaveBeenCalled();
  });

  it('customer.subscription.created → syncFromStripe', async () => {
    await commerceService.processWebhookEvent({
      id: 'evt_2',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_1',
          customer: 'cus_1',
          status: 'active',
          current_period_start: NOW_SEC,
          current_period_end: NOW_SEC + 100,
          items: { data: [{ price: { id: 'price_1' } }] },
        },
      },
    });

    expect(subscriptionSyncService.syncFromStripe).toHaveBeenCalled();
  });

  it('customer.subscription.deleted → cancelFromStripe', async () => {
    await commerceService.processWebhookEvent({
      id: 'evt_3',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1' } },
    });

    expect(subscriptionSyncService.cancelFromStripe).toHaveBeenCalled();
  });

  it('handler hata verirse event success:false işaretlenir ve hata yükseltilir', async () => {
    vi.mocked(subscriptionSyncService.syncFromStripe).mockRejectedValueOnce(
      new Error('DB down')
    );
    vi.mocked(prisma.webhookEvent.update).mockResolvedValue({} as any);

    await expect(
      commerceService.processWebhookEvent({
        id: 'evt_4',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_1',
            customer: 'cus_1',
            status: 'active',
            current_period_start: NOW_SEC,
            current_period_end: NOW_SEC + 100,
            items: { data: [{ price: { id: 'price_1' } }] },
          },
        },
      })
    ).rejects.toThrow('DB down');

    expect(prisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeEventId: 'evt_4' },
        data: expect.objectContaining({ success: false }),
      })
    );
  });

  it('tanınmayan event tipi sessizce kaydedilir', async () => {
    await expect(
      commerceService.processWebhookEvent({
        id: 'evt_5',
        type: 'invoice.some.other',
        data: { object: {} },
      })
    ).resolves.toBeUndefined();

    expect(prisma.webhookEvent.create).toHaveBeenCalled();
  });
});
