/**
 * /api/user/referral
 *   GET — Kullanicinin referral kodunu ve istatistiklerini getirir.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { couponService } from '@/modules/commerce/couponService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ok({ referralCode: null, stats: { count: 0, earned: 0 } });
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const data = await couponService.getReferralStats(userId);
    return ok(data);
  });
}
