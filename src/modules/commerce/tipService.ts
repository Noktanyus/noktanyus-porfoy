/**
 * Tip / Destek checkout — PayTR Direkt API.
 * Order kaydı metadata.type = 'tip' ile tutulur (ürün satırı yok).
 */

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isPaytrConfigured } from '@/lib/paytr';
import { orderRepository } from '@/modules/commerce/repository';
import { paytrService } from '@/modules/commerce/paytrService';
import { ValidationError } from '@/modules/shared/errors';
import { logger } from '@/lib/logger';
import { TIP_PRESETS_TRY } from '@/lib/tipPresets';

export { TIP_PRESETS_TRY };

export const TipCheckoutSchema = z.object({
  amountTry: z.number().int().min(10).max(5000),
  customerEmail: z.string().email(),
  customerName: z.string().min(2).max(120).optional(),
  customerPhone: z.string().min(7).max(20).optional(),
  customerIp: z.string().min(7).max(45).optional(),
  message: z.string().max(500).optional(),
});

export type TipCheckoutInput = z.infer<typeof TipCheckoutSchema>;

function toCents(amountTry: number): number {
  return amountTry * 100;
}

export const tipService = {
  async createCheckout(input: TipCheckoutInput) {
    const amountCents = toCents(input.amountTry);
    const customerName = input.customerName?.trim() || 'Destekci';
    const customerPhone = input.customerPhone?.trim() || '05000000000';
    const customerIp = input.customerIp?.trim() || '127.0.0.1';
    const orderNumber = await orderRepository.generateOrderNumber();

    if (!isPaytrConfigured()) {
      logger.warn('[tip] PayTR yok — mock tip checkout');
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerEmail: input.customerEmail,
          customerName,
          stripeSessionId: `tip_mock_${Date.now()}`,
          status: 'PENDING',
          subtotalCents: amountCents,
          totalCents: amountCents,
          discountCents: 0,
          currency: 'try',
          metadata: {
            type: 'tip',
            message: input.message ?? null,
            mock: true,
            provider: 'paytr',
          },
          notes: input.message ? `Destek notu: ${input.message}` : 'Destek / bahşiş',
        },
      });

      return {
        provider: 'paytr' as const,
        mock: true,
        url: `/odeme/basarili?session_id=${order.stripeSessionId}&order=${order.orderNumber}&tip=1&paytr=mock`,
        sessionId: order.stripeSessionId,
        orderNumber,
      };
    }

    const prepared = paytrService.prepareDirectPayment({
      orderNumber,
      customerEmail: input.customerEmail,
      customerName,
      customerPhone,
      userIp: customerIp,
      totalCents: amountCents,
      basket: [
        {
          name: input.message
            ? `Noktanyus Destek: ${input.message.slice(0, 40)}`
            : 'Noktanyus Destek',
          priceCents: amountCents,
          quantity: 1,
        },
      ],
      okPath: '/odeme/basarili?paytr=1&tip=1',
      failPath: '/odeme/basarisiz?tip=1',
    });

    await prisma.order.create({
      data: {
        orderNumber,
        customerEmail: input.customerEmail,
        customerName,
        stripeSessionId: prepared.merchantOid,
        status: 'PENDING',
        subtotalCents: amountCents,
        totalCents: amountCents,
        discountCents: 0,
        currency: 'try',
        metadata: {
          type: 'tip',
          message: input.message ?? null,
          provider: 'paytr',
        },
        notes: input.message ? `Destek notu: ${input.message}` : 'Destek / bahşiş',
      },
    });

    return {
      ...prepared,
      sessionId: prepared.merchantOid,
      mock: false,
    };
  },
};
