/**
 * Register Route — Reserved Email From Validated Env
 *
 * Verifies that the register endpoint rejects the ADMIN_EMAIL (compared
 * case-insensitively) when the email is reserved. The route should
 * source ADMIN_EMAIL from the validated `env` object, NOT raw process.env
 * (so tests/mocks can override it without mutating globals).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => {
  const user = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  return { prisma: { user } };
});

vi.mock('@/lib/emailService', () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(async () => undefined),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { POST: registerPOST } = await import('@/app/api/auth/register/route');

const mockPrisma = (await import('@/lib/prisma')).prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
};

function makeReq(body: Record<string, unknown>) {
  return {
    json: async () => body,
    headers: {
      get: () => null,
    },
    nextUrl: { pathname: '/api/auth/register' },
    url: 'http://localhost:3000/api/auth/register',
  } as unknown as Parameters<typeof registerPOST>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/register — reserved ADMIN_EMAIL handling', () => {
  it('rejects the admin email with RESERVED_EMAIL (400)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = makeReq({
      name: 'Imposter',
      email: 'admin@example.com', // vitest.setup.ts default ADMIN_EMAIL
      password: 'StrongPass123',
      planSlug: 'starter',
      acceptTerms: true,
    });

    const res = await registerPOST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.code).toBe('RESERVED_EMAIL');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });
});