/**
 * POST /api/checkout/subscription
 * Body: { planSlug: string, customerEmail: string }
 *
 * Abonelik planı için Stripe Checkout Session oluşturur.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { commerceService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';

const BodySchema = z.object({
  planSlug: z.string().min(1).max(100),
  customerEmail: z.string().email(),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json();
    const { planSlug, customerEmail } = BodySchema.parse(body);

    const result = await commerceService.createSubscriptionCheckout(planSlug, customerEmail);
    return ok(result);
  });
});