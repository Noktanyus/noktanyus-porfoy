/**
 * @file /api/auth/reset-password - Yeni şifre belirle (token ile)
 * @description POST { token, password } → token doğrular, şifreyi günceller,
 *              failedLoginCount'u sıfırlar (lockout temizler).
 */

import { NextRequest } from 'next/server';
import { withErrorHandling, ok, fail } from '@/lib/apiResponse';
import { ValidationError, AppError } from '@/modules/shared/errors';
import { ResetPasswordSchema } from '@/modules/onboarding/schemas';
import { resetPassword } from '@/modules/onboarding/service';
import { withRateLimit, RateLimits } from '@/lib/rateLimitMiddleware';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return fail(new ValidationError('Şifre en az 8 karakter, 1 harf ve 1 rakam içermeli'));
    }

    try {
      const result = await resetPassword(parsed.data);
      return ok(result);
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Şifre sıfırlama başarısız';
      return fail(new ValidationError(message));
    }
  });
}

export const POST = withRateLimit(RateLimits.auth, handler);