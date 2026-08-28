/**
 * Loyalty Service
 *
 * Phase: Loyalty Program
 * - Puan kazanma (purchase/review/referral/signup/birthday)
 * - Tier hesaplama (idempotent)
 * - Odul kullanma (redeem)
 * - Istatistik toplama (stats)
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ValidationError, NotFoundError } from '@/modules/shared/errors';
import {
  LOYALTY_TIERS,
  POINTS_RULES,
  calculatePurchasePoints,
  getTierByPoints,
  getNextTier,
  normalizeTier,
  type PointsReason,
  type TierName,
} from './tiers';

export interface LoyaltyStats {
  account: {
    points: number;
    lifetimePoints: number;
    tier: TierName;
  };
  currentTier: {
    name: TierName;
    label: string;
    perks: string[];
    discountPercent: number;
    gradient: string;
  };
  nextTier: {
    name: TierName;
    label: string;
    threshold: number;
    perks: string[];
    discountPercent: number;
  } | null;
  pointsToNext: number | null;
  progressPercent: number; // 0-100
  transactions: LoyaltyTransactionDto[];
  availableRewards: RewardDto[];
}

export interface LoyaltyTransactionDto {
  id: string;
  type: string;
  points: number;
  balance: number;
  reason: string;
  reference: string | null;
  createdAt: string;
}

export interface RewardDto {
  id: string;
  name: string;
  description: string;
  type: string;
  pointsCost: number;
  discountPercent: number | null;
  discountCents: number | null;
  tier: string;
  canRedeem: boolean;
  reasonBlocked?: string;
}

function generateRedemptionCode(rewardId: string): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LOYAL-${rewardId.slice(-4).toUpperCase()}-${suffix}`;
}

export const loyaltyService = {
  /**
   * Kullanicinin loyalty account'unu getir veya olustur.
   * Idempotent: Ayni user icin tek account.
   */
  async getOrCreateAccount(userId: string) {
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: {
          userId,
          points: 0,
          lifetimePoints: 0,
          tier: 'bronze',
        },
      });
      logger.info('Loyalty account created', { userId, accountId: account.id });
    }

    return account;
  },

  /**
   * Puan ekle (veya dus — negatif points ile).
   * Tier otomatik hesaplanir (idempotent).
   * Transaction log yazilir.
   */
  async awardPoints(
    userId: string,
    points: number,
    reason: PointsReason,
    options?: { reference?: string; description?: string }
  ) {
    if (points === 0) {
      throw new ValidationError('Puan miktari 0 olamaz');
    }

    const account = await this.getOrCreateAccount(userId);
    const newPoints = Math.max(0, account.points + points);
    const newLifetime = Math.max(account.lifetimePoints, newPoints);
    const newTier = getTierByPoints(newLifetime).name;
    const balance = newPoints;
    const rule = POINTS_RULES[reason];

    const transaction = await prisma.$transaction(async (tx) => {
      // Tier guncel mi kontrol et — sadece tier degisirse guncelle
      const tierChanged = newTier !== account.tier;

      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: newPoints,
          lifetimePoints: newLifetime,
          ...(tierChanged ? { tier: newTier } : {}),
        },
      });

      const txn = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: points > 0 ? 'earn' : 'adjustment',
          points,
          balance,
          reason: options?.description ?? rule.description,
          reference: options?.reference ?? null,
        },
      });

      return txn;
    });

    logger.info('Loyalty points awarded', {
      userId,
      points,
      reason,
      newPoints,
      newLifetime,
      tier: newTier,
    });

    return { transaction, account: { ...account, points: newPoints, lifetimePoints: newLifetime, tier: newTier } };
  },

  /**
   * Puan harca — odul kodu ureti.
   * Bakiye + tier kontrolu yapar.
   */
  async redeemPoints(userId: string, rewardId: string) {
    const account = await this.getOrCreateAccount(userId);
    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) throw new NotFoundError('Odul');
    if (!reward.active) {
      throw new ValidationError('Bu odul artik aktif degil');
    }

    const userTier = normalizeTier(account.tier);

    // Tier kontrolu
    const rewardTierIdx = LOYALTY_TIERS.findIndex((t) => t.name === reward.tier);
    const userTierIdx = LOYALTY_TIERS.findIndex((t) => t.name === userTier);
    if (userTierIdx < rewardTierIdx) {
      throw new ValidationError(
        `Bu odul icin minimum ${reward.tier} tier gerekli (sen: ${userTier})`
      );
    }

    // Bakiye kontrolu
    if (account.points < reward.pointsCost) {
      throw new ValidationError('INSUFFICIENT_POINTS', {
        required: reward.pointsCost,
        available: account.points,
      });
    }

    // Stock kontrolu (opsiyonel)
    // Burada stock takibi yok — odul kodu uretip balance dusuruyoruz

    const redemptionCode = generateRedemptionCode(reward.id);
    const newPoints = account.points - reward.pointsCost;

    const result = await prisma.$transaction(async (tx) => {
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { points: newPoints },
      });

      const txn = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: 'redeem',
          points: -reward.pointsCost,
          balance: newPoints,
          reason: `Odul kullanildi: ${reward.name}`,
          reference: redemptionCode,
        },
      });

      return txn;
    });

    logger.info('Loyalty reward redeemed', {
      userId,
      rewardId: reward.id,
      points: -reward.pointsCost,
      newBalance: newPoints,
      code: redemptionCode,
    });

    return {
      redemptionCode,
      reward: {
        id: reward.id,
        name: reward.name,
        type: reward.type,
        discountPercent: reward.discountPercent,
        discountCents: reward.discountCents,
      },
      pointsUsed: reward.pointsCost,
      newBalance: newPoints,
      transactionId: result.id,
    };
  },

  /**
   * Kullanicinin tam istatistik seti.
   * Dashboard icin optimize — tek sorguda account + transactions + rewards.
   */
  async getStats(userId: string): Promise<LoyaltyStats> {
    const account = await this.getOrCreateAccount(userId);

    const [transactions, rewards] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.loyaltyReward.findMany({
        where: { active: true },
        orderBy: { pointsCost: 'asc' },
      }),
    ]);

    const tier = normalizeTier(account.tier);
    const tierDef = LOYALTY_TIERS.find((t) => t.name === tier)!;
    const next = getNextTier(tier);

    const pointsToNext = next ? Math.max(0, next.threshold - account.lifetimePoints) : null;
    const progressPercent = next
      ? Math.min(100, Math.round((account.lifetimePoints / next.threshold) * 100))
      : 100;

    const availableRewards: RewardDto[] = rewards.map((r) => {
      const rewardTierIdx = LOYALTY_TIERS.findIndex((t) => t.name === r.tier);
      const userTierIdx = LOYALTY_TIERS.findIndex((t) => t.name === tier);
      const tierOk = userTierIdx >= rewardTierIdx;
      const balanceOk = account.points >= r.pointsCost;
      const canRedeem = tierOk && balanceOk;

      let reasonBlocked: string | undefined;
      if (!tierOk) reasonBlocked = `${r.tier} tier gerekli`;
      else if (!balanceOk) reasonBlocked = `Yetersiz puan (${r.pointsCost - account.points} eksik)`;

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        type: r.type,
        pointsCost: r.pointsCost,
        discountPercent: r.discountPercent,
        discountCents: r.discountCents,
        tier: r.tier,
        canRedeem,
        reasonBlocked,
      };
    });

    return {
      account: {
        points: account.points,
        lifetimePoints: account.lifetimePoints,
        tier,
      },
      currentTier: {
        name: tier,
        label: tierDef.label,
        perks: tierDef.perks,
        discountPercent: tierDef.discountPercent,
        gradient: tierDef.gradient,
      },
      nextTier: next
        ? {
            name: next.name,
            label: next.label,
            threshold: next.threshold,
            perks: next.perks,
            discountPercent: next.discountPercent,
          }
        : null,
      pointsToNext,
      progressPercent,
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        points: t.points,
        balance: t.balance,
        reason: t.reason,
        reference: t.reference,
        createdAt: t.createdAt.toISOString(),
      })),
      availableRewards,
    };
  },

  // =========================================================================
  // HOOKS — dis tetikleyicilerden (purchase, review, referral, signup)
  // =========================================================================

  /**
   * Siparis tamamlandiginda cagrilir.
   * totalCents'den puan hesaplar ve tier'i gunceller.
   */
  async onPurchase(orderId: string, userId: string, totalCents: number) {
    if (!userId) {
      logger.debug('Loyalty onPurchase: no userId, skipping', { orderId });
      return null;
    }
    const points = calculatePurchasePoints(totalCents);
    if (points <= 0) return null;
    return this.awardPoints(userId, points, 'purchase', {
      reference: orderId,
      description: `Siparis #${orderId.slice(-8)} icin ${points} puan`,
    });
  },

  /**
   * Urun yorumu yapildiginda — tek seferlik.
   */
  async onReview(userId: string, reviewId: string) {
    return this.awardPoints(userId, POINTS_RULES.review.amount, 'review', {
      reference: reviewId,
      description: `Yorum icin ${POINTS_RULES.review.amount} puan`,
    });
  },

  /**
   * Referral basarili — yeni kullanici kaydoldu ve ilk siparisini verdi.
   */
  async onReferral(referrerId: string, referralUserId: string) {
    if (referrerId === referralUserId) {
      logger.warn('Loyalty self-referral blocked', { referrerId });
      return null;
    }
    return this.awardPoints(referrerId, POINTS_RULES.referral.amount, 'referral', {
      reference: referralUserId,
      description: `Referral basarili — ${POINTS_RULES.referral.amount} puan`,
    });
  },

  /**
   * Yeni kullanici kaydi — hosgeldin bonusu.
   */
  async onSignup(userId: string) {
    return this.awardPoints(userId, POINTS_RULES.signup.amount, 'signup', {
      description: `Hosgeldin bonusu ${POINTS_RULES.signup.amount} puan`,
    });
  },
};