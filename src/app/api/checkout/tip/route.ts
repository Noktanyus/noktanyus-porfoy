/**
 * POST /api/checkout/tip
 * Body: { amountTry, customerEmail, customerName?, customerPhone?, message? }
 */

import { NextRequest } from 'next/server';
import { tipService, TipCheckoutSchema } from '@/modules/commerce/tipService';
import { extractClientIp } from '@/lib/paytr';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json();
    const parsed = TipCheckoutSchema.parse(body);
    const result = await tipService.createCheckout({
      ...parsed,
      customerIp: extractClientIp(req.headers),
    });
    return ok(result);
  });
});
