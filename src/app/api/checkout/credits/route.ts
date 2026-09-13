/**
 * POST /api/checkout/credits
 * Giriş zorunlu — kredi hesaba yazılır.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { commerceService } from '@/modules/commerce';
import { extractClientIp } from '@/lib/paytr';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { getCreditPack } from '@/lib/apiCredits';
import { UnauthorizedError, ValidationError } from '@/modules/shared/errors';

const BodySchema = z.object({
  packSlug: z.string().min(1).max(64),
  paymentProvider: z.enum(['paytr', 'stripe', 'iyzico']).optional(),
  customerName: z.string().min(2).max(120).optional(),
  customerPhone: z.string().min(7).max(20).optional(),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return fail(new UnauthorizedError('Kredi yüklemek için giriş yapın'));
    }

    const body = await req.json();
    const parsed = BodySchema.parse(body);
    if (!getCreditPack(parsed.packSlug)) {
      throw new ValidationError('Geçersiz kredi paketi');
    }

    const userId = (session.user as { id: string }).id;
    const result = await commerceService.createCreditTopupCheckout(
      parsed.packSlug,
      session.user.email,
      {
        paymentProvider: parsed.paymentProvider ?? 'paytr',
        customerName: parsed.customerName ?? session.user.name ?? undefined,
        customerPhone: parsed.customerPhone,
        customerIp: extractClientIp(req.headers),
        userId,
      }
    );
    return ok(result);
  });
});
