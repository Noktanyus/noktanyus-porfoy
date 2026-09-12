/**
 * @file SaaS API Integration Test — Phase 2 A.5
 * @description End-to-end-ish test for /api/saas/* endpoints.
 *              withApiKey middleware mocklanır; service katmanı gerçek mocklarla çağrılır.
 *
 *   Test edilen endpoint'ler:
 *     - POST /api/saas/ai/describe           (single product description)
 *     - POST /api/saas/ai/describe/bulk      (CSV toplu iş başlatma)
 *     - GET  /api/saas/ai/jobs/[jobId]       (job detayı)
 *     - GET  /api/saas/usage                 (kullanıcı plan + usage)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mocks (module import'tan önce) ---

const mockValidateKey = vi.hoisted(() => vi.fn());
const mockTrackUsage = vi.hoisted(() => vi.fn(async () => undefined));
const aiGenerateMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    apiKeyUsage: {
      create: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    workspaceMember: {
      findFirst: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    generationJob: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    generationResult: {
      create: vi.fn(),
    },
    brandVoice: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    userSubscription: {
      findFirst: vi.fn(),
    },
    plan: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    aiUsage: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { totalTokens: 0 } }),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

vi.mock('@/modules/api-keys/service', () => ({
  apiKeyService: {
    validateKey: mockValidateKey,
    trackUsage: mockTrackUsage,
    createApiKey: vi.fn(),
    listApiKeys: vi.fn(),
    revokeApiKey: vi.fn(),
    updateApiKey: vi.fn(),
  },
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimiter: {
    check: vi.fn(() => ({ allowed: true, remaining: 999, resetIn: 60 })),
  },
  RateLimits: {
    contactForm: { capacity: 3, refillRate: 3 / 60, keyPrefix: 'contact' },
    login: { capacity: 5, refillRate: 5 / 300, keyPrefix: 'login' },
    api: { capacity: 10, refillRate: 10, keyPrefix: 'api' },
    adminApi: { capacity: 60, refillRate: 1, keyPrefix: 'admin' },
    auth: { capacity: 10, refillRate: 10 / 60, keyPrefix: 'auth' },
  },
}));

vi.mock('@/lib/planGate', () => ({
  checkAiQuota: vi.fn(async () => ({ allowed: true })),
  consumeAiQuota: vi.fn(async () => undefined),
  getCurrentMonthUsage: vi.fn(async () => ({ tokensUsed: 1000, requestsUsed: 5 })),
  getUserPlan: vi.fn(async () => 'pro'),
  getPlanLimits: vi.fn(async () => ({
    aiTokensPerMonth: 100000,
    aiRequestsPerMonth: 500,
  })),
}));

vi.mock('@/lib/ai-client', () => ({
  isAiConfigured: vi.fn(() => false), // mock mode → mock response
  getAiClient: vi.fn(),
  getActiveModel: vi.fn(() => 'mock'),
  getActiveProviderDisplayName: vi.fn(() => 'mock'),
  MAX_GENERATION_TOKENS: 4096,
}));

vi.mock('@/modules/ai/service', () => ({
  aiService: {
    generateProductDescription: aiGenerateMock,
    generateBlog: vi.fn(),
  },
}));

vi.mock('@/lib/queue', () => ({
  Jobs: { AiBulkGenerate: 'ai.bulk.generate' },
  queue: {
    add: vi.fn(async () => undefined),
    register: vi.fn(),
    driver: 'memory',
    close: vi.fn(async () => undefined),
  },
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(async () => undefined),
}));

// ai-bulk service'i mocklamak yerine bırakalım — gerçek parseCsv çalışsın (DB yok ama validate için OK)
// Not: brand-voice.service brandVoice.findFirst'i prisma'dan çekiyor; prisma mocklu

import { prisma } from '@/lib/prisma';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const mockPrisma = prisma as unknown as {
  workspaceMember: { findFirst: ReturnType<typeof vi.fn> };
  brandVoice: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
  generationJob: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

const STANDARD_API_KEY_CTX = {
  userId: 'user-api-1',
  keyId: 'key-1',
  scopes: ['ai:describe:write', 'ai:bulk:write', 'ai:brand-voice:write', 'ai:describe:read'],
  rateLimit: 1000,
};

let tmpDir = '';

beforeEach(async () => {
  vi.clearAllMocks();
  mockValidateKey.mockResolvedValue(STANDARD_API_KEY_CTX);
  mockPrisma.workspaceMember.findFirst.mockResolvedValue({ id: 'member-1' });

  // AI generate mock success — product name'i içerecek şekilde
  aiGenerateMock.mockImplementation(async (input: { productName: string }) => ({
    shortDescription: `${input.productName} — Mock AI tarafından üretildi`,
    description: `${input.productName} için uzun mock açıklama içeriği.`,
    suggestedTags: ['mock', 'tag'],
    tokensUsed: { input: 5, output: 10, total: 15 },
    mock: true,
  }));

  if (!tmpDir) {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'saas-api-test-'));
  }
});

// --- Request builders ---

function makePostRequest(
  url: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
): unknown {
  return {
    json: async () => body,
    headers: {
      get: (k: string) => {
        const key = k.toLowerCase();
        if (key === 'authorization') return headers.authorization ?? 'Bearer test-key';
        if (key === 'x-api-key') return headers['x-api-key'] ?? null;
        if (key === 'x-workspace-id') return headers['x-workspace-id'] ?? null;
        if (key === 'content-type') return headers['content-type'] ?? 'application/json';
        if (key === 'x-forwarded-for') return '127.0.0.1';
        if (key === 'user-agent') return 'vitest';
        return null;
      },
    },
    nextUrl: {
      pathname: new URL(url).pathname,
      searchParams: new URL(url).searchParams,
    },
    url,
    method: 'POST',
  };
}

function makeGetRequest(url: string, headers: Record<string, string> = {}): unknown {
  const u = new URL(url);
  return {
    nextUrl: {
      pathname: u.pathname,
      searchParams: u.searchParams,
      href: u.href,
      origin: u.origin,
    },
    url: u.href,
    headers: {
      get: (k: string) => {
        const key = k.toLowerCase();
        if (key === 'authorization') return headers.authorization ?? 'Bearer test-key';
        if (key === 'x-api-key') return headers['x-api-key'] ?? null;
        if (key === 'x-workspace-id') return headers['x-workspace-id'] ?? null;
        return null;
      },
    },
    method: 'GET',
  };
}

function makeJsonRequestWithWorkspace(
  url: string,
  body: Record<string, unknown>
): unknown {
  return makePostRequest(url, body, { 'x-workspace-id': 'ws-test-1' });
}

// ============================================================================
// POST /api/saas/ai/describe
// ============================================================================

/**
 * withApiKey, async olarak tanımlandığı için `export const POST = withApiKey(handler)`
 * ifadesi POST'u Promise olarak export eder. Next.js build sırasında bunu çözer
 * ama testlerde manuel olarak `await` edip gerçek handler'ı almamız gerekir.
 */
async function loadDescribePost() {
  const mod = await import('@/app/api/saas/ai/describe/route');
  return (await mod.POST) as (req: unknown) => Promise<Response>;
}

async function loadBulkPost() {
  const mod = await import('@/app/api/saas/ai/describe/bulk/route');
  return (await mod.POST) as (req: unknown) => Promise<Response>;
}

async function loadJobGet() {
  const mod = await import('@/app/api/saas/ai/jobs/[jobId]/route');
  return (await mod.GET) as (req: unknown) => Promise<Response>;
}

async function loadUsageGet() {
  const mod = await import('@/app/api/saas/usage/route');
  return (await mod.GET) as (req: unknown) => Promise<Response>;
}

describe('POST /api/saas/ai/describe', () => {
  it('happy path: generates product description (mock mode)', async () => {
    const POST = await loadDescribePost();

    const req = makeJsonRequestWithWorkspace('http://localhost/api/saas/ai/describe', {
      workspaceId: 'ws-test-1',
      productName: 'Akıllı Saat',
      features: ['GPS', 'Su geçirmez', '7 gün pil'],
      variant: 'medium',
      language: 'tr',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.shortDescription).toContain('Akıllı Saat');
    expect(json.data.description).toBeTruthy();
    expect(json.data.brandVoice).toBeNull();
  });

  it('returns 400 when productName too short', async () => {
    const POST = await loadDescribePost();

    const req = makeJsonRequestWithWorkspace('http://localhost/api/saas/ai/describe', {
      workspaceId: 'ws-test-1',
      productName: 'X', // too short
      features: ['f'],
      variant: 'short',
      language: 'en',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 403 when scope missing', async () => {
    mockValidateKey.mockResolvedValueOnce({
      ...STANDARD_API_KEY_CTX,
      scopes: ['ai:describe:read'], // no write scope
    });

    const POST = await loadDescribePost();

    const req = makeJsonRequestWithWorkspace('http://localhost/api/saas/ai/describe', {
      workspaceId: 'ws-test-1',
      productName: 'Prod',
      features: ['f'],
      variant: 'short',
      language: 'en',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 when user is not workspace member', async () => {
    mockPrisma.workspaceMember.findFirst.mockResolvedValueOnce(null);

    const POST = await loadDescribePost();

    const req = makeJsonRequestWithWorkspace('http://localhost/api/saas/ai/describe', {
      workspaceId: 'ws-other',
      productName: 'Prod',
      features: ['f'],
      variant: 'short',
      language: 'en',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('WORKSPACE_FORBIDDEN');
  });

  it('returns 404 when brandVoiceId not in workspace', async () => {
    mockPrisma.brandVoice.findFirst.mockResolvedValueOnce(null);

    const POST = await loadDescribePost();

    const req = makeJsonRequestWithWorkspace('http://localhost/api/saas/ai/describe', {
      workspaceId: 'ws-test-1',
      productName: 'Prod',
      features: ['f'],
      variant: 'short',
      language: 'en',
      brandVoiceId: 'bv-missing',
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('BRAND_VOICE_NOT_FOUND');
  });

  it('returns 403 QUOTA_EXCEEDED when quota check fails', async () => {
    const { checkAiQuota } = await import('@/lib/planGate');
    vi.mocked(checkAiQuota).mockResolvedValueOnce({
      allowed: false,
      reason: 'Limit doldu',
    } as never);

    const POST = await loadDescribePost();

    const req = makeJsonRequestWithWorkspace('http://localhost/api/saas/ai/describe', {
      workspaceId: 'ws-test-1',
      productName: 'Prod',
      features: ['f'],
      variant: 'short',
      language: 'en',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('QUOTA_EXCEEDED');
  });
});

// ============================================================================
// POST /api/saas/ai/describe/bulk
// ============================================================================

describe('POST /api/saas/ai/describe/bulk', () => {
  it('happy path: starts job via JSON body (csvPath provided)', async () => {
    const csvPath = path.join(tmpDir, 'bulk.csv');
    await fs.writeFile(
      csvPath,
      ['title,features', 'P1,"fa;fb"', 'P2,"fc"'].join('\n'),
      'utf-8'
    );

    mockPrisma.generationJob.create.mockResolvedValueOnce({
      id: 'job-bulk-1',
      workspaceId: 'ws-test-1',
      totalRows: 2,
    });

    const POST = await loadBulkPost();

    const req = makeJsonRequestWithWorkspace('http://localhost/api/saas/ai/describe/bulk', {
      workspaceId: 'ws-test-1',
      csvPath,
      language: 'tr',
      length: 'medium',
    });

    const res = await POST(req);
    expect(res.status).toBe(202);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.jobId).toBe('job-bulk-1');
    expect(json.data.totalRows).toBe(2);
    expect(json.data.status).toBe('pending');
  });

  it('returns 400 CSV_REQUIRED when csvPath missing in JSON body', async () => {
    const POST = await loadBulkPost();

    const req = makeJsonRequestWithWorkspace('http://localhost/api/saas/ai/describe/bulk', {
      workspaceId: 'ws-test-1',
      language: 'tr',
      length: 'medium',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('CSV_REQUIRED');
  });

  it('returns 415 for unsupported content-type', async () => {
    const POST = await loadBulkPost();

    const baseReq = makeJsonRequestWithWorkspace(
      'http://localhost/api/saas/ai/describe/bulk',
      {}
    ) as Record<string, unknown>;
    const req = {
      ...baseReq,
      headers: {
        get: (k: string) => {
          if (k.toLowerCase() === 'authorization') return 'Bearer test-key';
          if (k.toLowerCase() === 'x-workspace-id') return 'ws-test-1';
          if (k.toLowerCase() === 'content-type') return 'text/plain';
          return null;
        },
      },
    };

    const res = await POST(req);
    expect(res.status).toBe(415);
    const json = await res.json();
    expect(json.error.code).toBe('UNSUPPORTED_CONTENT_TYPE');
  });

  it('returns 400 when CSV has no valid rows', async () => {
    const csvPath = path.join(tmpDir, 'empty.csv');
    await fs.writeFile(csvPath, 'title,features\n,,', 'utf-8');

    const POST = await loadBulkPost();

    const req = makeJsonRequestWithWorkspace('http://localhost/api/saas/ai/describe/bulk', {
      workspaceId: 'ws-test-1',
      csvPath,
      language: 'tr',
      length: 'medium',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('BULK_START_FAILED');
    expect(json.error.message).toMatch(/geçerli satır/);
  });

  it('returns 403 when scope ai:bulk:write missing', async () => {
    mockValidateKey.mockResolvedValueOnce({
      ...STANDARD_API_KEY_CTX,
      scopes: ['ai:describe:read'], // bulk yok
    });

    const POST = await loadBulkPost();

    const req = makeJsonRequestWithWorkspace('http://localhost/api/saas/ai/describe/bulk', {
      workspaceId: 'ws-test-1',
      csvPath: '/x/a',
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ============================================================================
// GET /api/saas/ai/jobs/[jobId]
// ============================================================================

describe('GET /api/saas/ai/jobs/[jobId]', () => {
  it('happy path: returns job with results when user owns workspace', async () => {
    const jobId = 'job-' + Math.random().toString(36).slice(2);
    // getJobWorkspaceIfOwned → generationJob.findUnique
    mockPrisma.generationJob.findUnique.mockResolvedValueOnce({
      workspaceId: 'ws-test-1',
    });
    // getJobStatus → generationJob.findFirst
    mockPrisma.generationJob.findFirst.mockResolvedValueOnce({
      id: jobId,
      workspaceId: 'ws-test-1',
      status: 'completed',
      totalRows: 2,
      processedRows: 2,
      successfulRows: 2,
      failedRows: 0,
      options: { language: 'tr', length: 'medium' },
      brandVoice: { id: 'bv-1', name: 'A' },
      brandVoiceId: 'bv-1',
      csvPath: 'x',
      csvOriginalName: null,
      outputCsvPath: '/uploads/x.csv',
      createdAt: new Date('2026-01-01'),
      startedAt: new Date('2026-01-01'),
      completedAt: new Date('2026-01-01'),
      errorMessage: null,
      results: [
        {
          rowIndex: 0,
          inputTitle: 'P1',
          inputFeatures: 'fa',
          shortDescription: 's',
          description: 'd',
          tags: ['t'],
          inputTokens: 5,
          outputTokens: 10,
          costCents: 0,
          model: 'mock',
          errorMessage: null,
          createdAt: new Date(),
        },
      ],
    });

    const GET = await loadJobGet();

    const req = makeGetRequest(
      `http://localhost/api/saas/ai/jobs/${jobId}?limit=10`,
      { 'x-workspace-id': 'ws-test-1' }
    );

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.jobId).toBe(jobId);
    expect(json.data.status).toBe('completed');
    expect(json.data.results).toHaveLength(1);
    expect(json.data.brandVoice.name).toBe('A');
  });

  it('returns 404 when job not found or user not workspace member', async () => {
    // getJobWorkspaceIfOwned → generationJob.findUnique returns null
    mockPrisma.generationJob.findUnique.mockResolvedValueOnce(null);

    const GET = await loadJobGet();

    const req = makeGetRequest('http://localhost/api/saas/ai/jobs/missing');

    const res = await GET(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('NOT_FOUND');
  });
});

// ============================================================================
// GET /api/saas/usage
// ============================================================================

describe('GET /api/saas/usage', () => {
  it('returns plan + current month usage summary', async () => {
    const GET = await loadUsageGet();

    const req = makeGetRequest('http://localhost/api/saas/usage');

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.planSlug).toBe('pro');
    expect(json.data.currentMonthUsage.tokensUsed).toBe(1000);
    expect(json.data.currentMonthUsage.requestsUsed).toBe(5);
    expect(json.data.limits.tokens).toBe(100000);
    expect(json.data.limits.requests).toBe(500);
    expect(json.data.remaining.tokens).toBe(99000);
    expect(json.data.remaining.requests).toBe(495);
  });

  it('returns isUnlimited=true for enterprise plan', async () => {
    const { getUserPlan, getPlanLimits } = await import('@/lib/planGate');
    vi.mocked(getUserPlan).mockResolvedValueOnce('enterprise');
    vi.mocked(getPlanLimits).mockResolvedValueOnce({
      aiTokensPerMonth: Number.POSITIVE_INFINITY,
      aiRequestsPerMonth: Number.POSITIVE_INFINITY,
    });

    const GET = await loadUsageGet();
    const req = makeGetRequest('http://localhost/api/saas/usage');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.isUnlimited).toBe(true);
    expect(json.data.limits.tokens).toBeNull(); // Infinity → null
    expect(json.data.limits.requests).toBeNull();
    expect(json.data.remaining.tokens).toBeNull();
  });

  it('returns 401 when API key is invalid', async () => {
    mockValidateKey.mockResolvedValueOnce(null);

    const GET = await loadUsageGet();
    const req = makeGetRequest('http://localhost/api/saas/usage');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_KEY');
  });
});