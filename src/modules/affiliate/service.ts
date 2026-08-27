/**
 * Affiliate / Referral Commission Service
 *
 * Phase "Video Calls + Affiliate" kapsaminda eklendi.
 * Davet edilen kullanici siparis verdiginde, davet eden affiliate komisyonu alir.
 * - trackConversion(): PAID sipariste otomatik komisyon olusturur
 * - getStats(): kullanicinin affiliate istatistiklerini getirir
 * - requestPayout(): payout talebi olusturur (minimum bakiye + onay kontrolu)
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ValidationError, NotFoundError } from '@/modules/shared/errors';

const MIN_PAYOUT_CENTS = 10000; // 100 TL

export const affiliateService = {
  /**
   * Siparis PAID oldugunda cagrilir. Davet edilen kullanicinin referrer'ini
   * bulur, komisyon olusturur ve referrer'in balance'ini gunceller.
   *
   * Idempotent: Ayni siparis icin birden fazla kez cagrilirsa tek komisyon olusturur.
   */
  async trackConversion(orderId: string) {
    // Idempotency check FIRST — eger bu siparis icin komisyon zaten olusturulduysa
    // hicbisey yapma (return existing). Bu sayede ayni siparis icin tekrar cagrilirsa
    // duplicate commission olusmaz.
    const existing = await prisma.affiliateCommission.findUnique({
      where: { orderId },
    });
    if (existing) {
      logger.info('Affiliate commission already exists for order', { orderId, commissionId: existing.id });
      return existing;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      logger.warn('Affiliate trackConversion: order not found', { orderId });
      return null;
    }
    if (!order.customerEmail) {
      logger.warn('Affiliate trackConversion: order has no email', { orderId });
      return null;
    }

    // Referred user'i bul (email ile)
    const referredUser = await prisma.user.findUnique({
      where: { email: order.customerEmail },
      select: { id: true, referredBy: true },
    });

    if (!referredUser?.referredBy) {
      // Bu kullanici referral ile gelmedi
      return null;
    }

    // Referrer'i bul (referralCode ile)
    const referrer = await prisma.user.findFirst({
      where: { referralCode: referredUser.referredBy },
      select: { id: true, affiliatePercent: true, affiliateBalanceCents: true },
    });

    if (!referrer) {
      logger.warn('Affiliate trackConversion: referrer not found', {
        referredBy: referredUser.referredBy,
        referredId: referredUser.id,
      });
      return null;
    }

    // Self-referral engeli
    if (referrer.id === referredUser.id) {
      logger.warn('Affiliate self-referral attempt blocked', { orderId, userId: referrer.id });
      return null;
    }

    const commissionPercent = referrer.affiliatePercent ?? 20;
    const commissionCents = Math.max(
      0,
      Math.round((order.totalCents * commissionPercent) / 100)
    );

    if (commissionCents <= 0) {
      logger.info('Affiliate commission is zero, skipping', { orderId, totalCents: order.totalCents });
      return null;
    }

    const commission = await prisma.$transaction(async (tx) => {
      const created = await tx.affiliateCommission.create({
        data: {
          referrerId: referrer.id,
          referredId: referredUser.id,
          orderId: order.id,
          orderAmountCents: order.totalCents,
          commissionPercent,
          commissionCents,
          status: 'pending',
        },
      });

      // Referrer stats guncelle
      await tx.user.update({
        where: { id: referrer.id },
        data: {
          referralCount: { increment: 1 },
          affiliateBalanceCents: { increment: commissionCents },
        },
      });

      return created;
    });

    logger.info('Affiliate commission created', {
      orderId,
      commissionId: commission.id,
      referrerId: referrer.id,
      referredId: referredUser.id,
      commissionCents,
    });

    return commission;
  },

  /**
   * Kullanicinin affiliate istatistikleri (dashboard icin).
   */
  async getStats(userId: string) {
    const [user, commissions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          affiliateBalanceCents: true,
          referralCount: true,
          affiliatePercent: true,
          affiliateApproved: true,
          referralCode: true,
        },
      }),
      prisma.affiliateCommission.groupBy({
        by: ['status'],
        where: { referrerId: userId },
        _sum: { commissionCents: true },
        _count: { _all: true },
      }),
    ]);

    if (!user) {
      return {
        balanceCents: 0,
        percent: 0,
        totalReferrals: 0,
        approved: false,
        referralCode: null,
        byStatus: {},
      };
    }

    return {
      balanceCents: user.affiliateBalanceCents ?? 0,
      percent: user.affiliatePercent ?? 0,
      totalReferrals: user.referralCount ?? 0,
      approved: user.affiliateApproved ?? false,
      referralCode: user.referralCode ?? null,
      byStatus: commissions.reduce(
        (acc, c) => ({
          ...acc,
          [c.status]: {
            count: c._count._all ?? 0,
            amountCents: c._sum.commissionCents ?? 0,
          },
        }),
        {} as Record<string, { count: number; amountCents: number }>
      ),
    };
  },

  /**
   * Kullanicinin komisyon gecmisini getirir (son 50).
   */
  async listCommissions(userId: string, take = 50) {
    return prisma.affiliateCommission.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        referred: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, orderNumber: true, totalCents: true } },
      },
    });
  },

  /**
   * Payout talebi olusturur. Bakiye sifirlanir ve pending payout olusturulur.
   */
  async requestPayout(userId: string, method: string, notes?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { affiliateBalanceCents: true, affiliateApproved: true },
    });

    if (!user) throw new NotFoundError('Kullanıcı');
    if (!user.affiliateApproved) {
      throw new ValidationError('Payout için henüz onaylanmamışsınız');
    }
    if ((user.affiliateBalanceCents ?? 0) < MIN_PAYOUT_CENTS) {
      throw new ValidationError(
        `Minimum payout ${MIN_PAYOUT_CENTS / 100} TL. Mevcut bakiye: ${(user.affiliateBalanceCents ?? 0) / 100} TL`
      );
    }

    const validMethods = ['bank_transfer', 'paypal', 'stripe'];
    if (!validMethods.includes(method)) {
      throw new ValidationError(`Geçersiz ödeme yöntemi. Geçerli: ${validMethods.join(', ')}`);
    }

    const payout = await prisma.$transaction(async (tx) => {
      const created = await tx.affiliatePayout.create({
        data: {
          userId,
          amountCents: user.affiliateBalanceCents,
          method,
          notes,
          status: 'pending',
        },
      });

      // Pending komisyonlari payout'a bagla
      const pendingCommissions = await tx.affiliateCommission.findMany({
        where: { referrerId: userId, status: 'pending' },
        select: { id: true },
      });

      if (pendingCommissions.length > 0) {
        await tx.affiliateCommission.updateMany({
          where: { id: { in: pendingCommissions.map((c) => c.id) } },
          data: { payoutId: created.id, status: 'approved', approvedAt: new Date() },
        });
      }

      // Bakiyeyi sifirla
      await tx.user.update({
        where: { id: userId },
        data: { affiliateBalanceCents: 0 },
      });

      return created;
    });

    logger.info('Affiliate payout requested', {
      payoutId: payout.id,
      userId,
      amountCents: payout.amountCents,
      method,
    });

    return payout;
  },
};