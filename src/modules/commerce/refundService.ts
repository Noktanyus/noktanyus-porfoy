/**
 * Refund Service — Sipariş iade işlemleri.
 *
 * Provider tespiti:
 *   - stripePaymentIntent "pi_" → Stripe
 *   - stripePaymentIntent "paytr_" veya metadata.provider=paytr → PayTR İade API
 *   - aksi halde iyzico / mock
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { isIyzicoConfigured } from '@/lib/iyzico';
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
  provider: 'stripe' | 'iyzico' | 'paytr';
  amountCents: number;
  fullRefund: boolean;
}

type DetectOrder = {
  stripePaymentIntent?: string | null;
  stripeSessionId?: string | null;
  metadata?: unknown;
};

export const refundService = {
  detectProvider(order: DetectOrder): 'stripe' | 'iyzico' | 'paytr' {
    if (order.stripePaymentIntent?.startsWith('pi_')) return 'stripe';
    if (order.stripePaymentIntent?.startsWith('paytr_')) return 'paytr';
    const meta = (order.metadata ?? {}) as Record<string, unknown>;
    if (meta.provider === 'paytr') return 'paytr';
    if (order.stripeSessionId && !order.stripeSessionId.startsWith('cs_')) {
      // PayTR merchant_oid genelde alfanumerik; Stripe session cs_ ile başlar
      if (meta.provider !== 'iyzico' && meta.provider !== 'stripe') {
        if (isPaytrConfigured()) return 'paytr';
      }
    }
    return 'iyzico';
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
    const provider = this.detectProvider(order);

    // --- Stripe iade ---
    if (provider === 'stripe' && isStripeConfigured()) {
      const refund = await stripe.refunds.create({
        payment_intent: order.stripePaymentIntent!,
        amount: refundAmount,
        reason: 'requested_by_customer',
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          refundedBy: input.userId,
        },
      });

      const mergedMetadata = {
        ...((order.metadata as Record<string, unknown>) ?? {}),
        refundId: refund.id,
      };

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundedAt: new Date(),
          refundReason: input.reason,
          metadata: mergedMetadata as Prisma.InputJsonValue,
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
          refundId: refund.id,
          amount: refundAmount,
          fullRefund: isFullRefund,
          provider: 'stripe',
        },
      });

      logger.info('Stripe refund created', {
        orderId: order.id,
        refundId: refund.id,
        amountCents: refundAmount,
      });

      return {
        success: true,
        refundId: refund.id,
        provider: 'stripe',
        amountCents: refundAmount,
        fullRefund: isFullRefund,
      };
    }

    // --- PayTR İade API ---
    if (provider === 'paytr' && isPaytrConfigured()) {
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

    // --- iyzico / mock iade ---
    const refundId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const iyzicoLive = provider === 'iyzico' && isIyzicoConfigured();

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundedAt: new Date(),
        refundReason: input.reason,
        metadata: {
          ...((order.metadata as Record<string, unknown>) ?? {}),
          refundId,
          iyzicoLive,
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
        provider,
        iyzicoLive,
      },
    });

    logger.info(`${provider} refund recorded`, {
      orderId: order.id,
      refundId,
      amountCents: refundAmount,
      iyzicoLive,
    });

    return {
      success: true,
      refundId,
      provider: provider === 'paytr' ? 'paytr' : 'iyzico',
      amountCents: refundAmount,
      fullRefund: isFullRefund,
    };
  },

  async revokeLicensesForOrder(orderId: string) {
    const licenses = await prisma.license.findMany({
      where: { orderId, status: { not: 'revoked' } },
    });

    if (licenses.length === 0) return [];

    const now = new Date();
    await Promise.all(
      licenses.map((license) =>
        prisma.license.update({
          where: { id: license.id },
          data: {
            status: 'revoked',
            revokedAt: now,
            revokeReason: 'Order refunded',
          },
        })
      )
    );

    logger.info('Licenses revoked for refunded order', {
      orderId,
      count: licenses.length,
    });

    return licenses;
  },

  async listRefunds(opts: { userId?: string; limit?: number } = {}) {
    return prisma.order.findMany({
      where: {
        status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
        ...(opts.userId ? { userId: opts.userId } : {}),
      },
      orderBy: { refundedAt: 'desc' },
      take: opts.limit ?? 50,
      include: { items: true },
    });
  },
};
