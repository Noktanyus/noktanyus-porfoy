/**
 * apiResponse tests
 *
 * withErrorHandling generic signature must preserve the route handler's
 * success data type so callers don't need explicit casts. The previous
 * implementation typed the handler parameter too narrowly which broke
 * many /api routes at the call site. These tests guard against
 * regressions on the overload.
 */

import { describe, it, expect, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { ok, fail, withErrorHandling } from '../apiResponse';
import { NotFoundError } from '@/modules/shared/errors';

describe('apiResponse.withErrorHandling', () => {
  it('returns success response from handler untouched', async () => {
    const result = await withErrorHandling<{ id: string }>(async () =>
      ok({ id: 'abc' })
    );
    expect(result).toBeInstanceOf(NextResponse);
    const body = await result.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 'abc' });
  });

  it('catches thrown errors and returns fail envelope', async () => {
    const result = await withErrorHandling<{ id: string }>(async () => {
      throw new Error('boom');
    });
    expect(result).toBeInstanceOf(NextResponse);
    const body = await result.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('translates AppError throws into fail() envelopes', async () => {
    const result = await withErrorHandling(async () => {
      throw new NotFoundError('Widget');
    });
    expect(result).toBeInstanceOf(NextResponse);
    expect(result.status).toBe(404);
    const body = await result.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('Widget');
  });

  it('handles thrown unknown errors with INTERNAL_ERROR envelope', async () => {
    const result = await withErrorHandling(async () => {
      throw Object.assign(new Error('forbidden'), {
        code: 'FORBIDDEN',
        statusCode: 403,
        details: null,
      });
    });
    // AppError instanceof check will be false (we used plain Error),
    // so the fallback INTERNAL_ERROR path should run.
    const body = await result.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('apiResponse.ok', () => {
  it('wraps data in success envelope', async () => {
    const res = ok({ x: 1 });
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { x: 1 } });
  });
});
