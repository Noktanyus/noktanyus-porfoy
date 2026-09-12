/**
 * Policy Generator — Unit Tests (Phase 4 C.3)
 *
 * Test coverage:
 *   - generatePolicyWithAI (mock provider mode)
 *   - generatePolicyWithAI (real provider mode with mocked OpenAI)
 *   - scanResults injection (cookies, scripts → policy content)
 *   - customClauses appending
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

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
    privacyPolicy: {
      create: vi.fn().mockResolvedValue({ id: 'policy-1' }),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('@/lib/planGate', () => ({
  checkAiQuota: vi.fn(async () => ({ allowed: true })),
  consumeAiQuota: vi.fn(async () => undefined),
  getCurrentMonthUsage: vi.fn(async () => ({ tokensUsed: 0, requestsUsed: 0 })),
  getUserPlan: vi.fn(async () => 'pro'),
  getPlanLimits: vi.fn(async () => null),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

const mockGetAiClient = vi.fn();
const mockGetActiveModel = vi.fn(() => 'gpt-4o-mini');
const mockGetActiveProviderDisplayName = vi.fn(() => 'OpenAI');

vi.mock('@/lib/ai-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai-client')>('@/lib/ai-client');
  return {
    ...actual,
    getAiClient: () => mockGetAiClient(),
    getActiveModel: () => mockGetActiveModel(),
    getActiveProviderDisplayName: () => mockGetActiveProviderDisplayName(),
    isAiConfigured: vi.fn(),
    MAX_GENERATION_TOKENS: 4096,
  };
});

// Mock fs.readFile for the template
vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>(
    'node:fs/promises'
  );
  return {
    ...actual,
    readFile: vi.fn(async (path: string) => {
      if (typeof path === 'string' && path.includes('kvkk')) {
        return `# KVKK Privacy Policy\n\nŞirket: {{COMPANY_NAME}}\nDomain: {{DOMAIN}}\nEmail: {{CONTACT_EMAIL}}\nCookie listesi:\n{{COOKIE_LIST}}\nÜçüncü taraf:\n{{SCAN_THIRD_PARTY_LIST}}\nTarih: {{POLICY_DATE}}\nVersiyon: {{VERSION}}`;
      }
      if (typeof path === 'string' && path.includes('gdpr')) {
        return `# GDPR Policy\n\n{{COMPANY_NAME}}\n{{DOMAIN}}`;
      }
      if (typeof path === 'string' && path.includes('kvkk-gdpr')) {
        return `# KVKK + GDPR\n\n{{COMPANY_NAME}}\n{{COOKIE_LIST}}\n{{SCAN_THIRD_PARTY_LIST}}`;
      }
      throw new Error(`Mock template not found: ${path}`);
    }),
  };
});

// ============================================================================
// Imports (after mocks)
// ============================================================================

import { isAiConfigured } from '@/lib/ai-client';
import { generatePolicyWithAI, type GeneratePolicyInput } from '../policyGenerator';

const mockIsAiConfigured = isAiConfigured as unknown as ReturnType<typeof vi.fn>;

const baseInput: GeneratePolicyInput = {
  jurisdiction: 'KVKK',
  companyName: 'Test Şirketi AŞ',
  domain: 'test.com.tr',
  country: 'TR',
};

const ctx = {
  userId: 'user-1',
  userEmail: 'admin@test.com.tr',
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
};

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.AI_BASE_URL;
  delete process.env.AI_API_KEY;
  delete process.env.AI_MODEL;
  mockIsAiConfigured.mockReturnValue(false);
});

afterEach(() => {
  process.env = { ...originalEnv };
});

// ============================================================================
// generatePolicyWithAI — mock mode
// ============================================================================

describe('generatePolicyWithAI — mock mode (env missing)', () => {
  it('returns mock content when AI is not configured', async () => {
    const result = await generatePolicyWithAI(baseInput, ctx);

    expect(result.mock).toBe(true);
    expect(result.jurisdiction).toBe('KVKK');
    expect(result.language).toBe('tr');
    expect(result.baseTemplate).toBe('kvkk');
    expect(result.tokensUsed.total).toBe(0);
    expect(result.costCents).toBe(0);
    expect(result.model).toBeNull();
  });

  it('substitutes template placeholders with input values', async () => {
    const result = await generatePolicyWithAI(
      { ...baseInput, companyName: 'Acme AŞ' },
      ctx
    );

    expect(result.content).toContain('Acme AŞ');
    expect(result.content).toContain('test.com.tr');
    expect(result.content).toContain('@test.com.tr');
  });

  it('uses default language based on jurisdiction', async () => {
    const kvkkResult = await generatePolicyWithAI(baseInput, ctx);
    expect(kvkkResult.language).toBe('tr');

    const gdprInput: GeneratePolicyInput = {
      jurisdiction: 'GDPR',
      companyName: 'Test Inc',
      domain: 'test.com',
      country: 'DE',
    };
    const gdprResult = await generatePolicyWithAI(gdprInput, ctx);
    expect(gdprResult.language).toBe('en');
  });

  it('respects explicit language override', async () => {
    const result = await generatePolicyWithAI(
      { ...baseInput, language: 'en' },
      ctx
    );
    expect(result.language).toBe('en');
  });

  it('builds title with company name and jurisdiction', async () => {
    const result = await generatePolicyWithAI(
      { ...baseInput, companyName: 'Acme' },
      ctx
    );
    expect(result.title).toContain('Acme');
    expect(result.title).toContain('KVKK');
  });

  it('uses default version = 1', async () => {
    const result = await generatePolicyWithAI(baseInput, ctx);
    expect(result.version).toBe(1);
  });

  it('respects explicit version override', async () => {
    const result = await generatePolicyWithAI(
      { ...baseInput, version: 5 },
      ctx
    );
    expect(result.version).toBe(5);
  });

  it('includes generatedAt as ISO string', async () => {
    const result = await generatePolicyWithAI(baseInput, ctx);
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ============================================================================
// generatePolicyWithAI — scanResults injection
// ============================================================================

describe('generatePolicyWithAI — scanResults injection', () => {
  it('injects cookie list into policy', async () => {
    const result = await generatePolicyWithAI(
      {
        ...baseInput,
        scanResults: {
          cookies: [
            {
              name: '_ga',
              type: 'analytics',
              provider: 'Google Analytics',
              duration: '1 year',
              exemptFromConsent: false,
            },
            {
              name: 'session_id',
              type: 'necessary',
              provider: 'first-party',
              duration: 'session',
              exemptFromConsent: true,
            },
          ],
          trackingScripts: [],
          forms: [],
          threats: [],
          pagesScanned: 1,
          durationMs: 1000,
          score: 85,
        },
      },
      ctx
    );

    expect(result.content).toContain('_ga');
    expect(result.content).toContain('Google Analytics');
    expect(result.content).toContain('session_id');
  });

  it('injects 3rd party tracking scripts into policy', async () => {
    const result = await generatePolicyWithAI(
      {
        ...baseInput,
        scanResults: {
          cookies: [],
          trackingScripts: [
            {
              url: 'https://www.google-analytics.com/analytics.js',
              provider: 'Google Analytics / GTM',
              knownTracker: 'GA4',
              gdprCompliant: false,
            },
          ],
          forms: [],
          threats: [],
          pagesScanned: 1,
          durationMs: 1000,
          score: 90,
        },
      },
      ctx
    );

    expect(result.content).toContain('Google Analytics');
  });

  it('handles empty scanResults gracefully', async () => {
    const result = await generatePolicyWithAI(
      {
        ...baseInput,
        scanResults: {
          cookies: [],
          trackingScripts: [],
          forms: [],
          threats: [],
          pagesScanned: 0,
          durationMs: 0,
          score: 100,
        },
      },
      ctx
    );

    expect(result.mock).toBe(true);
    expect(result.content).toBeTruthy();
  });
});

// ============================================================================
// generatePolicyWithAI — customClauses
// ============================================================================

describe('generatePolicyWithAI — customClauses', () => {
  it('appends custom clauses to base content', async () => {
    const result = await generatePolicyWithAI(
      {
        ...baseInput,
        customClauses: ['Özel madde 1: Ek KVKK hükmü.', 'Özel madde 2: Çocuk verisi işlemiyoruz.'],
      },
      ctx
    );

    expect(result.content).toContain('Özel madde 1');
    expect(result.content).toContain('Özel madde 2');
    expect(result.content).toContain('## Ek Maddeler');
  });

  it('skips empty/whitespace-only custom clauses', async () => {
    const result = await generatePolicyWithAI(
      {
        ...baseInput,
        customClauses: ['', '   ', 'Gerçek içerikli madde.'],
      },
      ctx
    );

    expect(result.content).toContain('Gerçek içerikli madde');
  });

  it('does not add custom clauses section when none provided', async () => {
    const result = await generatePolicyWithAI(baseInput, ctx);
    expect(result.content).not.toContain('## Ek Maddeler');
  });

  it('sanitizes HTML comments from custom clauses', async () => {
    const result = await generatePolicyWithAI(
      {
        ...baseInput,
        customClauses: ['<!-- hidden -->Görünür içerik'],
      },
      ctx
    );

    expect(result.content).toContain('Görünür içerik');
    expect(result.content).not.toContain('<!-- hidden -->');
  });
});

// ============================================================================
// generatePolicyWithAI — real provider mode (mocked OpenAI)
// ============================================================================

describe('generatePolicyWithAI — real provider mode', () => {
  beforeEach(() => {
    process.env.AI_BASE_URL = 'https://api.openai.com/v1';
    process.env.AI_API_KEY = 'sk-test';
    process.env.AI_MODEL = 'gpt-4o-mini';
    mockIsAiConfigured.mockReturnValue(true);

    const mockCreate = vi.fn(async () => ({
      id: 'cmpl-test',
      model: 'gpt-4o-mini',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant' as const,
            content: `# AI Generated Policy\n\nBu ${'x'.repeat(200)} policy metnidir.`,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300,
      },
    }));

    mockGetAiClient.mockReturnValue({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    });
  });

  it('returns mock=false when AI is configured', async () => {
    const result = await generatePolicyWithAI(baseInput, ctx);
    expect(result.mock).toBe(false);
  });

  it('tracks token usage from AI response', async () => {
    const result = await generatePolicyWithAI(baseInput, ctx);
    expect(result.tokensUsed.input).toBe(100);
    expect(result.tokensUsed.output).toBe(200);
    expect(result.tokensUsed.total).toBe(300);
  });

  it('uses model from AI response', async () => {
    const result = await generatePolicyWithAI(baseInput, ctx);
    expect(result.model).toBe('gpt-4o-mini');
  });

  it('falls back to mock on AI error', async () => {
    mockGetAiClient.mockReturnValue({
      chat: {
        completions: {
          create: vi.fn(async () => {
            throw new Error('AI provider unavailable');
          }),
        },
      },
    });

    const result = await generatePolicyWithAI(baseInput, ctx);
    expect(result.mock).toBe(true);
    expect(result.tokensUsed.total).toBe(0);
  });
});

// ============================================================================
// generatePolicyWithAI — different jurisdictions
// ============================================================================

describe('generatePolicyWithAI — jurisdiction handling', () => {
  it('selects kvkk template for KVKK', async () => {
    const result = await generatePolicyWithAI(
      { ...baseInput, jurisdiction: 'KVKK' },
      ctx
    );
    expect(result.baseTemplate).toBe('kvkk');
  });

  it('selects gdpr template for GDPR', async () => {
    const result = await generatePolicyWithAI(
      { ...baseInput, jurisdiction: 'GDPR' },
      ctx
    );
    expect(result.baseTemplate).toBe('gdpr');
  });

  it('selects kvkk-gdpr template for combined', async () => {
    const result = await generatePolicyWithAI(
      { ...baseInput, jurisdiction: 'KVKK+GDPR' },
      ctx
    );
    expect(result.baseTemplate).toBe('kvkk-gdpr');
  });
});
