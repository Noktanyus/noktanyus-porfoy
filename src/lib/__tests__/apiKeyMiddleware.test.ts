/**
 * apiKeyMiddleware Tests
 *
 * Validates:
 *   - hasScope() admin shortcut
 *   - withApiKey rate-limit bucket identity uses the *validated* keyId,
 *     not the raw apiKey substring (so a single identity isn't shared
 *     across key rotations).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse, type NextRequest } from 'next/server';
import { withApiKey, hasScope, type ApiKeyContext } from '../apiKeyMiddleware';

const validateKeyMock = vi.fn();
const rateLimiterCheckMock = vi.fn();
const trackUsageMock = vi.fn((..._args: unknown[]) => Promise.resolve(undefined));

vi.mock('@/modules/api-keys/service', () => ({
  apiKeyService: {
    validateKey: (key: string) => validateKeyMock(key),
    trackUsage: ((...args: unknown[]) => trackUsageMock(...args)) as any,
  },
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimiter: {
    check: ((...args: unknown[]) => rateLimiterCheckMock(...args)) as any,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

type Handler = (req: NextRequest, ctx: ApiKeyContext) => Promise<NextResponse>;

function makeReq(authHeader: string | null) {
  const headers = new Map<string, string>();
  if (authHeader) headers.set('authorization', authHeader);
  return {
    headers: {
      get(name: string) {
        const found = [...headers.entries()].find(([k]) => k.toLowerCase() === name.toLowerCase());
        return found ? found[1] : null;
      },
    },
    method: 'GET',
    nextUrl: { pathname: '/api/saas/test' },
  } as unknown as NextRequest;
}

describe('apiKeyMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimiterCheckMock.mockReturnValue({ allowed: true, remaining: 10, resetIn: 0 });
    trackUsageMock.mockResolvedValue(undefined);
  });

  describe('hasScope', () => {
    it('admin shortcut', () => {
      expect(hasScope(['admin'], 'read:monitor')).toBe(true);
      expect(hasScope(['admin'], 'whatever')).toBe(true);
    });

    it('exact match', () => {
      expect(hasScope(['read:monitor'], 'read:monitor')).toBe(true);
    });

    it('mismatch false', () => {
      expect(hasScope(['read:monitor'], 'write:monitor')).toBe(false);
      expect(hasScope([], 'read:monitor')).toBe(false);
    });
  });

  describe('withApiKey — bucket identity', () => {
    it('uses validation.keyId (not the raw apiKey) for the rate-limit bucket', async () => {
      validateKeyMock.mockResolvedValue({
        userId: 'u1',
        keyId: 'k_stable_42',
        scopes: ['read:monitor'],
        rateLimit: 60,
      });

      const handler: Handler = vi.fn(async () =>
        NextResponse.json({ ok: true }, { status: 200 })
      ) as unknown as Handler;
      const wrapped = withApiKey(handler);

      await wrapped(makeReq('Bearer nokt_test_aabbccdd_random'));

      expect(rateLimiterCheckMock).toHaveBeenCalledTimes(1);
      const bucketKey = rateLimiterCheckMock.mock.calls[0][0] as string;
      expect(bucketKey).toBe('k_stable_42');
      // Raw apiKey substring must NOT be in the bucket key
      expect(bucketKey).not.toMatch(/nokt_test_aabbccdd/);
    });

    it('returns 401 INVALID_KEY when validation fails', async () => {
      validateKeyMock.mockResolvedValue(null);

      const handler: Handler = vi.fn(async () =>
        NextResponse.json({ ok: true })
      ) as unknown as Handler;
      const wrapped = withApiKey(handler);

      const res = await wrapped(makeReq('Bearer nokt_test_xx'));
      expect(res.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
      expect(rateLimiterCheckMock).not.toHaveBeenCalled();
    });

    it('returns 429 with Retry-After header when rate limited', async () => {
      validateKeyMock.mockResolvedValue({
        userId: 'u1',
        keyId: 'k_rl_1',
        scopes: ['read:monitor'],
        rateLimit: 60,
      });
      rateLimiterCheckMock.mockReturnValue({ allowed: false, remaining: 0, resetIn: 12 });

      const handler: Handler = vi.fn(async () =>
        NextResponse.json({ ok: true })
      ) as unknown as Handler;
      const wrapped = withApiKey(handler);

      const res = await wrapped(makeReq('Bearer nokt_test_xx'));
      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('12');
    });

    it('attaches X-RateLimit-* headers to the response', async () => {
      validateKeyMock.mockResolvedValue({
        userId: 'u1',
        keyId: 'k_hdr_1',
        scopes: ['read:monitor'],
        rateLimit: 100,
      });
      rateLimiterCheckMock.mockReturnValue({ allowed: true, remaining: 50, resetIn: 0 });

      const handler: Handler = vi.fn(
        async () =>
          NextResponse.json({ ok: true }, {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
      ) as unknown as Handler;
      const wrapped = withApiKey(handler);

      const res = await wrapped(makeReq('Bearer nokt_test_xx'));
      expect(res.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('50');
    });

    it('tracks usage after handler completes with response status', async () => {
      validateKeyMock.mockResolvedValue({
        userId: 'u1',
        keyId: 'k_track_1',
        scopes: ['read:monitor'],
        rateLimit: 60,
      });

      const handler: Handler = vi.fn(async () =>
        NextResponse.json({ ok: true }, { status: 201 })
      ) as unknown as Handler;
      const wrapped = withApiKey(handler);

      await wrapped(makeReq('Bearer nokt_test_xx'));
      // wait microtask queue
      await new Promise((r) => setTimeout(r, 0));

      expect(trackUsageMock).toHaveBeenCalledWith(
        'k_track_1',
        expect.objectContaining({ statusCode: 201, endpoint: '/api/saas/test' })
      );
    });
  });
});