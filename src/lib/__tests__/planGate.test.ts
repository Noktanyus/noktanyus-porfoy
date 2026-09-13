/**
 * Plan Gate — abonelik + ön ödemeli kredi testleri
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
  it('returns Infinity for enterprise', async () => {
    const limits = await getPlanLimits('enterprise');
    expect(limits?.apiRequestsPerMonth).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('checkApiQuota', () => {
  it('allows via prepaid credits when no plan', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
    vi.mocked(getApiCreditBalance).mockResolvedValue(42);
    const result = await checkApiQuota('user-1');
    expect(result.allowed).toBe(true);
    expect(result.billingSource).toBe('credits');
    expect(result.remainingRequests).toBe(42);
  });

  it('denies when no plan and no credits', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
    vi.mocked(getApiCreditBalance).mockResolvedValue(0);
    const result = await checkApiQuota('user-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('kredi');
  });

  it('prefers subscription when within monthly limit', async () => {
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
