/**
 * POST /api/checkout/product
 * Body: { items: CartItem[], customerEmail: string, paymentProvider?: 'stripe'|'iyzico', customerName?, customerPhone?, customerIp? }
 *
 * Sepet içeriği için Stripe veya iyzico Checkout Session oluşturur ve
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
  paymentProvider: z.enum(['stripe', 'iyzico']).optional(),
  customerName: z.string().min(2).max(120).optional(),
  customerPhone: z.string().min(7).max(20).optional(),
  customerIp: z.string().min(7).max(45).optional(),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json();
    const parsed = BodySchema.parse(body);
    const { items, customerEmail, paymentProvider, customerName, customerPhone, customerIp } = parsed;

    const result = await commerceService.createProductCheckout(items, customerEmail, {
      paymentProvider,
      customerName,
      customerPhone,
      customerIp,
    });
    return ok(result);
  });
});