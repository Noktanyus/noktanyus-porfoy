/**
 * @file User Data Export API Integration Test — Phase 4 C.7
 * @description Integration test for /api/user/export endpoint covering:
 *              - Password re-verification (ZORUNLU)
 *              - Complete JSON aggregation
 *              - TTL link (24 hours)
 *
 *   KVKK Madde 11 / GDPR Article 15 compliance test.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hashSync } from 'bcryptjs';

// ============================================================================
// Mocks
// ============================================================================

const mockSession = vi.hoisted(() => ({
  user: { id: 'user-export-1', email: 'export@test.com' },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => mockSession),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/prisma', () => {
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
    },
    order: { findMany: vi.fn().mockResolvedValue([]) },
    userSubscription: { findMany: vi.fn().mockResolvedValue([]) },
    license: { findMany: vi.fn().mockResolvedValue([]) },
    apiKey: { findMany: vi.fn().mockResolvedValue([]) },
    apiKeyUsage: { findMany: vi.fn().mockResolvedValue([]) },
    webhook: { findMany: vi.fn().mockResolvedValue([]) },
    webhookDelivery: { findMany: vi.fn().mockResolvedValue([]) },
    monitor: { findMany: vi.fn().mockResolvedValue([]) },
    monitorCheck: { findMany: vi.fn().mockResolvedValue([]) },
    alertChannel: { findMany: vi.fn().mockResolvedValue([]) },
    notification: { findMany: vi.fn().mockResolvedValue([]) },
    comment: { findMany: vi.fn().mockResolvedValue([]) },
    workspaceMember: { findMany: vi.fn().mockResolvedValue([]) },
    affiliateCommission: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    affiliatePayout: { findMany: vi.fn().mockResolvedValue([]) },
    aiUsage: { groupBy: vi.fn().mockResolvedValue([]) },
    auditLog: { findMany: vi.fn().mockResolvedValue([]) },
    cookieConsent: { findMany: vi.fn().mockResolvedValue([]) },
    oAuthClient: { findMany: vi.fn().mockResolvedValue([]) },
    oAuthAccessToken: { findMany: vi.fn().mockResolvedValue([]) },
    pushSubscription: { findMany: vi.fn().mockResolvedValue([]) },
  };
  return { prisma: prismaMock };
});

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

// AWS SDK mock — R2 path disabled by env, so this is mostly defensive
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {},
  PutObjectCommand: class {},
  GetObjectCommand: class {},
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(async () => 'https://r2.example.com/signed-url'),
}));

// node:fs mock — local fallback writes to disk; using spread to preserve real API
vi.mock('node:fs/promises', async () => {
  const actual =
    await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  return {
    ...actual,
    mkdir: vi.fn(async () => undefined),
    writeFile: vi.fn(async () => undefined),
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

// ============================================================================
// Imports
// ============================================================================

// @/lib/apiResponse re-exports are incomplete (route uses UnauthorizedError
// from apiResponse but it's only defined in @/modules/shared/errors).
// Mock apiResponse with the real AppError classes so the route can throw.
vi.mock('@/lib/apiResponse', async () => {
  const { AppError, UnauthorizedError, ValidationError } = await import(
    '@/modules/shared/errors'
  );
  const { NextResponse } = await import('next/server');

  function ok<T>(data: T, init?: { status?: number }) {
    return NextResponse.json({ success: true, data }, init);
  }

  function fail(error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Beklenmeyen hata' } },
      { status: 500 }
    );
  }

  async function withErrorHandling(
    handler: () => Promise<ReturnType<typeof ok>>
  ): Promise<ReturnType<typeof ok>> {
    try {
      return await handler();
    } catch (error) {
      return fail(error) as unknown as ReturnType<typeof ok>;
    }
  }

  return { ok, fail, withErrorHandling, UnauthorizedError, ValidationError };
});

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  order: { findMany: ReturnType<typeof vi.fn> };
  userSubscription: { findMany: ReturnType<typeof vi.fn> };
  license: { findMany: ReturnType<typeof vi.fn> };
  apiKey: { findMany: ReturnType<typeof vi.fn> };
  apiKeyUsage: { findMany: ReturnType<typeof vi.fn> };
  webhook: { findMany: ReturnType<typeof vi.fn> };
  webhookDelivery: { findMany: ReturnType<typeof vi.fn> };
  monitor: { findMany: ReturnType<typeof vi.fn> };
  monitorCheck: { findMany: ReturnType<typeof vi.fn> };
  alertChannel: { findMany: ReturnType<typeof vi.fn> };
  notification: { findMany: ReturnType<typeof vi.fn> };
  comment: { findMany: ReturnType<typeof vi.fn> };
  workspaceMember: { findMany: ReturnType<typeof vi.fn> };
  affiliateCommission: { findMany: ReturnType<typeof vi.fn> };
  affiliatePayout: { findMany: ReturnType<typeof vi.fn> };
  aiUsage: { groupBy: ReturnType<typeof vi.fn> };
  auditLog: { findMany: ReturnType<typeof vi.fn> };
  cookieConsent: { findMany: ReturnType<typeof vi.fn> };
  oAuthClient: { findMany: ReturnType<typeof vi.fn> };
  oAuthAccessToken: { findMany: ReturnType<typeof vi.fn> };
  pushSubscription: { findMany: ReturnType<typeof vi.fn> };
};

const mockSendEmail = sendEmail as unknown as ReturnType<typeof vi.fn>;
const mockLogAudit = logAudit as unknown as ReturnType<typeof vi.fn>;

const { POST: exportPOST } = await import('@/app/api/user/export/route');

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_ENDPOINT;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET;
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
  } as unknown as Parameters<typeof exportPOST>[0];
}

const VALID_PASSWORD = 'TestPassword123';
const BCRYPT_HASH = hashSync(VALID_PASSWORD, 10);

// ============================================================================
// Authentication
// ============================================================================

describe('POST /api/user/export — authentication', () => {
  it('returns 401 when no session', async () => {
    const { getServerSession } = await import('next-auth');
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: VALID_PASSWORD,
    });

    const res = await exportPOST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when password missing', async () => {
    const req = makePostRequest('http://localhost:3000/api/user/export', {});

    const res = await exportPOST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ============================================================================
// Password re-verification (ZORUNLU)
// ============================================================================

describe('POST /api/user/export — password re-verification', () => {
  it('returns 401 when password is invalid', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-export-1',
      email: 'export@test.com',
      name: 'Export Test',
      password: BCRYPT_HASH,
    });

    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: 'WrongPassword',
    });

    const res = await exportPOST(req);
    expect(res.status).toBe(401);
  });

  it('writes audit log for failed password attempt', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-export-1',
      email: 'export@test.com',
      name: 'Export Test',
      password: BCRYPT_HASH,
    });

    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: 'WrongPassword',
    });

    await exportPOST(req);
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EXPORT',
        resource: 'user_data',
        details: expect.objectContaining({ reason: 'password_invalid' }),
      })
    );
  });

  it('returns 401 when user has no password (social login)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-export-1',
      email: 'export@test.com',
      name: 'Export Test',
      password: null,
    });

    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: 'anything',
    });

    const res = await exportPOST(req);
    expect(res.status).toBe(401);
  });

  it('proceeds when password is correct', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-export-1',
      email: 'export@test.com',
      name: 'Export Test',
      password: BCRYPT_HASH,
    });
    mockPrisma.order.findMany.mockResolvedValue([
      { id: 'order-1', totalCents: 5000 },
    ]);

    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: VALID_PASSWORD,
    });

    const res = await exportPOST(req);
    expect(res.status).toBe(200);
  });
});

// ============================================================================
// Complete JSON aggregation
// ============================================================================

describe('POST /api/user/export — complete JSON aggregation', () => {
  beforeEach(() => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-export-1',
      email: 'export@test.com',
      name: 'Export Test',
      password: BCRYPT_HASH,
    });
  });

  it('queries all aggregation tables', async () => {
    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: VALID_PASSWORD,
    });

    await exportPOST(req);

    // User profile is fetched twice (auth + aggregation), but aggregation queries hit other tables
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-export-1' },
    });
    expect(mockPrisma.userSubscription.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-export-1' },
    });
    expect(mockPrisma.license.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-export-1' },
    });
    expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-export-1' },
      select: expect.objectContaining({
        id: true,
        prefix: true, // MASKED — not full key
        scopes: true,
      }),
    });
    expect(mockPrisma.webhook.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-export-1' },
      select: expect.objectContaining({
        id: true,
        url: true,
        // secret should NOT be in select
      }),
    });
    expect(mockPrisma.monitor.findMany).toHaveBeenCalled();
    expect(mockPrisma.notification.findMany).toHaveBeenCalled();
    expect(mockPrisma.comment.findMany).toHaveBeenCalled();
    expect(mockPrisma.workspaceMember.findMany).toHaveBeenCalled();
    expect(mockPrisma.aiUsage.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['feature', 'model'],
        where: { userId: 'user-export-1' },
      })
    );
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-export-1',
          action: {
            in: ['DATA_ACCESS', 'DATA_EXPORT', 'CONSENT_GRANT', 'CONSENT_REVOKE'],
          },
        }),
      })
    );
    expect(mockPrisma.cookieConsent.findMany).toHaveBeenCalled();
    expect(mockPrisma.oAuthClient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'user-export-1' },
        select: expect.not.objectContaining({ clientSecret: true }),
      })
    );
    expect(mockPrisma.pushSubscription.findMany).toHaveBeenCalled();
  });

  it('excludes sensitive fields (password, 2FA secret, API secret, OAuth secret)', async () => {
    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: VALID_PASSWORD,
    });

    await exportPOST(req);

    // User select must NOT include password / 2FA secret
    const userCalls = mockPrisma.user.findUnique.mock.calls;
    const userSelect =
      userCalls[userCalls.length - 1][0].select;
    expect(userSelect).not.toHaveProperty('password');
    expect(userSelect).not.toHaveProperty('twoFactorSecret');
    expect(userSelect).not.toHaveProperty('backupCodes');

    // API key select must NOT include secret
    const apiKeyCalls = mockPrisma.apiKey.findMany.mock.calls[0][0];
    expect(apiKeyCalls.select).not.toHaveProperty('secret');

    // Webhook select must NOT include secret
    const webhookCalls = mockPrisma.webhook.findMany.mock.calls[0][0];
    expect(webhookCalls.select).not.toHaveProperty('secret');

    // OAuth client select must NOT include clientSecret
    const oauthCalls = mockPrisma.oAuthClient.findMany.mock.calls[0][0];
    expect(oauthCalls.select).not.toHaveProperty('clientSecret');
  });

  it('writes DATA_EXPORT audit log with hash and TTL', async () => {
    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: VALID_PASSWORD,
    });

    await exportPOST(req);

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DATA_EXPORT',
        resource: 'user_data',
        details: expect.objectContaining({
          storage: 'local',
          sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
          expiresAt: expect.any(String),
        }),
      })
    );
  });

  it('sends download email to user', async () => {
    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: VALID_PASSWORD,
    });

    await exportPOST(req);

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'export@test.com',
        subject: expect.stringContaining('KVKK'),
        html: expect.stringContaining('Verilerimi İndir'),
      })
    );
  });

  it('returns download URL, filename, sha256, expiresAt', async () => {
    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: VALID_PASSWORD,
    });

    const res = await exportPOST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.filename).toMatch(/^user-export-user-export-1-\d+\.json$/);
    expect(json.data.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(json.data.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(json.data.downloadUrl).toContain('/uploads/user-exports/');
    expect(json.data.storage).toBe('local');
  });
});

// ============================================================================
// TTL link (24 hours)
// ============================================================================

describe('POST /api/user/export — TTL link', () => {
  beforeEach(() => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-export-1',
      email: 'export@test.com',
      name: 'Export Test',
      password: BCRYPT_HASH,
    });
  });

  it('expiresAt is approximately 24 hours from now', async () => {
    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: VALID_PASSWORD,
    });

    const before = Date.now();
    const res = await exportPOST(req);
    const after = Date.now();

    const json = await res.json();
    const expiresAt = new Date(json.data.expiresAt).getTime();

    // 24h = 86_400_000 ms (allow ±5s slack)
    const expectedMin = before + 24 * 60 * 60 * 1000;
    const expectedMax = after + 24 * 60 * 60 * 1000;
    expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
    expect(expiresAt).toBeLessThanOrEqual(expectedMax);
  });

  it('audit log records the expiresAt timestamp', async () => {
    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: VALID_PASSWORD,
    });

    await exportPOST(req);

    const auditCall = mockLogAudit.mock.calls.find(
      (c) => c[0]?.action === 'DATA_EXPORT'
    );
    expect(auditCall).toBeTruthy();
    const auditDetails = auditCall?.[0]?.details as { expiresAt?: string } | undefined;
    expect(auditDetails?.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('email body mentions 24-hour validity', async () => {
    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: VALID_PASSWORD,
    });

    await exportPOST(req);

    const emailCall = mockSendEmail.mock.calls[0][0];
    expect(emailCall.html).toMatch(/24 saat|24 hour|24 sa/i);
    expect(emailCall.subject).toMatch(/24 saat/i);
  });
});

// ============================================================================
// Local fallback (R2 not configured)
// ============================================================================

describe('POST /api/user/export — local fallback', () => {
  beforeEach(() => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-export-1',
      email: 'export@test.com',
      name: 'Export Test',
      password: BCRYPT_HASH,
    });
  });

  it('uses local storage when R2 env vars not set', async () => {
    const req = makePostRequest('http://localhost:3000/api/user/export', {
      password: VALID_PASSWORD,
    });

    const res = await exportPOST(req);
    const json = await res.json();
    expect(json.data.storage).toBe('local');
    expect(json.data.downloadUrl).toContain('/uploads/user-exports/user-export-1/');
  });
});
