/**
 * POST /api/checkout/product
 * Body: { items: CartItem[], customerEmail: string }
 *
 * Sepet içeriği için Stripe Checkout Session oluşturur ve
 * PENDING durumda Order kaydı yaratır. Mock mode destekli.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { commerceService, CartItemSchema } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';

const BodySchema = z.object({
  items: z.array(CartItemSchema).min(1).max(10),
  customerEmail: z.string().email(),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json();
    const { items, customerEmail } = BodySchema.parse(body);

    const result = await commerceService.createProductCheckout(items, customerEmail);
    return ok(result);
  });
});