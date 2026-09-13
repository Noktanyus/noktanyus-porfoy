/**
 * Post-Checkout Side Effects Tests — çekirdek adımlar.
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

import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/emailService';
import { webhookService } from '@/modules/webhooks';
import { notificationService } from '@/modules/notifications';
import { runPostCheckoutSideEffects } from '../postCheckout';

const ALL_STEPS = ['receipt-email', 'webhook-dispatch', 'notification'];

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

describe('runPostCheckoutSideEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as any);
  });

  it('çekirdek adımları çalıştırır', async () => {
    const result = await runPostCheckoutSideEffects('order_1');
    expect(result.found).toBe(true);
    expect(result.failedSteps).toEqual([]);
    expect(result.outcomes.map((o) => o.step)).toEqual(ALL_STEPS);
    expect(result.outcomes.every((o) => o.ok)).toBe(true);
  });

  it('receipt e-postası gönderilir', async () => {
    await runPostCheckoutSideEffects('order_1');
    expect(emailService.sendReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'buyer@example.com',
        orderNumber: 'NK-2601-ABC123',
      })
    );
  });

  it('webhook ve notification çağrılır', async () => {
    await runPostCheckoutSideEffects('order_1');
    expect(webhookService.dispatchEvent).toHaveBeenCalledWith(
      'order.paid',
      expect.objectContaining({ orderId: 'order_1' })
    );
    expect(notificationService.dispatch).toHaveBeenCalled();
  });

  it('sipariş yoksa found=false', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);
    const result = await runPostCheckoutSideEffects('missing');
    expect(result.found).toBe(false);
  });

  it('bir adım patlasa diğerleri devam eder ve throw etmez', async () => {
    vi.mocked(emailService.sendReceipt).mockRejectedValueOnce(new Error('SMTP down'));
    const result = await runPostCheckoutSideEffects('order_1');
    expect(result.failedSteps).toContain('receipt-email');
    expect(result.outcomes.filter((o) => o.ok).map((o) => o.step)).toEqual([
      'webhook-dispatch',
      'notification',
    ]);
  });
});
