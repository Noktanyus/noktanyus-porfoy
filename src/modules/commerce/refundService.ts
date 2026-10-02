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
};
