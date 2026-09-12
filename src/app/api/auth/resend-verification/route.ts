/**
 * @file /api/auth/resend-verification - Email doğrulama linkini tekrar gönder
 * @description POST { email } → yeni 24 saatlik token üretir ve email gönderir.
 *              Her zaman { sent: true } döner (email enumeration koruması).
 */

import { NextRequest } from 'next/server';
import { withErrorHandling, ok, fail } from '@/lib/apiResponse';
import { ValidationError } from '@/modules/shared/errors';
import { ResendVerificationSchema } from '@/modules/onboarding/schemas';
import { resendVerification } from '@/modules/onboarding/service';
import { withRateLimit, RateLimits } from '@/lib/rateLimitMiddleware';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = ResendVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return fail(new ValidationError('Geçerli bir e-posta adresi girin'));
    }

    const result = await resendVerification(parsed.data);
    return ok(result);
  });
}

export const POST = withRateLimit(RateLimits.auth, handler);