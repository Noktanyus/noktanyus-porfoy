/**
 * POST /api/checkout/product
 * Body: { items, customerEmail, paymentProvider?, customerName?, customerPhone?, couponCode? }
 *
 * Birincil sağlayıcı: PayTR Direkt API (TR).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { commerceService, CartItemSchema } from '@/modules/commerce';
import { extractClientIp } from '@/lib/paytr';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';

const BodySchema = z.object({
  items: z.array(CartItemSchema).min(1).max(10),
  customerEmail: z.string().email(),
  paymentProvider: z.enum(['paytr', 'stripe', 'iyzico']).optional(),
  customerName: z.string().min(2).max(120).optional(),
  customerPhone: z.string().min(7).max(20).optional(),
  customerAddress: z.string().min(5).max(400).optional(),
  couponCode: z.string().min(3).max(50).optional(),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json();
    const parsed = BodySchema.parse(body);
    const {
      items,
      customerEmail,
      paymentProvider,
      customerName,
      customerPhone,
      customerAddress,
      couponCode,
    } = parsed;

    const result = await commerceService.createProductCheckout(items, customerEmail, {
      paymentProvider: paymentProvider ?? 'paytr',
      customerName,
      customerPhone,
      customerIp: extractClientIp(req.headers),
      customerAddress,
      couponCode,
    });
    return ok(result);
  });
});
