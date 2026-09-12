/**
 * Plan Gate — Tier-based AI feature quota enforcement.
 *
 * Sprint 1: AI Quick Wins kapsamında kullanıcının planına göre AI feature
 * kullanım limitini kontrol eder. Workspace RBAC'ten (lib/rbac.ts) ayrı bir
 * boyut — workspace üyeliği değil, kullanıcının Plan seviyesi kontrol edilir.
 *
 * Limit tanımları Plan.features JSON'unda (PlanLimitsSchema). Enterprise plan
 * sınırsız (Number.POSITIVE_INFINITY) kabul edilir.
 *
 * Tipik kullanım (AI endpoint içinde):
 *   const check = await checkAiQuota(userId, estimatedTokens);
 *   if (!check.allowed) throw new ForbiddenError(check.reason);
 *   const result = await anthropic.messages.create(...);
 *   await consumeAiQuota(userId, 'blog.write', input, output);
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { parsePlanFeatures, type PlanLimits } from '@/lib/schemas/plan';

/**
 * Kullanıcının aktif plan slug'ını döner.
 * Aktif subscription yoksa veya status 'active' değilse null döner.
 */
export async function getUserPlan(userId: string): Promise<string | null> {
  const sub = await prisma.userSubscription.findFirst({
    where: { userId, status: 'active' },
    orderBy: { expiresAt: 'desc' },
    select: { planSlug: true },
  });
  return sub?.planSlug ?? null;
}

/**
 * Plan'ın AI limitlerini döner.
 * Enterprise plan → sınırsız (Infinity). Bulunamayan plan → null.
 */
export async function getPlanLimits(planSlug: string | null): Promise<PlanLimits | null> {
  if (!planSlug) return null;
  if (planSlug === 'enterprise') {
    return {
      aiTokensPerMonth: Number.POSITIVE_INFINITY,
      aiRequestsPerMonth: Number.POSITIVE_INFINITY,
    };
  }
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
  remaining: number;        // Kalan token (Infinity → Number.POSITIVE_INFINITY)
  remainingRequests: number;
  limit: number;            // Plan token limit (Infinity → Number.POSITIVE_INFINITY)
  limitRequests: number;
  planSlug: string | null;
  reason?: string;          // allowed=false ise hata sebebi
}

/**
 * Bu ay içinde kullanıcının kullandığı toplam AI token ve request sayısı.
 */
export async function getCurrentMonthUsage(userId: string): Promise<{
  tokensUsed: number;
  requestsUsed: number;
}> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [tokenAgg, requestCount] = await Promise.all([
    prisma.aiUsage.aggregate({
      where: { userId, createdAt: { gte: startOfMonth } },
      _sum: { totalTokens: true },
    }),
    prisma.aiUsage.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    }),
  ]);

  return {
    tokensUsed: tokenAgg._sum.totalTokens ?? 0,
    requestsUsed: requestCount,
  };
}

/**
 * AI çağrısı öncesi kota kontrolü.
 * allowed=false → istek atılmamalı.
 */
export async function checkAiQuota(
  userId: string,
  estimatedTokens = 0
): Promise<QuotaCheckResult> {
  const planSlug = await getUserPlan(userId);
  const limits = await getPlanLimits(planSlug);

  if (!planSlug || !limits) {
    return {
      allowed: false,
      remaining: 0,
      remainingRequests: 0,
      limit: 0,
      limitRequests: 0,
      planSlug,
      reason: 'Aktif bir abonelik planınız yok. AI özellikleri için Profesyonel veya Destek+ plana geçin.',
    };
  }

  // Enterprise için limits Infinity, ayrı kontrol gerekmiyor
  if (planSlug === 'enterprise') {
    return {
      allowed: true,
      remaining: Number.POSITIVE_INFINITY,
      remainingRequests: Number.POSITIVE_INFINITY,
      limit: Number.POSITIVE_INFINITY,
      limitRequests: Number.POSITIVE_INFINITY,
      planSlug,
    };
  }

  const tokenLimit = limits.aiTokensPerMonth ?? 0;
  const requestLimit = limits.aiRequestsPerMonth ?? 0;
  const usage = await getCurrentMonthUsage(userId);

  const remainingTokens = Math.max(0, tokenLimit - usage.tokensUsed);
  const remainingRequests = Math.max(0, requestLimit - usage.requestsUsed);

  if (tokenLimit > 0 && usage.tokensUsed + estimatedTokens > tokenLimit) {
    return {
      allowed: false,
      remaining: remainingTokens,
      remainingRequests,
      limit: tokenLimit,
      limitRequests: requestLimit,
      planSlug,
      reason: `Aylık AI token limitinize ulaştınız (${usage.tokensUsed}/${tokenLimit}). Planı yükseltin.`,
    };
  }

  if (requestLimit > 0 && usage.requestsUsed + 1 > requestLimit) {
    return {
      allowed: false,
      remaining: remainingTokens,
      remainingRequests,
      limit: tokenLimit,
      limitRequests: requestLimit,
      planSlug,
      reason: `Aylık AI istek limitinize ulaştınız (${usage.requestsUsed}/${requestLimit}). Planı yükseltin.`,
    };
  }

  return {
    allowed: true,
    remaining: remainingTokens,
    remainingRequests,
    limit: tokenLimit,
    limitRequests: requestLimit,
    planSlug,
  };
}

export interface ConsumeAiQuotaInput {
  userId: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costCents?: number;
  resourceId?: string;
  resourceType?: string;
  promptSummary?: string;
}

/**
 * AI generation tamamlandıktan sonra kullanım kaydı oluşturur.
 * AiUsage tablosuna bir satır ekler (per-call granular tracking).
 */
export async function consumeAiQuota(input: ConsumeAiQuotaInput): Promise<void> {
  const totalTokens = input.inputTokens + input.outputTokens;
  try {
    await prisma.aiUsage.create({
      data: {
        userId: input.userId,
        feature: input.feature,
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        totalTokens,
        costCents: input.costCents ?? 0,
        resourceId: input.resourceId ?? null,
        resourceType: input.resourceType ?? null,
        promptSummary: input.promptSummary ?? null,
      },
    });
  } catch (error) {
    // Ana işlemi bloklamaz — logla
    logger.error('[AI] Failed to record usage', { error, input: { ...input, promptSummary: undefined } });
  }
}
