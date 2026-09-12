/**
 * @file /api/auth/verify-email - GET endpoint for email verification
 * @description Magic link'ten gelen ?token= parametresiyle email doğrular,
 *              trial subscription başlatır ve /dashboard'a yönlendirir.
 *              GET kullanıyoruz çünkü email linkleri browser'da tıklanır
 *              ve JavaScript gerektirmeyen redirect tercih edilir.
 *
 *              Rate limiting (auth bucket) — token brute-force koruması.
 *              Token tek kullanımlık + 24 saat TTL; rate limit ek bir
 *              defense-in-depth katmanı.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/apiResponse';
import { AppError } from '@/modules/shared/errors';
import { VerifyEmailSchema } from '@/modules/onboarding/schemas';
import { verifyEmail } from '@/modules/onboarding/service';
import { withRateLimit, RateLimits } from '@/lib/rateLimitMiddleware';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  return withErrorHandling(async () => {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.redirect(new URL('/giris?verify=missing-token', req.url));
    }

    try {
      const input = VerifyEmailSchema.parse({ token });
      await verifyEmail(input);
      return NextResponse.redirect(new URL('/dashboard?verified=true', req.url));
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Doğrulama başarısız';
      const params = new URLSearchParams({ verify: 'failed', reason: message });
      return NextResponse.redirect(new URL(`/giris?${params.toString()}`, req.url));
    }
  });
}

export const GET = withRateLimit(RateLimits.auth, handler);