/**
 * @file /api/auth/forgot-password - Şifre sıfırlama linki talep et
 * @description POST { email } → 1 saatlik token üretir, Resend email ile link gönderir.
 *              Her zaman { sent: true } döner (email enumeration koruması).
 */

import { NextRequest } from 'next/server';
import { withErrorHandling, ok, fail } from '@/lib/apiResponse';
import { ValidationError } from '@/modules/shared/errors';
import { ForgotPasswordSchema } from '@/modules/onboarding/schemas';
import { requestPasswordReset } from '@/modules/onboarding/service';
import { withRateLimit, RateLimits } from '@/lib/rateLimitMiddleware';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return fail(new ValidationError('Geçerli bir e-posta adresi girin'));
    }

    const result = await requestPasswordReset(parsed.data);
    return ok(result);
  });
}

export const POST = withRateLimit(RateLimits.auth, handler);