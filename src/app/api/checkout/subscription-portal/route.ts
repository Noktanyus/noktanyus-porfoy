/**
 * POST /api/checkout/subscription-portal
 * Body: { customerEmail: string }
 *
 * Müşterinin aboneliklerini yönetebileceği Stripe Billing Portal session'ı oluşturur.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { commerceService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';

const BodySchema = z.object({
  customerEmail: z.string().email(),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json();
    const { customerEmail } = BodySchema.parse(body);

    const result = await commerceService.createPortalSession(customerEmail);
    return ok(result);
  });
});