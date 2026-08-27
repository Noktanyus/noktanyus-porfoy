/**
 * Refund Service Tests
 *
 * Vitest ile birim testleri:
 *   - createRefund happy path (Stripe)
 *   - createRefund iyzico / mock path
 *   - createRefund validation (negative amount, exceeds total, not paid)
 *   - detectProvider logic
 *   - revokeLicensesForOrder
 *   - listRefunds
 *
 * Prisma, Stripe, iyzico ve audit modülleri mock'lanarak izole edilir.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => {
  const order = {
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
  };
  const license = {
    findMany: vi.fn(),
    update: vi.fn(),
  };
  return { prisma: { order, license } };
});

vi.mock('@/lib/stripe', () => ({
  stripe: {
    refunds: {
      create: vi.fn(),
    },
  },
  isStripeConfigured: vi.fn(() => false),
}));

vi.mock('@/lib/iyzico', () => ({
  isIyzicoConfigured: vi.fn(() => false),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  logAuditFailure: vi.fn().mockResolvedValue(undefined),
  getRecentAuditLogs: vi.fn().mockResolvedValue([]),
  getAuditLogsByResource: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { refundService } from '../refundService';

const baseOrder = {
  id: 'ord_1',
  orderNumber: 'NK-2608-ABC123',
  customerEmail: 'buyer@example.com',
  userId: 'user_1',
  stripeSessionId: 'cs_test_123',
  stripePaymentIntent: 'pi_test_xyz', // Stripe indicator
  status: 'PAID' as const,
  subtotalCents: 10000,
  totalCents: 10000,
  currency: 'try',
  metadata: {},
  refundedAt: null,
  refundReason: null,
  items: [
    {
      id: 'item_1',
      productId: 'p1',
      quantity: 1,
      unitPriceCents: 10000,
      totalCents: 10000,
      productTitle: 'Test Product',
      productSlug: 'test-product',
    },
  ],
};

describe('refundService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectProvider', () => {
    it('returns stripe when paymentIntent starts with pi_', () => {
      expect(refundService.detectProvider({ stripePaymentIntent: 'pi_123' })).toBe('stripe');
    });

    it('returns iyzico when paymentIntent is null', () => {
      expect(refundService.detectProvider({ stripePaymentIntent: null })).toBe('iyzico');
    });

    it('returns iyzico when paymentIntent is a non-pi_ value', () => {
      expect(refundService.detectProvider({ stripePaymentIntent: 'mock_xyz' })).toBe('iyzico');
    });
  });

  describe('createRefund — validation', () => {
    it('throws NotFoundError when order does not exist', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);
      await expect(
        refundService.createRefund({ orderId: 'missing', userId: 'u1' })
      ).rejects.toThrow('Sipariş');
    });

    it('throws ValidationError when order is not PAID', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...baseOrder,
        status: 'PENDING',
      } as any);
      await expect(
        refundService.createRefund({ orderId: 'ord_1', userId: 'u1' })
      ).rejects.toThrow(/ödenmiş/);
    });

    it('throws ValidationError when amount <= 0', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(baseOrder as any);
      await expect(
        refundService.createRefund({ orderId: 'ord_1', userId: 'u1', amountCents: 0 })
      ).rejects.toThrow(/sıfırdan büyük/);
    });

    it('throws ValidationError when amount > totalCents', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(baseOrder as any);
      await expect(
        refundService.createRefund({
          orderId: 'ord_1',
          userId: 'u1',
          amountCents: 50000,
        })
      ).rejects.toThrow(/büyük olamaz/);
    });
  });

  describe('createRefund — Stripe path', () => {
    beforeEach(() => {
      vi.mocked(isStripeConfigured).mockReturnValue(true);
    });

    it('creates a full refund via Stripe and marks order REFUNDED', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(baseOrder as any);
      vi.mocked(stripe.refunds.create).mockResolvedValue({ id: 're_123' } as any);
      vi.mocked(prisma.order.update).mockResolvedValue({ ...baseOrder, status: 'REFUNDED' } as any);
      vi.mocked(prisma.license.findMany).mockResolvedValue([]);

      const result = await refundService.createRefund({
        orderId: 'ord_1',
        userId: 'u1',
        userEmail: 'u1@test.com',
        reason: 'Customer requested',
      });

      expect(stripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_intent: 'pi_test_xyz',
          amount: 10000,
          reason: 'requested_by_customer',
        })
      );
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_1' },
          data: expect.objectContaining({
            status: 'REFUNDED',
            refundReason: 'Customer requested',
          }),
        })
      );
      expect(result).toMatchObject({
        success: true,
        refundId: 're_123',
        provider: 'stripe',
        fullRefund: true,
        amountCents: 10000,
      });
    });

    it('creates partial refund and marks order PARTIALLY_REFUNDED', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(baseOrder as any);
      vi.mocked(stripe.refunds.create).mockResolvedValue({ id: 're_partial' } as any);
      vi.mocked(prisma.order.update).mockResolvedValue({} as any);
      vi.mocked(prisma.license.findMany).mockResolvedValue([]);

      const result = await refundService.createRefund({
        orderId: 'ord_1',
        userId: 'u1',
        amountCents: 4000,
      });

      expect(result.fullRefund).toBe(false);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PARTIALLY_REFUNDED',
          }),
        })
      );
    });
  });

  describe('createRefund — iyzico / mock path', () => {
    beforeEach(() => {
      vi.mocked(isStripeConfigured).mockReturnValue(false);
    });

    it('records a mock refund when paymentIntent does not look like Stripe', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...baseOrder,
        stripePaymentIntent: 'mock_iyzico_xyz',
      } as any);
      vi.mocked(prisma.order.update).mockResolvedValue({} as any);
      vi.mocked(prisma.license.findMany).mockResolvedValue([]);

      const result = await refundService.createRefund({
        orderId: 'ord_1',
        userId: 'u1',
      });

      expect(stripe.refunds.create).not.toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalled();
      expect(result.provider).toBe('iyzico');
      expect(result.refundId).toMatch(/^mock_/);
      expect(result.fullRefund).toBe(true);
    });

    it('falls back to iyzico path when Stripe is configured but order is iyzico', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(true);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...baseOrder,
        stripePaymentIntent: 'mock_iyzico_xyz',
      } as any);
      vi.mocked(prisma.order.update).mockResolvedValue({} as any);
      vi.mocked(prisma.license.findMany).mockResolvedValue([]);

      const result = await refundService.createRefund({
        orderId: 'ord_1',
        userId: 'u1',
      });

      expect(stripe.refunds.create).not.toHaveBeenCalled();
      expect(result.provider).toBe('iyzico');
    });
  });

  describe('revokeLicensesForOrder', () => {
    it('revokes all non-revoked licenses for an order', async () => {
      vi.mocked(prisma.license.findMany).mockResolvedValue([
        { id: 'l1' },
        { id: 'l2' },
      ] as any);
      vi.mocked(prisma.license.update).mockResolvedValue({} as any);

      const result = await refundService.revokeLicensesForOrder('ord_1');

      expect(prisma.license.update).toHaveBeenCalledTimes(2);
      expect(prisma.license.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: expect.objectContaining({
          status: 'revoked',
          revokeReason: 'Order refunded',
        }),
      });
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no licenses exist', async () => {
      vi.mocked(prisma.license.findMany).mockResolvedValue([]);
      const result = await refundService.revokeLicensesForOrder('ord_1');
      expect(result).toEqual([]);
      expect(prisma.license.update).not.toHaveBeenCalled();
    });
  });

  describe('listRefunds', () => {
    it('returns refunded orders filtered by userId', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([{ id: 'o1' }] as any);

      await refundService.listRefunds({ userId: 'u1' });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
            userId: 'u1',
          }),
        })
      );
    });

    it('uses default limit 50 when not provided', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      await refundService.listRefunds();
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });
  });
});
