/**
 * Coupon Advanced — Referral, Birthday, First-time testleri.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => {
  const mockPrisma: any = {
    coupon: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
    order: {
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: vi.fn(async (cb: any) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

describe('Coupon Advanced — Referral Codes', () => {
  it('generates a referral code with REF prefix and uppercase alphanumerics', async () => {
    const { couponService } = await import('../couponService');
    const code = await couponService.generateReferralCode('clxyz123abc456def');
    expect(code.startsWith('REF')).toBe(true);
    expect(code).toMatch(/^REF[A-Z0-9]{10,12}$/);
  });

  it('generates unique codes for different user IDs', async () => {
    const { couponService } = await import('../couponService');
    const code1 = await couponService.generateReferralCode('claaa111bbb222ccc');
    const code2 = await couponService.generateReferralCode('clddd333eee444fff');
    expect(code1).not.toBe(code2);
  });
});

describe('Coupon Advanced — Birthday Coupon', () => {
  it('returns null when birth date is not today', async () => {
    const { couponService } = await import('../couponService');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = await couponService.getBirthdayCoupon(yesterday);
    expect(result).toBeNull();
  });
});

describe('Coupon Advanced — First-time Coupons', () => {
  it('returns empty array when user has placed orders', async () => {
    const { couponService } = await import('../couponService');
    const { prisma } = await import('@/lib/prisma');
    (prisma.order.count as any).mockResolvedValueOnce(3);
    const result = await couponService.getCouponsForFirstTime({ userId: 'user-1' });
    expect(result).toEqual([]);
  });

  it('returns coupons for new users (no orders)', async () => {
    const { couponService } = await import('../couponService');
    const { prisma } = await import('@/lib/prisma');
    (prisma.order.count as any).mockResolvedValueOnce(0);
    (prisma.coupon.findMany as any).mockResolvedValueOnce([
      { id: 'c1', code: 'WELCOME10', discountValue: 10 },
    ]);
    const result = await couponService.getCouponsForFirstTime({ userId: 'user-2' });
    expect(Array.isArray(result)).toBe(true);
  });
});
