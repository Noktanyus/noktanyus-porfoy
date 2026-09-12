/**
 * Plan Gate — Tier-based AI quota logic tests
 *
 * Sprint 1: AI Quick Wins kapsamında quota enforcement testleri.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Prisma mock
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    userSubscription: {
      findFirst: vi.fn(),
    },
    plan: {
      findUnique: vi.fn(),
    },
    aiUsage: {
      aggregate: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '@/lib/prisma';
import {
  getUserPlan,
  getPlanLimits,
  checkAiQuota,
  consumeAiQuota,
  getCurrentMonthUsage,
} from '../planGate';
import { parsePlanFeatures } from '@/lib/schemas/plan';

const mockPrisma = prisma as unknown as {
  userSubscription: { findFirst: ReturnType<typeof vi.fn> };
  plan: { findUnique: ReturnType<typeof vi.fn> };
  aiUsage: {
    aggregate: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('parsePlanFeatures (backward compatibility)', () => {
  it('parses legacy string[]', () => {
    const result = parsePlanFeatures(['Sınırsız proje', '100 GB']);
    expect(result.marketing).toEqual(['Sınırsız proje', '100 GB']);
    expect(result.limits).toBeUndefined();
  });

  it('parses new structured format', () => {
    const result = parsePlanFeatures({
      marketing: ['AI Blog'],
      limits: { aiTokensPerMonth: 100000, aiRequestsPerMonth: 500 },
    });
    expect(result.marketing).toEqual(['AI Blog']);
    expect(result.limits?.aiTokensPerMonth).toBe(100000);
  });

  it('returns empty default on invalid input', () => {
    const result = parsePlanFeatures(null);
    expect(result.marketing).toEqual([]);
  });
});

describe('getUserPlan', () => {
  it('returns planSlug from active subscription', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue({ planSlug: 'pro' });
    const plan = await getUserPlan('user-1');
    expect(plan).toBe('pro');
  });

  it('returns null when no active subscription', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
    const plan = await getUserPlan('user-2');
    expect(plan).toBeNull();
  });
});

describe('getPlanLimits', () => {
  it('returns Infinity for enterprise plan', async () => {
    const limits = await getPlanLimits('enterprise');
    expect(limits?.aiTokensPerMonth).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns limits from Plan.features for pro plan', async () => {
    mockPrisma.plan.findUnique.mockResolvedValue({
      active: true,
      features: {
        marketing: ['Pro features'],
        limits: { aiTokensPerMonth: 100000, aiRequestsPerMonth: 500 },
      },
    });
    const limits = await getPlanLimits('pro');
    expect(limits?.aiTokensPerMonth).toBe(100000);
    expect(limits?.aiRequestsPerMonth).toBe(500);
  });

  it('returns null for inactive plan', async () => {
    mockPrisma.plan.findUnique.mockResolvedValue({ active: false, features: {} });
    const limits = await getPlanLimits('pro');
    expect(limits).toBeNull();
  });

  it('returns null when planSlug is null', async () => {
    const limits = await getPlanLimits(null);
    expect(limits).toBeNull();
  });
});

describe('checkAiQuota', () => {
  it('denies when no active plan', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue(null);
    const result = await checkAiQuota('user-1', 1000);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('planınız yok');
  });

  it('allows for enterprise plan regardless of usage', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue({ planSlug: 'enterprise' });
    const result = await checkAiQuota('user-ent', 999999);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Number.POSITIVE_INFINITY);
  });

  it('denies when token limit exceeded', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue({ planSlug: 'starter' });
    mockPrisma.plan.findUnique.mockResolvedValue({
      active: true,
      features: {
        marketing: [],
        limits: { aiTokensPerMonth: 10000, aiRequestsPerMonth: 50 },
      },
    });
    mockPrisma.aiUsage.aggregate.mockResolvedValue({ _sum: { totalTokens: 9500 } });
    mockPrisma.aiUsage.count.mockResolvedValue(10);

    const result = await checkAiQuota('user-1', 1000); // 9500 + 1000 = 10500 > 10000
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('token limitinize');
  });

  it('allows when within limits', async () => {
    mockPrisma.userSubscription.findFirst.mockResolvedValue({ planSlug: 'pro' });
    mockPrisma.plan.findUnique.mockResolvedValue({
      active: true,
      features: {
        marketing: [],
        limits: { aiTokensPerMonth: 100000, aiRequestsPerMonth: 500 },
      },
    });
    mockPrisma.aiUsage.aggregate.mockResolvedValue({ _sum: { totalTokens: 5000 } });
    mockPrisma.aiUsage.count.mockResolvedValue(10);

    const result = await checkAiQuota('user-1', 1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(95000);
    expect(result.remainingRequests).toBe(490);
  });
});

describe('consumeAiQuota', () => {
  it('creates AiUsage record with correct totalTokens', async () => {
    mockPrisma.aiUsage.create.mockResolvedValue({});
    await consumeAiQuota({
      userId: 'user-1',
      feature: 'blog.write',
      model: 'claude-haiku-4-5-20251001',
      inputTokens: 100,
      outputTokens: 250,
    });
    expect(mockPrisma.aiUsage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        feature: 'blog.write',
        inputTokens: 100,
        outputTokens: 250,
        totalTokens: 350,
      }),
    });
  });

  it('does not throw on DB error (fire-and-forget)', async () => {
    mockPrisma.aiUsage.create.mockRejectedValue(new Error('DB down'));
    await expect(
      consumeAiQuota({
        userId: 'user-1',
        feature: 'blog.write',
        model: 'test',
        inputTokens: 1,
        outputTokens: 1,
      })
    ).resolves.toBeUndefined();
  });
});

describe('getCurrentMonthUsage', () => {
  it('returns token total and request count', async () => {
    mockPrisma.aiUsage.aggregate.mockResolvedValue({ _sum: { totalTokens: 1234 } });
    mockPrisma.aiUsage.count.mockResolvedValue(7);
    const usage = await getCurrentMonthUsage('user-1');
    expect(usage.tokensUsed).toBe(1234);
    expect(usage.requestsUsed).toBe(7);
  });
});
