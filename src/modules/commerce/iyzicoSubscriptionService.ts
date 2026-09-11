/**
 * iyzico Subscription Service
 *
 * iyzico'nun recurring API'si bu projede kullanılmıyor; abonelik tek-çekim
 * Checkout Form + DB'de period takibi ile modellendi.
 *
 * - Token, Subscription.stripeSubscriptionId alanına yazılır (INCOMPLETE)
 * - Callback (fulfillIyzicoToken) kaydı ACTIVE yapar
 * - Mock mode: mock_iyzico_sub_ token + GET callback
 */

import { isIyzicoConfigured } from '@/lib/iyzico';
import { getBaseUrl } from '@/lib/seo';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/modules/shared/errors';
import { customerRepository } from './repository';
import { iyzicoService, IYZICO_MOCK_TOKEN_PREFIX } from './iyzicoService';
import type { Plan, PlanInterval } from '@prisma/client';

function centsToString(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function addPlanInterval(from: Date, interval: PlanInterval | string): Date {
  const d = new Date(from);
  switch (interval) {
    case 'YEAR':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'WEEK':
      d.setDate(d.getDate() + 7);
      break;
    case 'DAY':
      d.setDate(d.getDate() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export interface SubscriptionCheckoutInput {
  planSlug: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerIp?: string;
  callbackUrl?: string;
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
   * iyzico üzerinden subscription checkout başlatır ve INCOMPLETE kayıt oluşturur.
   */
  async createSubscriptionCheckout(
    input: SubscriptionCheckoutInput
  ): Promise<SubscriptionCheckoutResult> {
    const plan = await prisma.plan.findUnique({ where: { slug: input.planSlug } });
    if (!plan) throw new NotFoundError('Plan');

    const callbackPath = input.callbackUrl ?? '/api/checkout/iyzico-callback';
    const callbackUrl = callbackPath.startsWith('http')
      ? callbackPath
      : `${getBaseUrl()}${callbackPath.startsWith('/') ? '' : '/'}${callbackPath}`;

    const checkout = await iyzicoService.createCheckout({
      items: [
        {
          id: plan.id,
          name: `${plan.name} - Abonelik`,
          category: 'subscription',
          itemType: 'VIRTUAL',
          price: centsToString(plan.priceCents),
        },
      ],
      totalPrice: centsToString(plan.priceCents),
      paidPrice: centsToString(plan.priceCents),
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerIp: input.customerIp,
      callbackUrl,
      currency: (plan.currency?.toUpperCase() as 'TRY' | 'USD' | 'EUR' | 'GBP') ?? 'TRY',
      basketId: `sub_basket_${Date.now()}`,
      conversationId: `sub_${Date.now()}`,
    });

    if (checkout.status !== 'success') {
      throw new Error(
        `[iyzico subscription] ${checkout.errorCode ?? ''} ${checkout.errorMessage ?? ''}`.trim() ||
          'iyzico abonelik hatası'
      );
    }

    const now = new Date();
    const customer = await customerRepository.getOrCreate({
      email: input.customerEmail,
      name: input.customerName,
    });

    await prisma.subscription.create({
      data: {
        customerId: customer.id,
        planId: plan.id,
        stripeSubscriptionId: checkout.token,
        stripeStatus: 'incomplete',
        status: 'INCOMPLETE',
        currentPeriodStart: now,
        currentPeriodEnd: addPlanInterval(now, plan.interval),
        metadata: {
          provider: 'iyzico',
          planSlug: plan.slug,
          mock: !isIyzicoConfigured(),
        },
      },
    });

    logger.info('[iyzico subscription] checkout initialized', {
      planSlug: plan.slug,
      email: input.customerEmail,
      mock: !isIyzicoConfigured(),
    });

    return {
      url: checkout.paymentPageUrl,
      token: checkout.token,
      planSlug: plan.slug,
      provider: 'iyzico',
      mock: !isIyzicoConfigured() || checkout.token.startsWith(IYZICO_MOCK_TOKEN_PREFIX),
    };
  },
};

export type { Plan };
