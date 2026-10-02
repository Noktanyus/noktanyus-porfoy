/**
 * Commerce Order Post-Checkout Wiring Tests
 *
 * Doğrulanan sözleşmeler:
 *   - handleCheckoutCompleted siparişi PAID yapar, lisans üretir
 *   - handleCheckoutCompleted yan etkileri BEKLEMEZ, kuyruğa alır
 *   - order zaten PAID ise hiçbir şey yapmaz (idempotent)
 *   - order bulunamazsa sessizce döner
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

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/queueService', () => ({
  queueService: {
    enqueueOrderPostCheckout: vi.fn(async () => undefined),
  },
}));

vi.mock('../subscriptionSync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../subscriptionSync')>();
  return {
    ...actual,
    subscriptionSyncService: {
      upsertUserSubscription: vi.fn(async () => undefined),
      ensureTrialUserSubscription: vi.fn(async () => undefined),
    },
  };
});

import { prisma } from '@/lib/prisma';
import { queueService } from '@/lib/queueService';
import { commerceService } from '../service';

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

describe('handleCheckoutCompleted — PayTR / checkout tamamlama akışı', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...orderRow } as any);
    vi.mocked(prisma.order.update).mockResolvedValue({ ...orderRow } as any);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({
      id: 'cust_1',
      email: 'buyer@example.com',
    } as any);
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
    await commerceService.handleCheckoutCompleted({ id: 'sess_1', payment_intent: 'paytr_1' });

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PAID', stripePaymentIntent: 'paytr_1' }),
      })
    );
    expect(prisma.license.create).toHaveBeenCalled();
  });

  it('yan etkileri KUYRUĞA alır (istek yolunda beklemez)', async () => {
    await commerceService.handleCheckoutCompleted({ id: 'sess_1', payment_intent: 'paytr_1' });

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
