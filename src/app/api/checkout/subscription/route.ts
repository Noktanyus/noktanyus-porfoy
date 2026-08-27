/**
 * POST /api/checkout/subscription
 * Body: { planSlug: string, customerEmail: string, paymentProvider?: 'stripe'|'iyzico' }
 *
 * Abonelik planı için Stripe veya iyzico Checkout Session oluşturur.
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
  paymentProvider: z.enum(['stripe', 'iyzico']).optional(),
  customerName: z.string().min(2).max(120).optional(),
  customerPhone: z.string().min(7).max(20).optional(),
  customerIp: z.string().min(7).max(45).optional(),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json();
    const parsed = BodySchema.parse(body);
    const { planSlug, customerEmail, paymentProvider, customerName, customerPhone, customerIp } = parsed;

    const result = await commerceService.createSubscriptionCheckout(planSlug, customerEmail, {
      paymentProvider,
      customerName,
      customerPhone,
      customerIp,
    });
    return ok(result);
  });
});