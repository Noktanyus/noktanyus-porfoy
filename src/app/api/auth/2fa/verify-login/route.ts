/**
 * @file /api/auth/2fa/verify-login - 2FA login doğrulama endpoint'i
 * @description D.5 — password auth sonrasında partial session varsa 2FA kodu
 *              burada doğrulanır, başarılıysa tam session oluşturulur.
 *              Body: { userId, code?, backupCode? }
 */

import { NextRequest } from 'next/server';
import { withErrorHandling, ok, fail } from '@/lib/apiResponse';
import { ValidationError, AppError, UnauthorizedError } from '@/modules/shared/errors';
import { TwoFactorLoginSchema } from '@/modules/onboarding/schemas';
import { verifyLoginTwoFactor } from '@/modules/onboarding/service';
import { withRateLimit, RateLimits } from '@/lib/rateLimitMiddleware';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json().catch(() => ({}));
    const userId = typeof body?.userId === 'string' ? body.userId : null;
    if (!userId) {
      throw new UnauthorizedError('Önce e-posta ve şifre ile giriş yapmalısınız');
    }

    const parsed = TwoFactorLoginSchema.safeParse({
      code: typeof body?.code === 'string' ? body.code : '',
      backupCode: typeof body?.backupCode === 'string' ? body.backupCode : undefined,
    });
    if (!parsed.success) {
      return fail(new ValidationError('6 haneli 2FA kodu veya yedek kod girin'));
    }

    try {
      const result = await verifyLoginTwoFactor(userId, parsed.data);
      if (!result.success) {
        return fail(new UnauthorizedError(result.reason ?? '2FA doğrulama başarısız'));
      }
      return ok({ success: true });
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : error instanceof Error
          ? error.message
          : '2FA doğrulama hatası';
      return fail(new UnauthorizedError(message));
    }
  });
}

export const POST = withRateLimit(RateLimits.auth, handler);