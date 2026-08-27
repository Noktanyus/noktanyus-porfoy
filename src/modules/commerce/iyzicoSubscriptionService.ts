/**
 * iyzico Subscription Service
 *
 * iyzico'nun kendi recurring/subscription API'si sınırlı olduğundan, abonelik
 * akışını tek-çekim PRODUCT üzerinden modelliyoruz. Her periyod için yeni
 * bir checkout session başlatılır ve subscription kaydı DB'de tutulur.
 *
 * Production'da iyzico'nun /subscription/api endpoint'leri entegre edilebilir.
 * Şimdilik:
 *   - Tek-çekim ödeme (iyzico checkoutFormInitialize)
 *   - Plan'a özel basketItems
 *   - Mock mode desteği (env yoksa)
 *
 * Müşteri seçimi:
 *   - .com.tr uzantılı email → iyzico tercih edilir
 *   - Diğer → Stripe veya provider tercihi
 */

import { getIyzico, isIyzicoConfigured } from '@/lib/iyzico';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/modules/shared/errors';
import type { Plan } from '@prisma/client';

function centsToString(cents: number): string {
  return (cents / 100).toFixed(2);
}

function splitName(fullName?: string): { name: string; surname: string } {
  if (!fullName || !fullName.trim()) return { name: 'Ad', surname: 'Soyad' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0]!, surname: 'Soyad' };
  return { name: parts[0]!, surname: parts.slice(1).join(' ') };
}

export interface SubscriptionCheckoutInput {
  planSlug: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerIp?: string;
  callbackUrl: string;
}

export interface SubscriptionCheckoutResult {
  url: string;
  token: string;
  planSlug: string;
  provider: 'iyzico';
  mock: boolean;
}

export const iyzicoSubscriptionService = {
  /**
   * Email .com.tr uzantılı ise iyzico tercih edilir.
   */
  shouldUseIyzico(customerEmail: string): boolean {
    return customerEmail.toLowerCase().endsWith('.com.tr');
  },

  /**
   * iyzico üzerinden subscription checkout başlatır.
   * Mock mode'da sahte token döner (development için).
   */
  async createSubscriptionCheckout(
    input: SubscriptionCheckoutInput
  ): Promise<SubscriptionCheckoutResult> {
    const plan = await prisma.plan.findUnique({ where: { slug: input.planSlug } });
    if (!plan) throw new NotFoundError('Plan');

    const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
    const callbackUrl = `${baseUrl}${input.callbackUrl.startsWith('/') ? '' : '/'}${input.callbackUrl}`;

    if (!isIyzicoConfigured()) {
      logger.warn('[iyzico subscription] Not configured, returning mock URL');
      const mockToken = `mock_iyzico_sub_${Date.now()}`;
      return {
        url: `${baseUrl}/odeme/basarili?mock_iyzico_sub=1&plan=${plan.slug}&token=${mockToken}`,
        token: mockToken,
        planSlug: plan.slug,
        provider: 'iyzico',
        mock: true,
      };
    }

    const iyzico = getIyzico();
    const { name, surname } = splitName(input.customerName);
    const price = centsToString(plan.priceCents);

    const requestBody = {
      locale: 'tr',
      conversationId: `sub_${Date.now()}`,
      price,
      paidPrice: price,
      currency: (plan.currency?.toUpperCase() as 'TRY' | 'USD' | 'EUR' | 'GBP') ?? 'TRY',
      installment: '1',
      paymentChannel: 'WEB',
      paymentGroup: 'SUBSCRIPTION',
      basketId: `sub_basket_${Date.now()}`,
      callbackUrl,
      enabledInstallments: ['1'],
      buyer: {
        id: `buyer_${Buffer.from(input.customerEmail).toString('base64').slice(0, 16)}`,
        name,
        surname,
        gsmNumber: input.customerPhone ?? '+905555555555',
        email: input.customerEmail,
        identityNumber: '11111111111', // Sandbox
        registrationAddress: 'Adres belirtilmedi',
        ip: input.customerIp ?? '127.0.0.1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000',
      },
      billingAddress: {
        contactName: input.customerName ?? 'Müşteri',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Adres belirtilmedi',
        zipCode: '34000',
      },
      basketItems: [
        {
          id: plan.id,
          name: `${plan.name} - Aylık Abonelik`,
          category1: 'subscription',
          itemType: 'VIRTUAL' as const,
          price,
        },
      ],
    };

    const result = await new Promise<{
      status?: string;
      token?: string;
      paymentPageUrl?: string;
      errorCode?: string;
      errorMessage?: string;
    }>((resolve, reject) => {
      // iyzipay SDK callback signature: (err, result)
      (iyzico.checkoutFormInitialize as { create: (b: unknown, cb: (e: unknown, r: unknown) => void) => void })
        .create(requestBody, (err: unknown, r: unknown) => {
          if (err) {
            logger.error('[iyzico subscription] initialize error', { error: err });
            reject(new Error('iyzico abonelik başlatılamadı'));
            return;
          }
          const typed = r as {
            status?: string;
            token?: string;
            paymentPageUrl?: string;
            errorCode?: string;
            errorMessage?: string;
          };
          resolve(typed);
        });
    });

    if (result.status === 'success' && result.token && result.paymentPageUrl) {
      logger.info('[iyzico subscription] checkout initialized', {
        planSlug: plan.slug,
        email: input.customerEmail,
      });
      return {
        url: result.paymentPageUrl,
        token: result.token,
        planSlug: plan.slug,
        provider: 'iyzico',
        mock: false,
      };
    }

    throw new Error(
      `[iyzico subscription] ${result.errorCode ?? ''} ${result.errorMessage ?? ''}`.trim() ||
        'iyzico abonelik hatası'
    );
  },
};

export type { Plan };
