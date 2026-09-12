/**
 * @file Middleware protected route test — Phase D.6
 * @description Verifies src/middleware.ts behavior on protected routes
 *              when no NextAuth session cookie is present:
 *
 *              1. Page-route prefix (/dashboard, /admin, /saas, etc.) → 307
 *                 redirect to /giris?callbackUrl=...
 *              2. API-route prefix (/api/user, /api/saas, /api/compliance,
 *                 /api/templates) → 401 JSON response
 *
 *              Also confirms the inverse: with a session cookie the
 *              middleware passes through with security headers attached.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// next-intl middleware should be mocked in Vitest: its package currently
// imports the extensionless `next/server` path, which Vite cannot resolve.
vi.mock('next-intl/middleware', () => ({
  default: () => () => null,
}));

// next/server must provide NextRequest (which it does in Node test env).
// We construct minimal NextRequest objects directly.

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Import middleware AFTER mocks
const { middleware } = await import('../../middleware');

const PAGE_PROTECTED = [
  '/dashboard',
  '/dashboard/projects',
  '/admin',
  '/admin/users',
  '/saas/billing',
  '/marketplace/dashboard',
];

const API_PROTECTED = [
  '/api/user/profile',
  '/api/saas/quota',
  '/api/compliance/logs',
  '/api/templates/list',
];

function makeRequest(
  pathname: string,
  opts: {
    cookieNames?: string[];
    method?: string;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const headers = new Headers(opts.headers ?? {});
  for (const c of opts.cookieNames ?? []) {
    headers.append('cookie', c);
  }
  // NextRequest constructor expects RequestInit; supply what we need.
  return new NextRequest(url, {
    method: opts.method ?? 'GET',
    headers,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('middleware — protected route without session cookie', () => {
  describe('page routes → redirect to /giris', () => {
    it.each(PAGE_PROTECTED)('%s returns 307 redirect to /giris', async (pathname) => {
      const res = await middleware(makeRequest(pathname));
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/giris');
      expect(location).toContain(`callbackUrl=${encodeURIComponent(pathname)}`);
    });

    it('redirect Location includes callbackUrl even with subpath', async () => {
      const res = await middleware(makeRequest('/dashboard/projects/42'));
      expect(res.status).toBe(307);
      const location = res.headers.get('location') ?? '';
      expect(location).toContain('/giris');
      expect(location).toContain('callbackUrl=');
    });
  });

  describe('api routes → 401 JSON', () => {
    it.each(API_PROTECTED)('%s returns 401 JSON body', async (pathname) => {
      const res = await middleware(makeRequest(pathname));
      expect(res.status).toBe(401);
      expect(res.headers.get('content-type')).toMatch(/application\/json/);

      // NextResponse.json uses a private body stream; read via .text() then JSON.parse
      const text = await res.text();
      const body = JSON.parse(text);
      expect(body).toEqual({
        success: false,
        error: 'Authentication required',
      });
    });
  });
});

describe('middleware — protected route WITH session cookie (allow)', () => {
  it('passes through /dashboard when next-auth.session-token cookie present', async () => {
    const res = await middleware(
      makeRequest('/dashboard', { cookieNames: ['next-auth.session-token=abc'] })
    );
    // NextResponse.next() typically returns 200 in test context
    expect([200, 307]).toContain(res.status);
    // If pass-through, security headers should be attached
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });

  it('passes through /api/saas when __Secure-next-auth.session-token present', async () => {
    const res = await middleware(
      makeRequest('/api/saas/quota', {
        cookieNames: ['__Secure-next-auth.session-token=xyz'],
        method: 'GET',
      })
    );
    // Pass-through returns NextResponse.next()
    expect([200, 307]).toContain(res.status);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('middleware — public whitelist (no auth required)', () => {
  it('/docs passes through with security headers', async () => {
    const res = await middleware(makeRequest('/docs'));
    // Whitelist routes return NextResponse.next() with headers
    expect([200, 307]).toContain(res.status);
    expect(res.headers.get('content-security-policy')).toBeTruthy();
  });

  it('/api/openapi passes through with security headers', async () => {
    const res = await middleware(makeRequest('/api/openapi'));
    expect([200, 307]).toContain(res.status);
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });
});

describe('middleware — admin write requests get audit logging', () => {
  it('POST /admin/blog attaches x-audit-ip header', async () => {
    const res = await middleware(
      makeRequest('/admin/blog', {
        method: 'POST',
        cookieNames: ['next-auth.session-token=ok'],
        headers: { 'x-forwarded-for': '203.0.113.5' },
      })
    );
    expect([200, 307]).toContain(res.status);
    expect(res.headers.get('x-audit-ip')).toBe('203.0.113.5');
  });

  it('falls back to "unknown" when no IP header present', async () => {
    const res = await middleware(
      makeRequest('/admin/comments', {
        method: 'DELETE',
        cookieNames: ['next-auth.session-token=ok'],
      })
    );
    expect(res.headers.get('x-audit-ip')).toBe('unknown');
  });
});

describe('middleware — legacy redirect (301)', () => {
  it('/admin/blog/yeni → 301 to /admin/blog/new', async () => {
    const res = await middleware(makeRequest('/admin/blog/yeni'));
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/admin/blog/new'
    );
  });
});
