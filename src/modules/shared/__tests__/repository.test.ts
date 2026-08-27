import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
} from '../errors';

describe('Shared Errors', () => {
  it('AppError default değerleri', () => {
    const err = new AppError('test');
    expect(err.message).toBe('test');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.name).toBe('AppError');
  });

  it('AppError özel değerler', () => {
    const err = new AppError('custom', 418, 'TEAPOT', { foo: 'bar' });
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('TEAPOT');
    expect(err.details).toEqual({ foo: 'bar' });
  });

  it('NotFoundError 404 döner', () => {
    const err = new NotFoundError('Blog');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Blog bulunamadı');
    expect(err.name).toBe('NotFoundError');
  });

  it('ValidationError 400 döner', () => {
    const err = new ValidationError('Geçersiz', { field: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual({ field: 'email' });
  });

  it('UnauthorizedError 401 döner', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('ForbiddenError 403 döner', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('ConflictError 409 döner', () => {
    const err = new ConflictError('Duplicate');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('RateLimitError 429 döner', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMITED');
  });

  it('Hatalar instanceof AppError kontrolü', () => {
    const err = new NotFoundError();
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});