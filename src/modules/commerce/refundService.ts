/**
 * Refund Service — Sipariş iade işlemleri (Yalnızca PayTR).
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isPaytrConfigured, toPaytrMerchantOid } from '@/lib/paytr';
import { paytrService } from '@/modules/commerce/paytrService';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { NotFoundError, ValidationError } from '@/modules/shared/errors';

export interface CreateRefundInput {
  orderId: string;
  userId: string;
  userEmail?: string;
  amountCents?: number;
  reason?: string;
}

export interface RefundResult {
  success: true;
  refundId: string;
  provider: 'paytr';
  amountCents: number;
  fullRefund: boolean;
}

export const refundService = {
  detectProvider(_order?: unknown): 'paytr' {
    return 'paytr';
  },

  async createRefund(input: CreateRefundInput): Promise<RefundResult> {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundError('Sipariş');

    if (order.status !== 'PAID' && order.status !== 'PARTIALLY_REFUNDED') {
      throw new ValidationError('Sadece ödenmiş siparişler iade edilebilir');
    }

    const refundAmount = input.amountCents ?? order.totalCents;
    if (refundAmount <= 0) {
      throw new ValidationError('İade tutarı sıfırdan büyük olmalı');
    }
    if (refundAmount > order.totalCents) {
      throw new ValidationError('İade tutarı sipariş tutarından büyük olamaz');
    }

    const isFullRefund = refundAmount === order.totalCents;

    // --- PayTR Canlı İade ---
    if (isPaytrConfigured()) {
      const merchantOid =
        order.stripeSessionId?.replace(/^paytr_/, '') ||
        toPaytrMerchantOid(order.orderNumber);
      const referenceNo = `rf_${order.id.slice(0, 8)}_${Date.now()}`;

      const paytrResult = await paytrService.refund({
        merchantOid,
        returnAmountCents: refundAmount,
        referenceNo,
      });

      if (paytrResult.status !== 'success') {
        throw new ValidationError(
          paytrResult.errMsg
            ? `PayTR iade başarısız: ${paytrResult.errNo ?? ''} ${paytrResult.errMsg}`
            : 'PayTR iade başarısız'
        );
      }

      const refundId = paytrResult.referenceNo || referenceNo;
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundedAt: new Date(),
          refundReason: input.reason,
          metadata: {
            ...((order.metadata as Record<string, unknown>) ?? {}),
            refundId,
            paytrReturnAmount: paytrResult.returnAmount,
          } as Prisma.InputJsonValue,
        },
      });

      await this.revokeLicensesForOrder(order.id);
      await this.cleanupRefundedBenefits(order);

      await logAudit({
        userId: input.userId,
        userEmail: input.userEmail,
        action: 'REFUND',
        resource: 'Order',
        resourceId: order.id,
        details: {
          refundId,
          amount: refundAmount,
          fullRefund: isFullRefund,
          provider: 'paytr',
        },
      });

      logger.info('PayTR refund created', {
        orderId: order.id,
        refundId,
        amountCents: refundAmount,
        merchantOid,
      });

      return {
        success: true,
        refundId,
        provider: 'paytr',
        amountCents: refundAmount,
        fullRefund: isFullRefund,
      };
    }

    // --- PayTR Mock İade (Development / Test) ---
    const refundId = `paytr_mock_refund_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundedAt: new Date(),
        refundReason: input.reason,
        metadata: {
          ...((order.metadata as Record<string, unknown>) ?? {}),
          refundId,
          mock: true,
          provider: 'paytr',
        } as Prisma.InputJsonValue,
      },
    });

    await this.revokeLicensesForOrder(order.id);
    await this.cleanupRefundedBenefits(order);

    await logAudit({
      userId: input.userId,
      userEmail: input.userEmail,
      action: 'REFUND',
      resource: 'Order',
      resourceId: order.id,
      details: {
        refundId,
        amount: refundAmount,
        fullRefund: isFullRefund,
        provider: 'paytr',
        mock: true,
      },
    });

    logger.info('PayTR mock refund recorded', {
      orderId: order.id,
      refundId,
      amountCents: refundAmount,
    });

    return {
      success: true,
      refundId,
      provider: 'paytr',
      amountCents: refundAmount,
      fullRefund: isFullRefund,
    };
  },

  async revokeLicensesForOrder(orderId: string) {
    const licenses = await prisma.license.findMany({
      where: { orderId, status: { not: 'revoked' } },
    });

    if (!licenses.length) return [];

    await prisma.license.updateMany({
      where: { orderId, status: { not: 'revoked' } },
      data: { status: 'revoked' },
    });

    logger.info('Licenses revoked for refund', {
      orderId,
      count: licenses.length,
      licenseIds: licenses.map((l) => l.id),
    });

    return licenses;
  },

  async cleanupRefundedBenefits(order: {
    id: string;
    userId?: string | null;
    stripeSessionId?: string | null;
    metadata?: unknown;
    notes?: string | null;
  }) {
    const meta = (order.metadata && typeof order.metadata === 'object'
      ? (order.metadata as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const notes = (order.notes || '').toLowerCase();
    const metaType = typeof meta.type === 'string' ? meta.type.toLowerCase() : '';

    const isSubscription =
      metaType === 'subscription' ||
      notes.startsWith('abonelik') ||
      Boolean(meta.planSlug) ||
      Boolean(meta.planId);

    const isApiTopup =
      metaType === 'api_topup' ||
      notes.startsWith('api kredi') ||
      typeof meta.credits === 'number';

    // 1. Abonelik iptali
    if (isSubscription) {
      const paytrSubId = `paytr_sub_${order.stripeSessionId ?? order.id}`;
      if (prisma.subscription?.updateMany) {
        try {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: paytrSubId },
            data: {
              status: 'CANCELED',
              stripeStatus: 'canceled',
              canceledAt: new Date(),
            },
          });
        } catch (err) {
          logger.warn('[Refund] Subscription cancel update failed', { err, paytrSubId });
        }
      }
      if (order.userId && prisma.userSubscription?.updateMany) {
        try {
          await prisma.userSubscription.updateMany({
            where: {
              userId: order.userId,
              stripeSubscriptionId: paytrSubId,
            },
            data: {
              status: 'cancelled',
              expiresAt: new Date(),
            },
          });
        } catch (err) {
          logger.warn('[Refund] UserSubscription cancel update failed', { err, paytrSubId });
        }
      }
      logger.info('Subscription cancelled due to refund', { orderId: order.id, paytrSubId });
    }

    // 2. Kredi geri alma
    if (isApiTopup && order.userId) {
      let credits = typeof meta.credits === 'number' ? meta.credits : 0;
      if (!credits && prisma.apiCreditLedger?.findFirst) {
        try {
          const topup = await prisma.apiCreditLedger.findFirst({
            where: { orderId: order.id, reason: 'topup' },
          });
          if (topup) credits = topup.delta;
        } catch (err) {
          logger.warn('[Refund] Failed to fetch topup ledger', { err, orderId: order.id });
        }
      }

      if (credits > 0 && prisma.user?.update && prisma.apiCreditLedger?.create) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: order.userId },
            select: { apiCreditBalance: true },
          });
          const currentBalance = user?.apiCreditBalance ?? 0;
          const newBalance = Math.max(0, currentBalance - credits);

          await prisma.user.update({
            where: { id: order.userId },
            data: { apiCreditBalance: newBalance },
          });

          await prisma.apiCreditLedger.create({
            data: {
              userId: order.userId,
              delta: -credits,
              balanceAfter: newBalance,
              reason: 'refund',
              orderId: order.id,
              metadata: {
                note: 'Sipariş iadesi nedeniyle API kredileri geri çekildi',
              },
            },
          });

          logger.info('API credits reverted due to refund', {
            orderId: order.id,
            userId: order.userId,
            revertedCredits: credits,
            newBalance,
          });
        } catch (err) {
          logger.error('[Refund] Failed to revert API credits', { err, orderId: order.id });
        }
      }
    }
  },
};
