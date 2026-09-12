/**
 * @file /api/user/ai/usage - AI kullanım istatistikleri
 * @description GET: Mevcut kullanıcının aylık AI kullanım özeti (token + request).
 *              Auth: giriş gerekli.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';
import { getCurrentMonthUsage, getUserPlan, getPlanLimits } from '@/lib/planGate';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');

    const [planSlug, limits, usage] = await Promise.all([
      getUserPlan(session.user.id),
      getPlanLimits(null), // aşağıda yeniden çağıracağız planSlug ile
      getCurrentMonthUsage(session.user.id),
    ]);

    const realLimits = await getPlanLimits(planSlug);

    const tokenLimit = realLimits?.aiTokensPerMonth ?? 0;
    const requestLimit = realLimits?.aiRequestsPerMonth ?? 0;

    return ok({
      planSlug,
      month: new Date().toISOString().slice(0, 7), // YYYY-MM
      tokensUsed: usage.tokensUsed,
      requestsUsed: usage.requestsUsed,
      tokensLimit: Number.isFinite(tokenLimit) ? tokenLimit : null,
      requestsLimit: Number.isFinite(requestLimit) ? requestLimit : null,
      tokensRemaining: Number.isFinite(tokenLimit) ? Math.max(0, tokenLimit - usage.tokensUsed) : null,
      requestsRemaining: Number.isFinite(requestLimit) ? Math.max(0, requestLimit - usage.requestsUsed) : null,
      isUnlimited: planSlug === 'enterprise',
    });
  });
}
