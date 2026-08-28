/**
 * /api/user/loyalty
 *   GET — Kullanicinin loyalty istatistiklerini getirir.
 *         (points, tier, transactions, available rewards)
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { loyaltyService } from '@/modules/loyalty';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Oturum gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const stats = await loyaltyService.getStats(userId);
    return ok(stats);
  });
}