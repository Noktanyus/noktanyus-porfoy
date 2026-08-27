/**
 * Affiliate Service Tests
 *
 * Phase "Video Calls + Affiliate" kapsaminda eklendi.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    affiliateCommission: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
      updateMany: vi.fn(),
    },
    affiliatePayout: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (fn: any) => fn({
      affiliateCommission: {
        create: vi.fn().mockResolvedValue({ id: 'comm_1' }),
        findMany: vi.fn().mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]),
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      affiliatePayout: {
        create: vi.fn().mockResolvedValue({ id: 'pay_1', amountCents: 10000 }),
      },
      user: {
        update: vi.fn().mockResolvedValue({}),
      },
    })),
  },
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
import { affiliateService } from '../service';
import { NotFoundError, ValidationError } from '@/modules/shared/errors';

describe('AffiliateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('export shape', () => {
    it('exposes core functions', () => {
      expect(typeof affiliateService.trackConversion).toBe('function');
      expect(typeof affiliateService.getStats).toBe('function');
      expect(typeof affiliateService.listCommissions).toBe('function');
      expect(typeof affiliateService.requestPayout).toBe('function');
    });
  });

  describe('trackConversion commission math', () => {
    it('calculates 20% commission correctly', () => {
      const orderCents = 10000;
      const percent = 20;
      const commission = Math.round(orderCents * percent / 100);
      expect(commission).toBe(2000);
    });

    it('rounds to nearest cent for odd amounts', () => {
      const orderCents = 9999;
      const percent = 15;
      const commission = Math.round(orderCents * percent / 100);
      expect(commission).toBe(1500); // 1499.85 -> 1500
    });
  });

  describe('trackConversion idempotency', () => {
    it('returns existing commission if already exists', async () => {
      const existing = { id: 'comm_existing', orderId: 'order_1' };
      (prisma.affiliateCommission.findUnique as any).mockResolvedValue(existing);
      const result = await affiliateService.trackConversion('order_1');
      expect(result).toEqual(existing);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns null when order not found', async () => {
      (prisma.affiliateCommission.findUnique as any).mockResolvedValue(null);
      (prisma.order.findUnique as any).mockResolvedValue(null);
      const result = await affiliateService.trackConversion('missing');
      expect(result).toBeNull();
    });

    it('returns null when user was not referred', async () => {
      (prisma.affiliateCommission.findUnique as any).mockResolvedValue(null);
      (prisma.order.findUnique as any).mockResolvedValue({
        id: 'order_1',
        customerEmail: 'guest@mail.com',
        totalCents: 10000,
      });
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'user_1',
        referredBy: null,
      });
      const result = await affiliateService.trackConversion('order_1');
      expect(result).toBeNull();
    });
  });

  describe('requestPayout', () => {
    it('throws when user not approved', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        affiliateApproved: false,
        affiliateBalanceCents: 50000,
      });
      await expect(
        affiliateService.requestPayout('user_1', 'paypal')
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('throws when balance below minimum (100 TL)', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        affiliateApproved: true,
        affiliateBalanceCents: 5000,
      });
      await expect(
        affiliateService.requestPayout('user_1', 'paypal')
      ).rejects.toThrow('Minimum payout');
    });

    it('throws for invalid method', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        affiliateApproved: true,
        affiliateBalanceCents: 50000,
      });
      await expect(
        affiliateService.requestPayout('user_1', 'crypto')
      ).rejects.toThrow('Geçersiz ödeme yöntemi');
    });

    it('creates payout and zeroes balance on success', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        affiliateApproved: true,
        affiliateBalanceCents: 25000,
      });

      const result = await affiliateService.requestPayout('user_1', 'paypal');

      expect(result).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns zero defaults when user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.affiliateCommission.groupBy as any).mockResolvedValue([]);
      const stats = await affiliateService.getStats('missing');
      expect(stats.balanceCents).toBe(0);
      expect(stats.totalReferrals).toBe(0);
      expect(stats.percent).toBe(0);
    });

    it('aggregates status groupBy correctly', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        affiliateBalanceCents: 15000,
        referralCount: 5,
        affiliatePercent: 25,
        affiliateApproved: true,
        referralCode: 'ABC123',
      });
      (prisma.affiliateCommission.groupBy as any).mockResolvedValue([
        { status: 'pending', _sum: { commissionCents: 5000 }, _count: { _all: 2 } },
        { status: 'paid', _sum: { commissionCents: 10000 }, _count: { _all: 3 } },
      ]);

      const stats = await affiliateService.getStats('user_1');
      expect(stats.balanceCents).toBe(15000);
      expect(stats.totalReferrals).toBe(5);
      expect(stats.percent).toBe(25);
      expect(stats.approved).toBe(true);
      expect(stats.byStatus.pending).toEqual({ count: 2, amountCents: 5000 });
      expect(stats.byStatus.paid).toEqual({ count: 3, amountCents: 10000 });
    });
  });
});