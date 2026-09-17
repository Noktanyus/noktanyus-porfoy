/**
 * Plan Gate — abonelik + ön ödemeli kredi + özel kullanıcı kotası (Enterprise / Custom) testleri
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    userSubscription: { findFirst: vi.fn() },
    plan: { findUnique: vi.fn() },
    apiKey: { findMany: vi.fn() },
    apiKeyUsage: { count: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
  };
  return { prisma: mockPrisma };
});

vi.mock('@/lib/apiCredits', () => ({
  getApiCreditBalance: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getApiCreditBalance } from '@/lib/apiCredits';
import {
  getUserPlan,
  getPlanLimits,
  checkApiQuota,
  getCurrentMonthUsage,
} from '../planGate';
import { parsePlanFeatures } from '@/lib/schemas/plan';

const mockPrisma = prisma as unknown as {
  userSubscription: { findFirst: ReturnType<typeof vi.fn> };
  plan: { findUnique: ReturnType<typeof vi.fn> };
  apiKey: { findMany: ReturnType<typeof vi.fn> };
  apiKeyUsage: { count: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  user: { findUnique: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('parsePlanFeatures', () => {
  it('parses legacy string[]', () => {
    const result = parsePlanFeatures(['Sınırsız proje']);
    expect(result.marketing).toEqual(['Sınırsız proje']);
  });

  it('maps aiRequestsPerMonth to apiRequestsPerMonth', () => {
    const result = parsePlanFeatures({
      marketing: [],
      limits: { aiRequestsPerMonth: 500 },
    });
    expect(result.limits?.apiRequestsPerMonth).toBe(500);
  });
});

describe('getUserPlan', () => {
  it('returns planSlug from active subscription', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue({ planSlug: 'pro' });
    expect(await getUserPlan('user-1')).toBe('pro');
  });

  it('returns null when no subscription', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
    expect(await getUserPlan('user-2')).toBeNull();
  });
});

describe('getPlanLimits', () => {
  it('returns null when plan not found or inactive', async () => {
    mockPrisma.plan.findUnique.mockResolvedValue(null);
    const limits = await getPlanLimits('unknown');
    expect(limits).toBeNull();
  });

  it('returns plan limits from db when active', async () => {
    mockPrisma.plan.findUnique.mockResolvedValue({
      active: true,
      features: { marketing: [], limits: { apiRequestsPerMonth: 50000 } },
    });
    const limits = await getPlanLimits('business');
    expect(limits?.apiRequestsPerMonth).toBe(50000);
  });
});

describe('checkApiQuota', () => {
  it('allows via prepaid credits when no plan', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
    vi.mocked(getApiCreditBalance).mockResolvedValue(42);
    const result = await checkApiQuota('user-1');
    expect(result.allowed).toBe(true);
    expect(result.billingSource).toBe('credits');
    expect(result.remainingRequests).toBe(42);
  });

  it('denies when no plan and no credits', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
    vi.mocked(getApiCreditBalance).mockResolvedValue(0);
    const result = await checkApiQuota('user-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('kredi');
  });

  it('prefers subscription when within monthly limit', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.userSubscription.findFirst.mockResolvedValue({ planSlug: 'pro' });
    mockPrisma.plan.findUnique.mockResolvedValue({
      active: true,
      features: { marketing: [], limits: { apiRequestsPerMonth: 10000 } },
    });
    mockPrisma.apiKey.findMany.mockResolvedValue([{ id: 'k1' }]);
    mockPrisma.apiKeyUsage.count.mockResolvedValue(10);
    const result = await checkApiQuota('user-1');
    expect(result.allowed).toBe(true);
    expect(result.billingSource).toBe('subscription');
  });

  it('falls back to credits when subscription quota exhausted', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.userSubscription.findFirst.mockResolvedValue({ planSlug: 'starter' });
    mockPrisma.plan.findUnique.mockResolvedValue({
      active: true,
      features: { marketing: [], limits: { apiRequestsPerMonth: 1000 } },
    });
    mockPrisma.apiKey.findMany.mockResolvedValue([{ id: 'k1' }]);
    mockPrisma.apiKeyUsage.count.mockResolvedValue(1000);
    vi.mocked(getApiCreditBalance).mockResolvedValue(5);
    const result = await checkApiQuota('user-1');
    expect(result.allowed).toBe(true);
    expect(result.billingSource).toBe('credits');
  });

  it('prioritizes custom user limit over subscription plan', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      customApiMonthlyLimit: 50000,
      customApiLimitExpiresAt: new Date(Date.now() + 86400000), // tomorrow
    });
    mockPrisma.apiKey.findMany.mockResolvedValue([{ id: 'k1' }]);
    mockPrisma.apiKeyUsage.count.mockResolvedValue(100);

    const result = await checkApiQuota('user-1');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(50000);
    expect(result.remainingRequests).toBe(49900);
    expect(result.planSlug).toBe('custom');
    expect(result.billingSource).toBe('subscription');
  });

  it('ignores expired custom limit and falls back to subscription', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      customApiMonthlyLimit: 50000,
      customApiLimitExpiresAt: new Date(Date.now() - 86400000), // yesterday
    });
    mockPrisma.userSubscription.findFirst.mockResolvedValue({ planSlug: 'pro' });
    mockPrisma.plan.findUnique.mockResolvedValue({
      active: true,
      features: { marketing: [], limits: { apiRequestsPerMonth: 10000 } },
    });
    mockPrisma.apiKey.findMany.mockResolvedValue([{ id: 'k1' }]);
    mockPrisma.apiKeyUsage.count.mockResolvedValue(100);

    const result = await checkApiQuota('user-1');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(10000);
    expect(result.remainingRequests).toBe(9900);
    expect(result.planSlug).toBe('pro');
  });

  it('falls back to credits when custom user limit is exhausted', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      customApiMonthlyLimit: 5000,
      customApiLimitExpiresAt: null,
    });
    mockPrisma.apiKey.findMany.mockResolvedValue([{ id: 'k1' }]);
    mockPrisma.apiKeyUsage.count.mockResolvedValue(5000);
    mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
    vi.mocked(getApiCreditBalance).mockResolvedValue(200);

    const result = await checkApiQuota('user-1');
    expect(result.allowed).toBe(true);
    expect(result.billingSource).toBe('credits');
    expect(result.remainingRequests).toBe(200);
  });
});

describe('getCurrentMonthUsage', () => {
  it('counts api key usage', async () => {
    mockPrisma.apiKey.findMany.mockResolvedValue([{ id: 'k1' }]);
    mockPrisma.apiKeyUsage.count.mockResolvedValue(7);
    const usage = await getCurrentMonthUsage('user-1');
    expect(usage.requestsUsed).toBe(7);
    expect(usage.tokensUsed).toBe(0);
  });
});
