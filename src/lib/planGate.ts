/**
 * Plan Gate — abonelik kotası VEYA ön ödemeli API kredisi.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  parsePlanFeatures,
  effectiveApiRequestLimit,
  type PlanLimits,
} from '@/lib/schemas/plan';
import { getApiCreditBalance } from '@/lib/apiCredits';

export async function getUserPlan(userId: string): Promise<string | null> {
  const sub = await prisma.userSubscription.findFirst({
    where: { userId, status: { in: ['active', 'trialing'] } },
    orderBy: { expiresAt: 'desc' },
    select: { planSlug: true },
  });
  return sub?.planSlug ?? null;
}

export async function getPlanLimits(planSlug: string | null): Promise<PlanLimits | null> {
  if (!planSlug) return null;
  const plan = await prisma.plan.findUnique({
    where: { slug: planSlug },
    select: { features: true, active: true },
  });
  if (!plan || !plan.active) return null;
  const features = parsePlanFeatures(plan.features);
  return features.limits ?? null;
}

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  remainingRequests: number;
  limit: number;
  limitRequests: number;
  planSlug: string | null;
  /** Abonelik kotası mı, ön ödemeli kredi mi? */
  billingSource: 'subscription' | 'credits' | null;
  reason?: string;
}

export async function getCurrentMonthUsage(userId: string): Promise<{
  tokensUsed: number;
  requestsUsed: number;
}> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const keys = await prisma.apiKey.findMany({
    where: { userId, revokedAt: null },
    select: { id: true },
  });
  const keyIds = keys.map((k) => k.id);
  if (keyIds.length === 0) {
    return { tokensUsed: 0, requestsUsed: 0 };
  }

  const requestsUsed = await prisma.apiKeyUsage.count({
    where: {
      apiKeyId: { in: keyIds },
      timestamp: { gte: startOfMonth },
      statusCode: { lt: 500 },
    },
  });

  return { tokensUsed: 0, requestsUsed };
}

export async function checkApiQuota(userId: string): Promise<QuotaCheckResult> {
  // 0) Kullanıcıya / Enterprise'a özel dinamik limit kontrolü
  let user: {
    customApiMonthlyLimit: number | null;
    customApiLimitExpiresAt: Date | null;
  } | null = null;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        customApiMonthlyLimit: true,
        customApiLimitExpiresAt: true,
      },
    });
    if (dbUser) {
      user = {
        customApiMonthlyLimit: dbUser.customApiMonthlyLimit,
        customApiLimitExpiresAt: dbUser.customApiLimitExpiresAt,
      };
    }
  } catch (err) {
    logger.error('[checkApiQuota] user fetch error', { err, userId });
  }

  const now = new Date();
  const hasCustomLimit =
    typeof user?.customApiMonthlyLimit === 'number' && user.customApiMonthlyLimit > 0;
  const isCustomLimitExpired = Boolean(
    user?.customApiLimitExpiresAt && user.customApiLimitExpiresAt < now
  );

  // Özel limit geçerli mi ve süresi dolmamış mı?
  if (hasCustomLimit && !isCustomLimitExpired) {
    const customLimit = user!.customApiMonthlyLimit!;
    const usage = await getCurrentMonthUsage(userId);
    const remainingRequests = Math.max(0, customLimit - usage.requestsUsed);

    if (usage.requestsUsed + 1 <= customLimit) {
      return {
        allowed: true,
        remaining: remainingRequests,
        remainingRequests,
        limit: customLimit,
        limitRequests: customLimit,
        planSlug: 'custom',
        billingSource: 'subscription',
      };
    }
    // Özel limit kotası doldu → kredilere düş
  }

  // 1) Standart aktif abonelik + kota
  const planSlug = await getUserPlan(userId);
  const limits = await getPlanLimits(planSlug);

  if (planSlug && limits) {
    const requestLimit = effectiveApiRequestLimit(limits) ?? 0;
    const usage = await getCurrentMonthUsage(userId);
    const remainingRequests = Math.max(0, requestLimit - usage.requestsUsed);

    if (requestLimit > 0 && usage.requestsUsed + 1 <= requestLimit) {
      return {
        allowed: true,
        remaining: remainingRequests,
        remainingRequests,
        limit: requestLimit,
        limitRequests: requestLimit,
        planSlug,
        billingSource: 'subscription',
      };
    }
    // Abonelik dolu → krediye düş
  }

  // 2) Ön ödemeli kredi
  const creditBalance = await getApiCreditBalance(userId);
  if (creditBalance >= 1) {
    return {
      allowed: true,
      remaining: creditBalance,
      remainingRequests: creditBalance,
      limit: creditBalance,
      limitRequests: creditBalance,
      planSlug,
      billingSource: 'credits',
    };
  }

  return {
    allowed: false,
    remaining: 0,
    remainingRequests: 0,
    limit: 0,
    limitRequests: 0,
    planSlug,
    billingSource: null,
    reason: isCustomLimitExpired
      ? 'Özel tanımlı API limitinizin süresi dolmuştur. Yeni limit için destek ile iletişime geçin veya kredi yükleyin.'
      : 'API erişimi için kredi yükleyin veya aylık plana geçin. Önce ödeme → sonra istek.',
  };
}

/** @deprecated AI kaldırıldı — checkApiQuota kullanın */
export async function checkAiQuota(
  userId: string,
  _estimatedTokens = 0
): Promise<QuotaCheckResult> {
  return checkApiQuota(userId);
}

export async function consumeApiQuota(input: {
  userId: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await prisma.apiKeyUsage.create({
      data: {
        apiKeyId: input.apiKeyId,
        endpoint: input.endpoint,
        method: input.method,
        statusCode: input.statusCode,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (error) {
    logger.error('[API] Failed to record usage', { error, endpoint: input.endpoint });
  }
}

/** @deprecated AI kaldırıldı */
export async function consumeAiQuota(_input: unknown): Promise<void> {
  // no-op — AI ürünü kaldırıldı
}
