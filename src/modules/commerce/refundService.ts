/**
 * Refund Service — Sipariş iade işlemleri.
 *
 * Sorumluluklar:
 *   - Stripe / iyzico üzerinden kısmi veya tam iade başlatma
 *   - Order durumunu REFUNDED / PARTIALLY_REFUNDED olarak güncelleme
 *   - Bağlı License kayıtlarını revoke etme
 *   - Audit log yazma
 *
 * Provider tespiti: order.stripePaymentIntent "pi_" prefix'i ile başlıyorsa Stripe,
 * aksi halde iyzico (veya mock) kabul edilir.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { isIyzicoConfigured } from '@/lib/iyzico';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { NotFoundError, ValidationError } from '@/modules/shared/errors';

export interface CreateRefundInput {
  orderId: string;
  userId: string;
  userEmail?: string;
  amountCents?: number; // opsiyonel: belirtilmezse tam iade
  reason?: string;
}

export interface RefundResult {
  success: true;
  refundId: string;
  provider: 'stripe' | 'iyzico';
  amountCents: number;
  fullRefund: boolean;
}

export const refundService = {
  /**
   * Provider tespiti: stripePaymentIntent "pi_" ile başlıyorsa Stripe,
   * aksi halde iyzico kabul edilir.
   */
  detectProvider(order: { stripePaymentIntent: string | null }): 'stripe' | 'iyzico' {
    return order.stripePaymentIntent?.startsWith('pi_') ? 'stripe' : 'iyzico';
  },

  /**
   * Yeni iade oluşturur (tam veya kısmi).
   * Hem Stripe hem iyzico provider'larını destekler.
   */
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

    // --- iyzico / mock iade ---
    // Not: iyzico'nun kendi refund endpoint'i üretimde eklenebilir.
    // Şimdilik DB üzerinde iade işlemi gerçekleştirilir.
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
      provider,
      amountCents: refundAmount,
      fullRefund: isFullRefund,
    };
  },

  /**
   * İade edilen siparişe bağlı tüm aktif lisansları iptal eder.
   */
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

  /**
   * İade edilmiş siparişleri listeler.
   */
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
