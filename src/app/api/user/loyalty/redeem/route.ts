/**
 * /api/user/loyalty/redeem
 *   POST — Kullanici puanlarini harcayip odul kodu alir.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { loyaltyService } from '@/modules/loyalty';
import { ValidationError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const RedeemSchema = z.object({
  rewardId: z.string().min(1, 'rewardId zorunlu'),
});

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Oturum gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = RedeemSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        new ValidationError('Gecersiz istek', parsed.error.flatten())
      );
    }

    try {
      const result = await loyaltyService.redeemPoints(userId, parsed.data.rewardId);
      return ok(result);
    } catch (err) {
      if (err instanceof ValidationError && err.message === 'INSUFFICIENT_POINTS') {
        return fail(err);
      }
      throw err;
    }
  });
}