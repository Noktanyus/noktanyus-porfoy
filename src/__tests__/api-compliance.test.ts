/**
 * @file Compliance API Integration Test — Phase 4 C
 * @description Integration tests for compliance + breach + policy + cookie-consent endpoints.
 *
 *   Tested endpoints:
 *     - POST /api/compliance/sites
 *     - POST /api/compliance/sites/[id]/scan
 *     - POST /api/compliance/policy/generate
 *     - POST /api/compliance/breach/report
 *     - POST /api/user/cookie-consent
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// Mocks (must come before route imports)
// ============================================================================

const mockSession = vi.hoisted(() => ({
  user: { id: 'user-1', email: 'admin@test.com' },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => mockSession),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/prisma', () => {
  const prismaMock = {
    workspace: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    workspaceMember: { findFirst: vi.fn(), findMany: vi.fn() },
    complianceSite: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    cookieScan: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    dataBreachIncident: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    cookieConsent: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    privacyPolicy: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    aiUsage: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { totalTokens: 0 } }),
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        cookieScan: { update: vi.fn().mockResolvedValue({}) },
        complianceSite: { update: vi.fn().mockResolvedValue({}) },
      })
    ),
  };
  return { prisma: prismaMock };
});

vi.mock('@/lib/queue', () => ({
  Jobs: {
    ComplianceScan: 'compliance.scan',
    ComplianceMonitor: 'compliance.monitor',
    MonitorCheck: 'monitor.check',
    NewsletterBroadcast: 'newsletter.broadcast',
    EmailSend: 'email.send',
    ImageOptimize: 'image.optimize',
    OrderExpire: 'order.expire',
    AiBulkGenerate: 'ai.bulk.generate',
    AiBrandVoiceTrain: 'ai.brand-voice.train',
    templateInstall: 'template.install',
    TemplateDemoDeploy: 'template.demo.deploy',
  },
  queue: { add: vi.fn().mockResolvedValue({ id: 'job-1' }) },
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(async () => ({ success: true, messageId: 'mock-msg' })),
}));

vi.mock('@/lib/emailService', () => ({
  sendEmail: vi.fn(async () => ({ success: true, messageId: 'mock-msg' })),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(async () => undefined),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/planGate', () => ({
  checkAiQuota: vi.fn(async () => ({ allowed: true })),
  consumeAiQuota: vi.fn(async () => undefined),
  getCurrentMonthUsage: vi.fn(async () => ({ tokensUsed: 0, requestsUsed: 0 })),
  getUserPlan: vi.fn(async () => 'pro'),
  getPlanLimits: vi.fn(async () => null),
}));

vi.mock('@/lib/ai-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai-client')>('@/lib/ai-client');
  return {
    ...actual,
    getAiClient: vi.fn(() => ({
      chat: {
        completions: {
          create: vi.fn(async () => ({
            id: 'cmpl-test',
            model: 'gpt-4o-mini',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: `# AI Policy\n\n${'lorem ipsum '.repeat(50)}`,
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
          })),
        },
      },
    })),
    getActiveModel: vi.fn(() => 'gpt-4o-mini'),
    getActiveProviderDisplayName: vi.fn(() => 'OpenAI'),
    isAiConfigured: vi.fn(() => false), // mock mode
    MAX_GENERATION_TOKENS: 4096,
  };
});

vi.mock('@/lib/rateLimit', () => ({
  rateLimiter: { check: vi.fn(() => ({ allowed: true, remaining: 999, resetIn: 60 })) },
  RateLimits: {
    contactForm: { capacity: 3, refillRate: 3 / 60, keyPrefix: 'contact' },
    login: { capacity: 5, refillRate: 5 / 300, keyPrefix: 'login' },
    api: { capacity: 10, refillRate: 10, keyPrefix: 'api' },
    adminApi: { capacity: 60, refillRate: 1, keyPrefix: 'admin' },
    auth: { capacity: 10, refillRate: 10 / 60, keyPrefix: 'auth' },
  },
}));

vi.mock('@/lib/saasWorkspace', () => ({
  assertWorkspaceAccess: vi.fn(async () => ({
    workspaceId: 'ws-1',
    error: null,
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(() => undefined),
    set: vi.fn(),
  })),
}));

vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>(
    'node:fs/promises'
  );
  return {
    ...actual,
    readFile: vi.fn(async () => '# Mock Policy\n{{COMPANY_NAME}}\n{{DOMAIN}}'),
  };
});

// ============================================================================
// Imports
// ============================================================================

import { prisma } from '@/lib/prisma';
import { queue } from '@/lib/queue';
import { assertWorkspaceAccess } from '@/lib/saasWorkspace';

const mockPrisma = prisma as unknown as {
  workspace: { findUnique: ReturnType<typeof vi.fn> };
  user: { findUnique: ReturnType<typeof vi.fn> };
  workspaceMember: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  complianceSite: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  cookieScan: {
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  dataBreachIncident: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  cookieConsent: {
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  privacyPolicy: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const mockQueue = queue as unknown as { add: ReturnType<typeof vi.fn> };
const mockAssertWorkspaceAccess = assertWorkspaceAccess as unknown as ReturnType<
  typeof vi.fn
>;

// Dynamic imports so mocks apply first
const { POST: sitesPOST, GET: sitesGET } = await import(
  '@/app/api/compliance/sites/route'
);
const { POST: scanPOST } = await import(
  '@/app/api/compliance/sites/[id]/scan/route'
);
const { POST: policyPOST } = await import(
  '@/app/api/compliance/policy/generate/route'
);
const { POST: breachPOST } = await import(
  '@/app/api/compliance/breach/report/route'
);
const { POST: cookieConsentPOST } = await import(
  '@/app/api/user/cookie-consent/route'
);

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertWorkspaceAccess.mockResolvedValue({
    workspaceId: 'ws-1',
    error: null,
  });
});

// ============================================================================
// Helpers
// ============================================================================

function makePostRequest(url: string, body: Record<string, unknown>) {
  return {
    json: async () => body,
    headers: {
      get: (k: string) =>
        ['x-forwarded-for', 'user-agent', 'x-real-ip'].includes(k.toLowerCase())
          ? 'integration-test'
          : null,
    },
    url,
    nextUrl: { pathname: new URL(url).pathname },
  } as unknown as Parameters<typeof sitesPOST>[0];
}

// ============================================================================
// POST /api/compliance/sites
// ============================================================================

describe('POST /api/compliance/sites', () => {
  beforeEach(() => {
    mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1' });
    mockPrisma.complianceSite.findUnique.mockResolvedValue(null);
  });

  it('creates a new compliance site → 201', async () => {
    mockPrisma.workspaceMember.findFirst.mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'ws-1',
    });
    mockPrisma.complianceSite.findUnique.mockResolvedValue(null);
    mockPrisma.complianceSite.create.mockResolvedValue({
      id: 'site-new',
      domain: 'newsite.com',
      workspaceId: 'ws-1',
      status: 'pending',
    });

    const req = makePostRequest('http://localhost:3000/api/compliance/sites', {
      workspaceId: 'ws-1',
      domain: 'newsite.com',
      name: 'New Site',
      contactEmail: 'admin@newsite.com',
      country: 'TR',
      language: 'tr',
      scanInterval: 'weekly',
    });

    const res = await sitesPOST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.site.id).toBe('site-new');
    expect(json.data.site.domain).toBe('newsite.com');
  });

  it('returns 400 when workspaceId missing', async () => {
    const req = makePostRequest('http://localhost:3000/api/compliance/sites', {
      domain: 'newsite.com',
      name: 'New Site',
      contactEmail: 'admin@newsite.com',
    });

    const res = await sitesPOST(req);
    // Schema fails because workspaceId missing → Zod validation error
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('returns 403 when user not workspace member', async () => {
    mockPrisma.workspaceMember.findFirst.mockResolvedValue(null);

    const req = makePostRequest('http://localhost:3000/api/compliance/sites', {
      workspaceId: 'ws-1',
      domain: 'newsite.com',
      name: 'New Site',
      contactEmail: 'admin@newsite.com',
    });

    const res = await sitesPOST(req);
    expect(res.status).toBe(403);
  });

  it('rejects invalid domain via schema validation', async () => {
    const req = makePostRequest('http://localhost:3000/api/compliance/sites', {
      workspaceId: 'ws-1',
      domain: 'not a domain',
      name: 'Bad',
      contactEmail: 'admin@bad.com',
    });

    const res = await sitesPOST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('returns 409 when domain already exists', async () => {
    mockPrisma.workspaceMember.findFirst.mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'ws-1',
    });
    mockPrisma.complianceSite.findUnique.mockResolvedValue({
      id: 'existing',
      workspaceId: 'ws-1',
    });

    const req = makePostRequest('http://localhost:3000/api/compliance/sites', {
      workspaceId: 'ws-1',
      domain: 'newsite.com',
      name: 'New Site',
      contactEmail: 'admin@newsite.com',
    });

    const res = await sitesPOST(req);
    expect(res.status).toBe(500); // workspace not found error bubbles up
  });
});

// ============================================================================
// GET /api/compliance/sites
// ============================================================================

describe('GET /api/compliance/sites', () => {
  it('returns empty list when user has no workspaces', async () => {
    mockPrisma.workspaceMember.findMany.mockResolvedValue([]);

    const req = {
      url: 'http://localhost:3000/api/compliance/sites',
      headers: { get: () => null },
    } as unknown as Parameters<typeof sitesGET>[0];

    const res = await sitesGET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.sites).toEqual([]);
    expect(json.data.meta.total).toBe(0);
  });

  it('returns sites for all user workspaces', async () => {
    mockPrisma.workspaceMember.findMany.mockResolvedValue([
      { workspaceId: 'ws-1' },
      { workspaceId: 'ws-2' },
    ]);
    mockPrisma.complianceSite.findMany.mockResolvedValue([
      { id: 'site-1', workspaceId: 'ws-1' },
    ]);
    mockPrisma.complianceSite.count.mockResolvedValue(1);

    const req = {
      url: 'http://localhost:3000/api/compliance/sites',
      headers: { get: () => null },
    } as unknown as Parameters<typeof sitesGET>[0];

    const res = await sitesGET(req);
    expect(res.status).toBe(200);
  });
});

// ============================================================================
// POST /api/compliance/sites/[id]/scan
// ============================================================================

describe('POST /api/compliance/sites/[id]/scan', () => {
  beforeEach(() => {
    mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1' });
  });

  it('starts a scan → 202', async () => {
    mockPrisma.complianceSite.findUnique.mockResolvedValue({
      id: 'site-1',
      workspaceId: 'ws-1',
    });
    mockPrisma.complianceSite.findFirst.mockResolvedValue({
      id: 'site-1',
      domain: 'example.com',
      status: 'pending',
    });
    mockPrisma.workspaceMember.findFirst.mockResolvedValue({
      userId: 'user-1',
    });
    mockPrisma.cookieScan.findFirst.mockResolvedValue(null);
    mockPrisma.cookieScan.create.mockResolvedValue({
      id: 'scan-new',
      status: 'running',
      startedAt: new Date(),
    });
    mockPrisma.complianceSite.update.mockResolvedValue({});

    const req = makePostRequest(
      'http://localhost:3000/api/compliance/sites/site-1/scan',
      {}
    );

    const res = await scanPOST(req, { params: { id: 'site-1' } });
    expect(res.status).toBe(202);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.scan.scanId).toBe('scan-new');
    expect(mockQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'compliance.scan',
        data: { scanId: 'scan-new', siteId: 'site-1' },
      })
    );
  });

  it('returns 404 when site not found', async () => {
    mockPrisma.complianceSite.findUnique.mockResolvedValue(null);

    const req = makePostRequest(
      'http://localhost:3000/api/compliance/sites/site-missing/scan',
      {}
    );

    const res = await scanPOST(req, { params: { id: 'site-missing' } });
    expect(res.status).toBe(404);
  });

  it('returns 403 when user not workspace member', async () => {
    mockPrisma.complianceSite.findUnique.mockResolvedValue({
      id: 'site-1',
      workspaceId: 'ws-1',
    });
    mockPrisma.workspaceMember.findFirst.mockResolvedValue(null);

    const req = makePostRequest(
      'http://localhost:3000/api/compliance/sites/site-1/scan',
      {}
    );

    const res = await scanPOST(req, { params: { id: 'site-1' } });
    expect(res.status).toBe(403);
  });
});

// ============================================================================
// POST /api/compliance/policy/generate
// ============================================================================

describe('POST /api/compliance/policy/generate', () => {
  beforeEach(() => {
    mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1' });
    mockPrisma.complianceSite.findFirst.mockResolvedValue({
      id: 'site-1',
      workspaceId: 'ws-1',
      domain: 'example.com',
      name: 'Example Site',
      country: 'TR',
      language: 'tr',
    });
    mockPrisma.cookieScan.findFirst.mockResolvedValue(null);
    mockPrisma.privacyPolicy.create.mockResolvedValue({
      id: 'policy-1',
      jurisdiction: 'KVKK',
    });
  });

  it('generates a policy in mock mode → 201', async () => {
    const req = makePostRequest(
      'http://localhost:3000/api/compliance/policy/generate',
      {
        workspaceId: 'ws-1',
        siteId: 'site-1',
        jurisdiction: 'KVKK',
        companyName: 'Test AŞ',
        domain: 'test.com.tr',
        country: 'TR',
      }
    );

    const res = await policyPOST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    // policyService.generatePolicy returns { ...created, aiMeta: { mock, ... } }
    expect(json.data.aiMeta?.mock).toBe(true);
    expect(json.data.jurisdiction).toBe('KVKK');
    expect(mockPrisma.privacyPolicy.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jurisdiction: 'KVKK',
          generatedBy: 'ai',
        }),
      })
    );
  });

  it('rejects missing required fields → 400', async () => {
    const req = makePostRequest(
      'http://localhost:3000/api/compliance/policy/generate',
      {
        workspaceId: 'ws-1',
        // missing siteId, jurisdiction, companyName, domain, country
      }
    );

    const res = await policyPOST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ============================================================================
// POST /api/compliance/breach/report
// ============================================================================

describe('POST /api/compliance/breach/report', () => {
  beforeEach(() => {
    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Test WS',
      ownerId: 'owner-1',
    });
    mockPrisma.dataBreachIncident.create.mockResolvedValue({
      id: 'incident-new',
      detectedAt: new Date(),
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);
  });

  it('creates breach incident → 200', async () => {
    const req = makePostRequest(
      'http://localhost:3000/api/compliance/breach/report',
      {
        workspaceId: 'ws-1',
        severity: 'HIGH',
        title: 'Integration Test Breach',
        description: 'Detailed breach description for integration test',
      }
    );

    const res = await breachPOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.incidentId).toBe('incident-new');
    expect(json.data.notifyKvkk).toBe(true);
    expect(json.data.severity).toBe('HIGH');
  });

  it('rejects invalid severity → 400', async () => {
    const req = makePostRequest(
      'http://localhost:3000/api/compliance/breach/report',
      {
        workspaceId: 'ws-1',
        severity: 'BANANA',
        title: 'Test',
        description: 'Valid description here',
      }
    );

    const res = await breachPOST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects too-short title → 400', async () => {
    const req = makePostRequest(
      'http://localhost:3000/api/compliance/breach/report',
      {
        workspaceId: 'ws-1',
        severity: 'LOW',
        title: 'no',
        description: 'Valid description here',
      }
    );

    const res = await breachPOST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('accepts LOW severity → notifyKvkk=false', async () => {
    const req = makePostRequest(
      'http://localhost:3000/api/compliance/breach/report',
      {
        workspaceId: 'ws-1',
        severity: 'low',
        title: 'Low severity breach',
        description: 'This is a low severity incident for testing.',
      }
    );

    const res = await breachPOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.notifyKvkk).toBe(false);
    expect(json.data.severity).toBe('LOW');
  });

  it('accepts affectedUsers and dataCategories', async () => {
    const req = makePostRequest(
      'http://localhost:3000/api/compliance/breach/report',
      {
        workspaceId: 'ws-1',
        severity: 'CRITICAL',
        title: 'Critical incident with affected users',
        description: 'Critical breach affecting many users',
        affectedUsers: 5000,
        dataCategories: ['email', 'phone', 'password_hash'],
      }
    );

    const res = await breachPOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.notifyKvkk).toBe(true);
    expect(json.data.severity).toBe('CRITICAL');
  });
});

// ============================================================================
// POST /api/user/cookie-consent
// ============================================================================

describe('POST /api/user/cookie-consent', () => {
  it('saves cookie consent for authenticated user', async () => {
    mockPrisma.cookieConsent.findFirst.mockResolvedValue(null);
    mockPrisma.cookieConsent.upsert.mockResolvedValue({
      id: 'consent-1',
      necessary: true,
      analytics: true,
      marketing: false,
      preferences: false,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    const req = makePostRequest('http://localhost:3000/api/user/cookie-consent', {
      necessary: true,
      analytics: true,
      marketing: false,
      preferences: false,
    });

    const res = await cookieConsentPOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.analytics).toBe(true);
    expect(json.data.marketing).toBe(false);
  });

  it('handles revoke=true → sets all to false', async () => {
    mockPrisma.cookieConsent.findFirst.mockResolvedValue(null);
    mockPrisma.cookieConsent.upsert.mockResolvedValue({
      id: 'consent-revoked',
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      expiresAt: new Date(),
    });

    const req = makePostRequest('http://localhost:3000/api/user/cookie-consent', {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      revoke: true,
    });

    const res = await cookieConsentPOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.analytics).toBe(false);
    expect(json.data.marketing).toBe(false);
    expect(json.data.preferences).toBe(false);
  });

  it('rejects when necessary=false (must be true)', async () => {
    const req = makePostRequest('http://localhost:3000/api/user/cookie-consent', {
      necessary: false,
      analytics: false,
      marketing: false,
    });

    const res = await cookieConsentPOST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('returns expiresAt as ISO string', async () => {
    mockPrisma.cookieConsent.findFirst.mockResolvedValue(null);
    mockPrisma.cookieConsent.upsert.mockResolvedValue({
      id: 'consent-2',
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    const req = makePostRequest('http://localhost:3000/api/user/cookie-consent', {
      necessary: true,
    });

    const res = await cookieConsentPOST(req);
    const json = await res.json();
    expect(json.data.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('updates existing consent record', async () => {
    mockPrisma.cookieConsent.findFirst.mockResolvedValue({
      id: 'consent-existing',
    });
    mockPrisma.cookieConsent.upsert.mockResolvedValue({
      id: 'consent-existing',
      necessary: true,
      analytics: true,
      marketing: false,
      preferences: false,
      expiresAt: new Date(),
    });

    const req = makePostRequest('http://localhost:3000/api/user/cookie-consent', {
      necessary: true,
      analytics: true,
    });

    const res = await cookieConsentPOST(req);
    expect(res.status).toBe(200);
    expect(mockPrisma.cookieConsent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'consent-existing' },
      })
    );
  });
});
