/**
 * Standart API yanıt formatı.
 *
 * Tüm API rotaları `ok()` / `created()` / `fail()` yardımcılarını kullanarak
 * tutarlı JSON formatında yanıt döner. withErrorHandling() sarmalayıcısı
 * beklenmeyen hataları yakalar ve 500 ile döner.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './errors';
import { logger } from './logger';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { total?: number; page?: number; limit?: number };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return ok(data, { status: 201 });
}

export function fail(error: unknown): NextResponse<ApiError> {
  // AppError - structured
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validasyon hatası',
          details: error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  // Prisma known errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: unknown };
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Bu kayıt zaten mevcut',
            details: prismaError.meta,
          },
        },
        { status: 409 }
      );
    }
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Kayıt bulunamadı',
          },
        },
        { status: 404 }
      );
    }
  }

  // Unknown error
  logger.error('Unhandled API error', { error });
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Beklenmeyen bir hata oluştu',
      },
    },
    { status: 500 }
  );
}

// Generic overload — preserves route handler return type info.
// Without it, callers using `withErrorHandling<T>(...)` would not type-check.
// Accepts union because handlers commonly call both `ok()` and `fail()`.
export async function withErrorHandling<T = unknown>(
  handler: () => Promise<NextResponse<ApiSuccess<T>> | NextResponse<ApiError>>
): Promise<NextResponse<ApiSuccess<T>> | NextResponse<ApiError>>;
export async function withErrorHandling(
  handler: () => Promise<NextResponse<unknown>>
): Promise<NextResponse<unknown>>;
export async function withErrorHandling(
  handler: () => Promise<NextResponse<unknown>>
): Promise<NextResponse<unknown>> {
  try {
    return await handler();
  } catch (error) {
    return fail(error);
  }
}