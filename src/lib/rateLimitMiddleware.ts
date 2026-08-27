/**
 * Next.js API route handler'ları için rate limit sarmalayıcı.
 *
 * Kullanım:
 *   export const POST = withRateLimit(RateLimits.contactForm, async (req) => { ... })
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, type RateLimitConfig } from './rateLimit';

export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    const result = rateLimiter.check(ip, config);

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `Çok fazla istek. ${result.resetIn} saniye sonra tekrar deneyin.`,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.resetIn),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const response = await handler(req);
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;
  };
}