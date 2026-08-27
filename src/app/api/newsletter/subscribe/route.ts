/**
 * POST /api/newsletter/subscribe
 *
 * Yeni email abone olma. Double opt-in başlatır.
 * Body: { email, name?, categories?, source? }
 */

import { NextRequest } from 'next/server';
import { newsletterService } from '@/modules/newsletter';
import { SubscribeSchema } from '@/modules/newsletter/schemas';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json();
    const data = SubscribeSchema.parse(body);

    const referer = req.headers.get('referer') ?? '';
    const source = data.source ?? (referer.includes('/blog') ? 'blog' : 'footer');

    const result = await newsletterService.subscribe({
      ...data,
      source,
    });

    return ok({
      message: result.alreadySubscribed
        ? 'Bu e-posta zaten kayıtlı.'
        : 'Doğrulama email\'i gönderildi. Lütfen e-posta kutunuzu kontrol edin.',
      alreadySubscribed: result.alreadySubscribed ?? false,
    });
  });
});