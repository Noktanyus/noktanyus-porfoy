/**
 * Coupon Service Tests
 *
 * Kupon doğrulama, indirim hesaplama ve redemption işlemleri için birim testleri.
 * Prisma mock'lanarak DB bağımlılığı izole edilir.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    couponRedemption: {
      create: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => unknown) =>
      fn({
        coupon: { update: vi.fn() },
        couponRedemption: { create: vi.fn() },
      })
    ),
  },
}));

import { prisma } from '@/lib/prisma';
import { couponService } from '../couponService';

const baseCoupon = {
  id: '1',
  code: 'TEST',
  description: 'Test coupon',
  discountType: 'PERCENTAGE' as const,
  discountValue: 20,
  minOrderCents: 0,
  maxDiscountCents: null,
  maxUses: null,
  currentUses: 0,
  maxUsesPerUser: 1,
  startsAt: null,
  expiresAt: null,
  applicableProducts: null,
  applicablePlans: null,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CouponService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns invalid for non-existent coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null);
    const result = await couponService.validate({
      code: 'INVALID',
      customerEmail: 'a@b.com',
      subtotalCents: 10000,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('geçersiz');
    expect(result.discountCents).toBe(0);
  });

  it('returns invalid when coupon is not active', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      active: false,
    } as any);
    const result = await couponService.validate({
      code: 'TEST',
      customerEmail: 'a@b.com',
      subtotalCents: 10000,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('aktif');
  });

  it('returns invalid when coupon has expired', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      expiresAt: new Date(Date.now() - 1000 * 60 * 60),
    } as any);
    const result = await couponService.validate({
      code: 'TEST',
      customerEmail: 'a@b.com',
      subtotalCents: 10000,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('süresi');
  });

  it('returns invalid when coupon not yet started', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      startsAt: new Date(Date.now() + 1000 * 60 * 60),
    } as any);
    const result = await couponService.validate({
      code: 'TEST',
      customerEmail: 'a@b.com',
      subtotalCents: 10000,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('henüz');
  });

  it('validates percentage discount correctly', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      code: 'SAVE20',
    } as any);
    vi.mocked(prisma.couponRedemption.count).mockResolvedValue(0);

    const result = await couponService.validate({
      code: 'save20',
      customerEmail: 'a@b.com',
      subtotalCents: 10000,
    });
    expect(result.valid).toBe(true);
    expect(result.discountCents).toBe(2000);
    expect(result.coupon?.code).toBe('SAVE20'); // DB'de uppercase olarak saklanır
  });

  it('validates fixed amount discount correctly', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      discountType: 'FIXED_AMOUNT',
      discountValue: 1500,
    } as any);
    vi.mocked(prisma.couponRedemption.count).mockResolvedValue(0);

    const result = await couponService.validate({
      code: 'TEST',
      customerEmail: 'a@b.com',
      subtotalCents: 10000,
    });
    expect(result.valid).toBe(true);
    expect(result.discountCents).toBe(1500);
  });

  it('rejects when min order not met', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      discountType: 'FIXED_AMOUNT',
      discountValue: 1000,
      minOrderCents: 50000,
    } as any);
    vi.mocked(prisma.couponRedemption.count).mockResolvedValue(0);

    const result = await couponService.validate({
      code: 'BIGORDER',
      customerEmail: 'a@b.com',
      subtotalCents: 10000,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Minimum');
  });

  it('rejects when max uses reached', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      maxUses: 5,
      currentUses: 5,
    } as any);

    const result = await couponService.validate({
      code: 'TEST',
      customerEmail: 'a@b.com',
      subtotalCents: 10000,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('limit');
  });

  it('rejects when user exceeded max uses per user', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      maxUsesPerUser: 1,
    } as any);
    vi.mocked(prisma.couponRedemption.count).mockResolvedValue(1);

    const result = await couponService.validate({
      code: 'TEST',
      customerEmail: 'a@b.com',
      subtotalCents: 10000,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('en fazla');
  });

  it('caps discount at maxDiscountCents', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      discountValue: 50, // %50 → 5000 TL
      maxDiscountCents: 1000, // cap at 10 TL
    } as any);
    vi.mocked(prisma.couponRedemption.count).mockResolvedValue(0);

    const result = await couponService.validate({
      code: 'TEST',
      customerEmail: 'a@b.com',
      subtotalCents: 10000,
    });
    expect(result.valid).toBe(true);
    expect(result.discountCents).toBe(1000);
  });

  it('caps discount at subtotalCents', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      discountType: 'FIXED_AMOUNT',
      discountValue: 5000,
    } as any);
    vi.mocked(prisma.couponRedemption.count).mockResolvedValue(0);

    const result = await couponService.validate({
      code: 'TEST',
      customerEmail: 'a@b.com',
      subtotalCents: 1000,
    });
    expect(result.valid).toBe(true);
    expect(result.discountCents).toBe(1000);
  });

  it('redeem creates redemption and increments usage in transaction', async () => {
    const mockRedemption = { id: 'r1' };
    const mockUpdate = vi.fn();
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({
        coupon: { update: mockUpdate.mockResolvedValue({}) },
        couponRedemption: {
          create: vi.fn().mockResolvedValue(mockRedemption),
        },
      })
    );

    const result = await couponService.redeem('c1', 'a@b.com', 'o1', 500);
    expect(result).toEqual(mockRedemption);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { currentUses: { increment: 1 } },
    });
  });

  it('create normalizes code to uppercase', async () => {
    vi.mocked(prisma.coupon.create).mockResolvedValue({} as any);
    await couponService.create({
      code: 'summer2025',
      discountType: 'PERCENTAGE',
      discountValue: 15,
    });
    const call = vi.mocked(prisma.coupon.create).mock.calls[0][0];
    expect(call.data.code).toBe('SUMMER2025');
  });
});
