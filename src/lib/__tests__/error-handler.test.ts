/**
 * Error Handler Tests
 *
 * - Prisma / Zod / known-error classification
 * - Production mode MUST NOT leak internal error messages
 * - In development, internal messages are preserved
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AppError, handleApiError, isProduction, logError } from '../error-handler';

/**
 * NODE_ENV, @types/node'da `string | undefined` degil `NodeJS.ProcessEnv`
 * uzerinden readonly olarak tanimlidir. Test ortaminda `Object.assign` ile
 * override ediyoruz.
 */
function setNodeEnv(value: string | undefined) {
  Object.assign(process.env, { NODE_ENV: value });
}

describe('error-handler', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    setNodeEnv(originalEnv);
  });

  describe('AppError', () => {
    it('preserves message and statusCode', () => {
      const err = new AppError('Bilinmeyen hata', 422, 'CUSTOM_CODE');
      expect(err.message).toBe('Bilinmeyen hata');
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe('CUSTOM_CODE');
      expect(err.name).toBe('AppError');
      expect(err).toBeInstanceOf(Error);
    });

    it('defaults statusCode to 500 when omitted', () => {
      const err = new AppError('default');
      expect(err.statusCode).toBe(500);
    });
  });

  describe('handleApiError — known errors', () => {
    it('returns AppError shape', () => {
      const result = handleApiError(new AppError('ozel mesaj', 403, 'FORBIDDEN'));
      expect(result).toEqual({ message: 'ozel mesaj', statusCode: 403 });
    });

    it('maps Prisma unique-constraint to 409 with safe message', () => {
      const result = handleApiError(new Error('Unique constraint failed on the fields: (`email`)'));
      expect(result.statusCode).toBe(409);
      expect(result.message).not.toMatch(/Unique constraint/i);
    });

    it('maps Prisma record-not-found to 404 with safe message', () => {
      const result = handleApiError(new Error('Record to update not found.'));
      expect(result.statusCode).toBe(404);
      expect(result.message).not.toMatch(/Record to update/i);
    });

    it('maps Prisma foreign-key violation to 400 with safe message', () => {
      const result = handleApiError(new Error('Foreign key constraint failed on the field'));
      expect(result.statusCode).toBe(400);
      expect(result.message).not.toMatch(/Foreign key constraint/i);
    });

    it('maps ZodError to 400 with safe message', () => {
      class FakeZodError extends Error {
        constructor() {
          super('Required');
          this.name = 'ZodError';
        }
      }
      const result = handleApiError(new FakeZodError());
      expect(result.statusCode).toBe(400);
      expect(result.message).not.toMatch(/Required/i);
    });
  });

  describe('handleApiError — unknown errors (production safety)', () => {
    it('hides internal Error.message in production', () => {
      setNodeEnv('production');
      const result = handleApiError(new Error('SENSITIVE: db credentials leaked'));
      expect(result.statusCode).toBe(500);
      expect(result.message).not.toMatch(/SENSITIVE/);
      expect(result.message).not.toMatch(/credentials/i);
    });

    it('keeps generic-safe wording in production', () => {
      setNodeEnv('production');
      const result = handleApiError(new Error('db down: P1001'));
      expect(result.message).toBe('Beklenmeyen bir sunucu hatası oluştu.');
    });

    it('still returns safe 500 for non-Error throwables in production', () => {
      setNodeEnv('production');
      const result = handleApiError('string-throw');
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Beklenmeyen bir sunucu hatası oluştu.');
    });
  });

  describe('isProduction / logError', () => {
    it('isProduction reflects NODE_ENV', () => {
      setNodeEnv('production');
      expect(isProduction()).toBe(true);
      setNodeEnv('development');
      expect(isProduction()).toBe(false);
    });

    it('logError writes to console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logError(new Error('boom'), 'CTX');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});