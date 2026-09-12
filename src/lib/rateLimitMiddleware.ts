/**
 * Next.js API route handler'ları için rate limit sarmalayıcı.
 *
 * Kullanım:
 *   export const POST = withRateLimit(RateLimits.contactForm, async (req) => { ... })
 *
 * L7 notu: Backend secimi (Redis vs InMemory) factory tarafindan
 * otomatik yapilir. Middleware katmani backend'den bagimsiz — sadece
 * rateLimiter.check() kontratina bagimli.
 *
 * Route handler'lar Next.js App Router'da `(req, ctx)` seklinde 2 arg alir
 * (ctx = { params }). withRateLimit ctx parametresini destekler; boylece
 * dynamic route'lar ([slug], [id] vs.) ile uyumlu olur.
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, type RateLimitConfig, RateLimits } from './rateLimit';

export { RateLimits };

// Geniş tip — handler'ın döndüğü NextResponse generic'i korunabilsin.
// withErrorHandling zaten Promise<NextResponse<...>> döndürüyor; burada
// birlikte çalışabilmek için esnek bir type kullanıyoruz.
// eslint-disable-next-line
type AnyHandler = (
  req: NextRequest,
  ctx?: { params: Record<string, string | string[]> }
) => Promise<any>;

export function withRateLimit(
  config: RateLimitConfig,
  // eslint-disable-next-line
  handler: (req: NextRequest, ctx: { params: any }) => Promise<any>
) {
  return async (
    req: NextRequest,
    ctx?: { params: Record<string, string | string[]> }
  ): Promise<NextResponse> => {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    // Backend async olabilir (Redis Lua script) — await ile bekle.
    const result = await Promise.resolve(rateLimiter.check(ip, config));

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

    // Handler'i ctx ile birlikte cagir (dynamic route parametreleri icin).
    // ctx tanimliysa 2 arg, degilse sadece req gecirilir. AnyHandler esnek
    // tipi her iki arity'yi kabul eder.
    const response = (ctx
      ? await (handler as AnyHandler)(req, ctx)
      : await (handler as AnyHandler)(req)) as NextResponse;
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;
  };
}
