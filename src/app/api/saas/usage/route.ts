/**
 * @file /api/saas/usage - SaaS API: API key sahibinin kullanım istatistikleri
 * @description GET: API key'in bağlı olduğu user'ın plan + aylık kullanım özeti.
 *              Auth: withApiKey
 *              Yanıt: { planSlug, remainingTokens, remainingRequests, limitTokens,
 *                       limitRequests, currentMonthUsage }
 *
 *              Bu endpoint /api/user/ai/usage (session-based) endpoint'inin
 *              API-key bazlı karşılığı. Workspace-scoped DEĞİLDİR — user
 *              bazlıdır çünkü quota user plan'ına bağlıdır.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import {
  getCurrentMonthUsage,
  getUserPlan,
  getPlanLimits,
} from '@/lib/planGate';

export const dynamic = 'force-dynamic';

export const GET = withApiKey(async (_req: NextRequest, ctx) => {
  const userId = ctx.userId;

  const [planSlug, usage] = await Promise.all([
    getUserPlan(userId),
    getCurrentMonthUsage(userId),
  ]);

  const limits = await getPlanLimits(planSlug);
  const tokenLimit = limits?.aiTokensPerMonth ?? 0;
  const requestLimit = limits?.aiRequestsPerMonth ?? 0;
  const isUnlimited = planSlug === 'enterprise';

  const remainingTokens = isUnlimited
    ? Number.POSITIVE_INFINITY
    : Math.max(0, tokenLimit - usage.tokensUsed);
  const remainingRequests = isUnlimited
    ? Number.POSITIVE_INFINITY
    : Math.max(0, requestLimit - usage.requestsUsed);

  return NextResponse.json({
    success: true,
    data: {
      planSlug,
      isUnlimited,
      month: new Date().toISOString().slice(0, 7), // YYYY-MM
      currentMonthUsage: {
        tokensUsed: usage.tokensUsed,
        requestsUsed: usage.requestsUsed,
      },
      limits: {
        tokens: Number.isFinite(tokenLimit) ? tokenLimit : null,
        requests: Number.isFinite(requestLimit) ? requestLimit : null,
      },
      remaining: {
        tokens: Number.isFinite(remainingTokens) ? remainingTokens : null,
        requests: Number.isFinite(remainingRequests) ? remainingRequests : null,
      },
      limitTokens: Number.isFinite(tokenLimit) ? tokenLimit : null,
      limitRequests: Number.isFinite(requestLimit) ? requestLimit : null,
      remainingTokens: Number.isFinite(remainingTokens) ? remainingTokens : null,
      remainingRequests: Number.isFinite(remainingRequests) ? remainingRequests : null,
    },
  });
});
