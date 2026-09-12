/**
 * AI Service Tests — Sprint 1.5: Provider-Agnostic
 *
 * Mock fallback (env yok) + real API (mock OpenAI SDK).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Prisma mock
vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiUsage: {
      create: vi.fn().mockResolvedValue({}),
      aggregate: vi.fn().mockResolvedValue({ _sum: { totalTokens: 0 } }),
      count: vi.fn().mockResolvedValue(0),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { generateBlog, generateProductDescription } from '../service';
import { estimateCostCents } from '../types';

const ctx = {
  userId: 'user-1',
  userEmail: 'admin@example.com',
  ipAddress: '127.0.0.1',
};

const originalEnv = { ...process.env };

beforeEach(() => {
  delete process.env.AI_BASE_URL;
  delete process.env.AI_API_KEY;
  delete process.env.AI_MODEL;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('estimateCostCents (provider-aware pricing)', () => {
  it('returns 0 for zero tokens', () => {
    expect(estimateCostCents(0, 0)).toBe(0);
    expect(estimateCostCents(0, 0, 'gpt-4o')).toBe(0);
  });

  it('uses known model pricing for gpt-4o', () => {
    // 1M input + 1M output → $2.50 + $10.00 = $12.50 = 1250 cents
    expect(estimateCostCents(1_000_000, 1_000_000, 'gpt-4o')).toBe(1250);
  });

  it('uses known model pricing for gpt-4o-mini (cheaper)', () => {
    // 1M input + 1M output → $0.15 + $0.60 = $0.75 = 75 cents
    expect(estimateCostCents(1_000_000, 1_000_000, 'gpt-4o-mini')).toBe(75);
  });

  it('uses MiniMax pricing when model is MiniMax-M3', () => {
    // 1M input + 1M output → $2 + $8 = $10 = 1000 cents
    expect(estimateCostCents(1_000_000, 1_000_000, 'MiniMax-M3')).toBe(1000);
  });

  it('falls back to default pricing for unknown models', () => {
    // 1M input + 1M output → default $2 + $8 = 1000 cents
    expect(estimateCostCents(1_000_000, 1_000_000, 'unknown-model')).toBe(1000);
  });

  it('handles small token counts correctly', () => {
    // 100 input + 50 output on gpt-4o-mini:
    // (100 * 15 + 50 * 60) / 1_000_000 = (1500 + 3000) / 1_000_000 = 0.0045 cents → rounds to 0
    const cost = estimateCostCents(100, 50, 'gpt-4o-mini');
    expect(cost).toBeGreaterThanOrEqual(0);
    expect(cost).toBeLessThan(0.01);
  });
});

describe('generateBlog — mock mode', () => {
  it('returns mock content when 3 env vars are missing', async () => {
    const result = await generateBlog(
      {
        prompt: 'Yapay zeka ile yazılım geliştirme',
        tone: 'professional',
        length: 'medium',
        language: 'tr',
      },
      ctx
    );

    expect(result.mock).toBe(true);
    expect(result.title).toBeTruthy();
    expect(result.content).toContain('mock');
    expect(result.tokensUsed.total).toBe(0);
  });

  it('returns mock content when only some env vars are set', async () => {
    // Sadece AI_BASE_URL var, ama apiKey + model yok
    process.env.AI_BASE_URL = 'https://api.example.com/v1';

    const result = await generateBlog(
      {
        prompt: 'Test konusu en az on karakter',
        tone: 'technical',
        length: 'medium',
        language: 'tr',
      },
      ctx
    );
    expect(result.mock).toBe(true);
  });

  it('uses existingTitle when provided', async () => {
    const result = await generateBlog(
      {
        prompt: 'Konu',
        tone: 'casual',
        length: 'short',
        language: 'tr',
        existingTitle: 'Mevcut Başlık',
      },
      ctx
    );
    expect(result.title).toBe('Mevcut Başlık');
  });
});

describe('generateProductDescription — mock mode', () => {
  it('returns mock content when 3 env vars are missing', async () => {
    const result = await generateProductDescription(
      {
        productName: 'Next.js Starter',
        features: ['TypeScript', 'Tailwind', 'Auth'],
        variant: 'medium',
        language: 'tr',
      },
      ctx
    );

    expect(result.mock).toBe(true);
    expect(result.shortDescription).toContain('Next.js Starter');
    expect(result.description).toContain('TypeScript');
  });
});

describe('AI Service input validation (schema-level)', () => {
  it('rejects empty prompt', async () => {
    const { AiWriteSchema } = await import('../schemas');
    const result = AiWriteSchema.safeParse({
      prompt: '',
      tone: 'professional',
      length: 'medium',
      language: 'tr',
    });
    expect(result.success).toBe(false);
  });

  it('rejects too many keywords', async () => {
    const { AiWriteSchema } = await import('../schemas');
    const result = AiWriteSchema.safeParse({
      prompt: 'Valid prompt for testing',
      tone: 'professional',
      length: 'medium',
      language: 'tr',
      keywords: Array(25).fill('tag'),
    });
    expect(result.success).toBe(false);
  });
});
