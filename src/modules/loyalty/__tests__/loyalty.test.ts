/**
 * Loyalty Service & Tiers Unit Tests
 *
 * Phase: Loyalty Program
 * Tier hesaplama, puan kurallari ve redeem mantigi testleri.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    loyaltyAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    loyaltyTransaction: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    loyaltyReward: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn(async (fn: any) =>
      fn({
        loyaltyAccount: {
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        loyaltyTransaction: {
          create: vi.fn().mockResolvedValue({ id: 'txn_1' }),
          findMany: vi.fn().mockResolvedValue([]),
        },
        loyaltyReward: {
          findUnique: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
        },
      })
    ),
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

import {
  LOYALTY_TIERS,
  POINTS_RULES,
  getTierByPoints,
  getNextTier,
  normalizeTier,
  calculatePurchasePoints,
  canAccessReward,
  getTierPerks,
} from '../tiers';
import { loyaltyService } from '../service';

describe('Loyalty Tiers', () => {
  it('exposes 4 tiers in ascending order', () => {
    expect(LOYALTY_TIERS).toHaveLength(4);
    expect(LOYALTY_TIERS.map((t) => t.name)).toEqual([
      'bronze',
      'silver',
      'gold',
      'platinum',
    ]);
    // Threshold'lar monoton artan
    for (let i = 1; i < LOYALTY_TIERS.length; i++) {
      expect(LOYALTY_TIERS[i].threshold).toBeGreaterThan(
        LOYALTY_TIERS[i - 1].threshold
      );
    }
  });

  it('returns correct tier by lifetime points', () => {
    expect(getTierByPoints(0).name).toBe('bronze');
    expect(getTierByPoints(500).name).toBe('bronze');
    expect(getTierByPoints(1000).name).toBe('silver');
    expect(getTierByPoints(4999).name).toBe('silver');
    expect(getTierByPoints(5000).name).toBe('gold');
    expect(getTierByPoints(14999).name).toBe('gold');
    expect(getTierByPoints(15000).name).toBe('platinum');
    expect(getTierByPoints(99999).name).toBe('platinum');
  });

  it('returns next tier or null at top', () => {
    expect(getNextTier('bronze')?.name).toBe('silver');
    expect(getNextTier('silver')?.name).toBe('gold');
    expect(getNextTier('gold')?.name).toBe('platinum');
    expect(getNextTier('platinum')).toBeNull();
  });

  it('normalizes unknown tier strings to bronze', () => {
    expect(normalizeTier('gold')).toBe('gold');
    expect(normalizeTier('platinum')).toBe('platinum');
    expect(normalizeTier('unknown')).toBe('bronze');
    expect(normalizeTier(null)).toBe('bronze');
    expect(normalizeTier(undefined)).toBe('bronze');
  });

  it('each tier has perks and discount defined', () => {
    LOYALTY_TIERS.forEach((t) => {
      expect(Array.isArray(t.perks)).toBe(true);
      expect(t.perks.length).toBeGreaterThan(0);
      expect(typeof t.discountPercent).toBe('number');
      expect(t.gradient).toMatch(/from-/);
    });
  });
});

describe('Loyalty Points Rules', () => {
  it('purchase rule is 1pt per TL', () => {
    expect(POINTS_RULES.purchase.amount).toBe(1);
  });

  it('review earns 50 points', () => {
    expect(POINTS_RULES.review.amount).toBe(50);
  });

  it('referral earns 200 points', () => {
    expect(POINTS_RULES.referral.amount).toBe(200);
  });

  it('signup bonus is 100 points', () => {
    expect(POINTS_RULES.signup.amount).toBe(100);
  });

  it('birthday bonus is 500 points', () => {
    expect(POINTS_RULES.birthday.amount).toBe(500);
  });

  it('calculates purchase points from cents correctly', () => {
    expect(calculatePurchasePoints(10000)).toBe(100); // 100 TL = 100 pts
    expect(calculatePurchasePoints(250)).toBe(2); // 2.50 TL = 2 pts (floor)
    expect(calculatePurchasePoints(0)).toBe(0);
  });
});

describe('Loyalty Tier Access Control', () => {
  it('gold user can access bronze rewards', () => {
    expect(canAccessReward('bronze', 'gold')).toBe(true);
  });

  it('bronze user cannot access gold rewards', () => {
    expect(canAccessReward('gold', 'bronze')).toBe(false);
  });

  it('unknown tier defaults to accessible', () => {
    expect(canAccessReward('unknown', 'bronze')).toBe(true);
  });

  it('returns perks array for known tier', () => {
    const perks = getTierPerks('gold');
    expect(perks.length).toBeGreaterThan(0);
  });
});

describe('Loyalty Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes core service methods', () => {
    expect(typeof loyaltyService.getOrCreateAccount).toBe('function');
    expect(typeof loyaltyService.awardPoints).toBe('function');
    expect(typeof loyaltyService.redeemPoints).toBe('function');
    expect(typeof loyaltyService.getStats).toBe('function');
    expect(typeof loyaltyService.onPurchase).toBe('function');
    expect(typeof loyaltyService.onReview).toBe('function');
    expect(typeof loyaltyService.onReferral).toBe('function');
    expect(typeof loyaltyService.onSignup).toBe('function');
  });

  it('exports valid points rules object', () => {
    expect(Object.keys(POINTS_RULES)).toEqual(
      expect.arrayContaining([
        'purchase',
        'review',
        'referral',
        'signup',
        'birthday',
      ])
    );
  });

  it('tier discount percentages are non-decreasing', () => {
    let prev = -1;
    for (const tier of LOYALTY_TIERS) {
      expect(tier.discountPercent).toBeGreaterThanOrEqual(prev);
      prev = tier.discountPercent;
    }
  });
});