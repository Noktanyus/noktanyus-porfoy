/**
 * POST /api/checkout/subscription
 * Body: { planSlug, customerEmail, paymentProvider?, customerName?, customerPhone? }
 *
 * Birincil: PayTR (dönem ücreti tek çekim). Legacy: Stripe/iyzico.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { commerceService } from '@/modules/commerce';
import { extractClientIp } from '@/lib/paytr';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';

const BodySchema = z.object({
  planSlug: z.string().min(1).max(100),
  customerEmail: z.string().email(),
  paymentProvider: z.enum(['paytr', 'stripe', 'iyzico']).optional(),
  customerName: z.string().min(2).max(120).optional(),
  customerPhone: z.string().min(7).max(20).optional(),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json();
    const parsed = BodySchema.parse(body);
    const { planSlug, customerEmail, paymentProvider, customerName, customerPhone } = parsed;

    const result = await commerceService.createSubscriptionCheckout(planSlug, customerEmail, {
      paymentProvider: paymentProvider ?? 'paytr',
      customerName,
      customerPhone,
      customerIp: extractClientIp(req.headers),
    });
    return ok(result);
  });
});
