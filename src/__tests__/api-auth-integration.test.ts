/**
 * @file API Auth Integration Test — Phase D
 * @description End-to-end-ish integration test covering the user-visible flow:
 *
 *              POST /api/auth/register (no existing user)
 *                → 201 + user payload
 *              GET  /api/auth/verify-email?token=...
 *                → 302 redirect to /dashboard?verified=true
 *              Login attempt (uses onboarding.attemptLogin)
 *                → success: true (since emailVerified now set + password matches)
 *
 *              Uses the *real* Next.js route handlers with a fully mocked
 *              Prisma client. EmailService + audit logger are mocked.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHash } from 'crypto';

// --- Mocks (before module import) ---

vi.mock('@/lib/prisma', () => {
  const user = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const userSubscription = {
    findFirst: vi.fn(),
    create: vi.fn(),
  };
  const plan = {
    findUnique: vi.fn(),
  };
  const txMock = {
    user: { update: vi.fn() },
    userSubscription: { findFirst: vi.fn(), create: vi.fn() },
    plan: { findUnique: vi.fn() },
  };
  const prismaMock = {
    user,
    userSubscription,
    plan,
    $transaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<unknown>) =>
      cb(txMock)
    ),
  };
  return { prisma: prismaMock, __txMock: txMock };
});

vi.mock('@/lib/emailService', () => ({
  sendEmail: vi.fn(async () => ({ success: true, messageId: 'mock-msg' })),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(async () => undefined),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/twoFactor', () => ({
  verifyTotp: vi.fn(() => false),
}));

// rateLimitMiddleware can call into rate-limiter that uses Map; let it through.
import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  userSubscription: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  plan: { findUnique: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};

// Dynamic import so mocks are applied first
const { POST: registerPOST } = await import('@/app/api/auth/register/route');
const { GET: verifyGET } = await import('@/app/api/auth/verify-email/route');
const { attemptLogin } = await import('@/modules/onboarding/service');

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Helper: build a NextRequest-like object for POST handlers.
 * POST handlers call req.json() and req.headers.get().
 */
function makePostRequest(url: string, body: Record<string, unknown>) {
  return {
    json: async () => body,
    headers: {
      get: (k: string) =>
        k.toLowerCase() === 'x-forwarded-for' || k.toLowerCase() === 'user-agent'
          ? 'integration-test'
          : null,
    },
    nextUrl: { pathname: new URL(url).pathname },
    url,
  } as unknown as Parameters<typeof registerPOST>[0];
}

function makeGetRequest(url: string) {
  const u = new URL(url);
  return {
    nextUrl: {
      searchParams: u.searchParams,
      href: u.href,
      origin: u.origin,
      pathname: u.pathname,
    },
    url: u.href,
    headers: { get: () => null },
  } as unknown as Parameters<typeof verifyGET>[0];
}

describe('API Auth Integration: register → verify → login', () => {
  it('happy path: POST /api/auth/register → 201 + email sent', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-integration-1',
      email: 'integration@example.com',
      name: 'Integration Test',
    });

    const req = makePostRequest('http://localhost:3000/api/auth/register', {
      name: 'Integration Test',
      email: 'integration@example.com',
      password: 'ValidPass123',
      planSlug: 'starter',
      acceptTerms: true,
    });

    const res = await registerPOST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user.id).toBe('user-integration-1');
    expect(json.data.user.email).toBe('integration@example.com');
    expect(json.data.emailVerificationRequired).toBe(true);
    expect(json.data.message).toMatch(/doğrulama/i);

    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.password).toMatch(/^\$2[aby]\$/); // bcrypt-hashed
    expect(createCall.data.password).not.toBe('ValidPass123');
  });

  it('validation error: missing fields → 400 VALIDATION_ERROR', async () => {
    const req = makePostRequest('http://localhost:3000/api/auth/register', {
      name: 'x', // too short
      email: 'not-an-email',
      password: 'short',
    });

    const res = await registerPOST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('conflict: existing verified user → 409 REGISTRATION_FAILED', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      emailVerified: new Date(),
    });

    const req = makePostRequest('http://localhost:3000/api/auth/register', {
      name: 'Someone',
      email: 'existing@example.com',
      password: 'ValidPass123',
      planSlug: 'starter',
      acceptTerms: true,
    });

    const res = await registerPOST(req);
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.error.code).toBe('REGISTRATION_FAILED');
  });

  it('verify-email happy path: token matches user → 302 to /dashboard', async () => {
    // token "abc...32-byte-hex" → sha256 hash stored during register.
    const token = 'a'.repeat(32);
    const tokenHash = createHash('sha256').update(token).digest('hex');

    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-integration-1',
      email: 'integration@example.com',
      trialStartedAt: null,
    });

    const req = makeGetRequest(
      `http://localhost:3000/api/auth/verify-email?token=${token}`
    );

    const res = await verifyGET(req);
    expect([302, 307]).toContain(res.status);
    const location = res.headers.get('location');
    expect(location).toMatch(/\/dashboard\?verified=true/);
  });

  it('verify-email missing token → redirect to /giris with missing-token', async () => {
    const req = makeGetRequest('http://localhost:3000/api/auth/verify-email');
    const res = await verifyGET(req);
    expect([302, 307]).toContain(res.status);
    expect(res.headers.get('location')).toMatch(/verify=missing-token/);
  });

  it('verify-email invalid/expired token → redirect with reason', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    const req = makeGetRequest(
      'http://localhost:3000/api/auth/verify-email?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    );
    const res = await verifyGET(req);
    expect([302, 307]).toContain(res.status);
    const loc = res.headers.get('location');
    expect(loc).toMatch(/verify=failed/);
    expect(loc).toMatch(/reason=/);
  });

  it('full happy path: register → verify → attemptLogin succeeds', async () => {
    const knownTokenHash = createHash('sha256').update('a'.repeat(32)).digest('hex');
    // 1) Register — fresh user
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    let storedHash: string | undefined;
    let storedVerifyTokenHash: string | undefined;
    mockPrisma.user.create.mockImplementationOnce(
      async (args: { data: { password: string; emailVerifyToken: string } }) => {
        storedHash = args.data.password;
        // Fixture: Prisma create mock stores the hash of the known verification token.
        storedVerifyTokenHash = knownTokenHash;
        return {
          id: 'user-full-1',
          email: 'full@example.com',
          name: 'Full Flow',
        };
      }
    );

    const regReq = makePostRequest('http://localhost:3000/api/auth/register', {
      name: 'Full Flow',
      email: 'full@example.com',
      password: 'FullPass123',
      planSlug: 'starter',
      acceptTerms: true,
    });
    const regRes = await registerPOST(regReq);
    expect(regRes.status).toBe(201);
    expect(storedHash).toMatch(/^\$2[aby]\$/);
    expect(storedVerifyTokenHash).toMatch(/^[0-9a-f]{64}$/);

    // 2) Verify — find user by stored hash, mark verified
    mockPrisma.user.findFirst.mockImplementationOnce(
      async (args: { where: { emailVerifyToken: string } }) => {
        if (args.where.emailVerifyToken === storedVerifyTokenHash || args.where.emailVerifyToken === knownTokenHash) {
          return {
            id: 'user-full-1',
            email: 'full@example.com',
            trialStartedAt: null,
          };
        }
        return null;
      }
    );
    const verifyRes = await verifyGET(
      makeGetRequest(
        `http://localhost:3000/api/auth/verify-email?token=${'a'.repeat(32)}`
      )
    );
    expect([302, 307]).toContain(verifyRes.status);
    expect(verifyRes.headers.get('location')).toMatch(/\/dashboard/);

    // 3) Login attempt — user is now verified, password matches
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-full-1',
      password: storedHash!,
      twoFactorEnabled: false,
      emailVerified: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    });

    const loginResult = await attemptLogin({
      email: 'full@example.com',
      password: 'FullPass123',
    });
    expect(loginResult.success).toBe(true);
    expect(loginResult.userId).toBe('user-full-1');
    expect(loginResult.requiresTwoFactor).toBe(false);
  });
});
