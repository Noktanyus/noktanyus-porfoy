/**
 * POST /api/coupons/validate
 *
 * Kupon kodunu doğrular ve indirim tutarını hesaplar.
 * Checkout akışında sepet özetini güncellemek için kullanılır.
 * - Public endpoint (checkout sırasında müşteri tarafı çağrılır)
 * - Rate-limited
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { couponService } from '@/modules/commerce/couponService';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';

const BodySchema = z.object({
  code: z.string().min(3).max(50),
  customerEmail: z.string().email(),
  subtotalCents: z.number().int().min(0),
  productIds: z.array(z.string()).optional(),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json();
    const data = BodySchema.parse(body);
    const result = await couponService.validate(data);
    return ok(result);
  });
});
