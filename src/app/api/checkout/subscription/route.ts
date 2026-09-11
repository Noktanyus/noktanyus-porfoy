/**
 * POST /api/checkout/subscription
 * Body: { planSlug: string, customerEmail: string, paymentProvider?: 'stripe'|'iyzico' }
 *
 * Abonelik planı için Stripe veya iyzico Checkout Session oluşturur.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

    const result = await commerceService.createSubscriptionCheckout(
      parsed.planSlug,
      parsed.customerEmail,
      {
        paymentProvider: parsed.paymentProvider,
        customerName: parsed.customerName,
        customerPhone: parsed.customerPhone,
        customerIp: parsed.customerIp ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
        userId,
      }
    );
    return ok(result);
  });
});