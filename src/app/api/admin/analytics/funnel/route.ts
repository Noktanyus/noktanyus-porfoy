/**
 * Admin Analytics — Funnel API
 *
 * GET — Donusum hunisi basamaklari (Visitors -> Signups -> Activated -> Orders -> Paid).
 *
 * Query: ?days=30 (1-365, varsayilan 30)
 * Auth: NextAuth session + admin rolu zorunlu.
 */

import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyticsService } from '@/modules/analytics/service';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }
    if (session.user.role !== 'admin') {
      throw new ForbiddenError('Yetkisiz erişim');
    }

    const daysParam = req.nextUrl.searchParams.get('days');
    const funnel = await analyticsService.getFunnelStats({
      days: daysParam ? Number(daysParam) : undefined,
    });

    return ok(funnel);
  });
}
