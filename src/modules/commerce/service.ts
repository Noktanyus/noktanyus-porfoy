/**
 * Commerce Module — Service Layer
 *
 * Stripe + iyzico checkout, webhook işleme, lisans aktivasyonu ve commerce iş kuralları.
 */

import { prisma } from '@/lib/prisma';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { isIyzicoConfigured } from '@/lib/iyzico';
import { getBaseUrl } from '@/lib/seo';
import { iyzicoService } from './iyzicoService';
import { addPlanInterval, iyzicoSubscriptionService } from './iyzicoSubscriptionService';
import { couponService } from './couponService';
import { emailService } from '@/lib/emailService';
import {
  planRepository,
  productRepository,
  customerRepository,
  orderRepository,
  licenseRepository,
} from './repository';
import { webhookService } from '@/modules/webhooks';
import { notificationService } from '@/modules/notifications';
import { affiliateService } from '@/modules/affiliate';
import { partnerService } from '@/modules/partners';
import { loyaltyService } from '@/modules/loyalty';
import { NotFoundError, ValidationError } from '@/modules/shared/errors';
import { logger } from '@/lib/logger';
import type { CartItem } from './types';

export type PaymentProvider = 'stripe' | 'iyzico';

export interface ProductCheckoutOptions {
  paymentProvider?: string | null;
  customerName?: string;
  customerPhone?: string;
  customerIp?: string;
  userId?: string | null;
  couponCode?: string | null;
}

export interface SubscriptionCheckoutOptions {
  paymentProvider?: string | null;
  customerName?: string;
  customerPhone?: string;
  customerIp?: string;
  userId?: string | null;
}

/**
 * Ödeme sağlayıcısı seçimi.
 * Öncelik: explicit istek (yapılandırılmışsa) > iyzico (TR) > Stripe > mock (stripe etiketi).
 */
export function selectPaymentProvider(requested?: string | null): PaymentProvider {
  const req = (requested ?? '').toLowerCase();

  if (req === 'iyzico') return 'iyzico';
  if (req === 'stripe') return 'stripe';

  if (isIyzicoConfigured()) return 'iyzico';
  if (isStripeConfigured()) return 'stripe';

  return 'stripe';
}

function resolveStoredProvider(requested: PaymentProvider): 'stripe' | 'iyzico' | 'mock' {
  if (requested === 'stripe' && !isStripeConfigured()) return 'mock';
  if (requested === 'iyzico' && !isIyzicoConfigured()) return 'mock';
  return requested;
}

function centsToIyzicoString(cents: number): string {
  return (cents / 100).toFixed(2);
}

interface OrderWithItems {
  id: string;
  orderNumber: string;
  customerEmail: string;
  items: Array<{ productId: string; quantity: number }>;
  [k: string]: unknown;
}

export const commerceService = {
  // --- Products ---
  async listProducts(opts?: { skip?: number; take?: number; category?: string }) {
    return productRepository.findActive(opts);
  },

  async getProduct(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw new NotFoundError('Ürün');
    return product;
  },

  // --- Plans ---
  async listPlans() {
    return planRepository.findActive();
  },

  async getPlan(slug: string) {
    const plan = await planRepository.findBySlug(slug);
    if (!plan) throw new NotFoundError('Plan');
    return plan;
  },

  // --- Checkout: one-time product ---
  async createProductCheckout(
    items: CartItem[],
    customerEmail: string,
    options?: ProductCheckoutOptions
  ) {
    if (!items.length) throw new ValidationError('Sepet boş');

    const uniqueIds = [...new Set(items.map((i) => i.productId))];
    const products = await Promise.all(uniqueIds.map((id) => productRepository.findById(id)));
    const productById = new Map(
      products
        .filter((p): p is NonNullable<(typeof products)[number]> => p != null && p.active === true)
        .map((p) => [p.id, p])
    );
    if (productById.size !== uniqueIds.length) {
      throw new ValidationError('Bazı ürünler artık mevcut değil');
    }

    const pricedItems = items.map((item) => {
      const product = productById.get(item.productId)!;
      const unitPriceCents = product.priceCents;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents,
        totalCents: unitPriceCents * item.quantity,
        product,
      };
    });

    const subtotal = pricedItems.reduce((sum, i) => sum + i.totalCents, 0);
    let discountCents = 0;
    let couponId: string | null = null;

    if (options?.couponCode) {
      const couponResult = await couponService.validate({
        code: options.couponCode,
        customerEmail,
        subtotalCents: subtotal,
        productIds: uniqueIds,
      });
      if (!couponResult.valid) {
        throw new ValidationError(couponResult.reason ?? 'Kupon geçersiz');
      }
      discountCents = couponResult.discountCents;
      couponId = couponResult.coupon?.id ?? null;
    }

    const totalCents = Math.max(0, subtotal - discountCents);
    const provider = selectPaymentProvider(options?.paymentProvider);
    const storedProvider = resolveStoredProvider(provider);
    const baseUrl = getBaseUrl();

    const persistOrder = async (sessionId: string) => {
      const order = await prisma.order.create({
        data: {
          orderNumber: await orderRepository.generateOrderNumber(),
          customerEmail,
          customerName: options?.customerName,
          userId: options?.userId ?? undefined,
          stripeSessionId: sessionId,
          paymentProvider: storedProvider,
          status: 'PENDING',
          subtotalCents: subtotal,
          discountCents,
          couponId,
          totalCents,
          currency: 'try',
          items: {
            create: pricedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              totalCents: item.totalCents,
              productTitle: item.product.title,
              productSlug: item.product.slug,
            })),
          },
        },
      });

      if (couponId) {
        try {
          await couponService.redeem(couponId, customerEmail, order.id, discountCents);
        } catch (err) {
          logger.warn('Coupon redeem failed after order create', { orderId: order.id, error: err });
        }
      }

      return order;
    };

    // --- Mock (hiçbir canlı provider yok) ---
    if (provider === 'stripe' && !isStripeConfigured()) {
      logger.warn('Stripe not configured, completing mock product checkout');
      const sessionId = `mock_${Date.now()}`;
      const order = await persistOrder(sessionId);
      await this.handleCheckoutCompleted({ id: sessionId, payment_intent: `mock_pi_${order.id}` });
      return {
        url: `/odeme/basarili?session_id=${sessionId}&order=${order.orderNumber}`,
        sessionId,
        provider: 'stripe' as PaymentProvider,
        mock: true,
      };
    }

    // --- iyzico ---
    if (provider === 'iyzico') {
      const paidPrice = centsToIyzicoString(totalCents);
      const checkout = await iyzicoService.createCheckout({
        items: pricedItems.map((item) => ({
          id: item.productId,
          name: item.product.title,
          category: item.product.category ?? 'general',
          itemType: 'VIRTUAL',
          // iyzico: sepet satırlarının toplamı price/paidPrice ile eşit olmalı
          price: centsToIyzicoString(item.totalCents),
        })),
        totalPrice: centsToIyzicoString(subtotal),
        paidPrice,
        customerEmail,
        customerName: options?.customerName,
        customerPhone: options?.customerPhone,
        customerIp: options?.customerIp,
        callbackUrl: `${baseUrl}/api/checkout/iyzico-callback`,
        currency: 'TRY',
      });

      if (checkout.status !== 'success') {
        throw new Error(
          `[iyzico] checkout başlatılamadı: ${checkout.errorCode ?? ''} ${checkout.errorMessage ?? ''}`.trim()
        );
      }

      await persistOrder(checkout.token);

      return {
        url: checkout.paymentPageUrl,
        sessionId: checkout.token,
        provider: 'iyzico' as PaymentProvider,
        mock: storedProvider === 'mock',
      };
    }

    // --- Stripe ---
    const stripeLineItems = pricedItems.map((item, idx, arr) => {
      let unitAmount = item.unitPriceCents;
      if (discountCents > 0 && idx === arr.length - 1 && item.quantity > 0) {
        const lineTotal = item.unitPriceCents * item.quantity;
        const afterDiscount = Math.max(0, lineTotal - discountCents);
        unitAmount = Math.round(afterDiscount / item.quantity);
      }
      return {
        price_data: {
          currency: 'try',
          product_data: {
            name: item.product.title,
            description: item.product.shortDescription,
            ...(item.product.thumbnail ? { images: [item.product.thumbnail] } : {}),
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: stripeLineItems,
      customer_email: customerEmail,
      success_url: `${baseUrl}/odeme/basarili?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/magaza`,
      metadata: {
        customerEmail,
        productIds: uniqueIds.join(','),
        ...(couponId ? { couponId } : {}),
      },
    });

    await persistOrder(session.id);

    return {
      url: session.url!,
      sessionId: session.id,
      provider: 'stripe' as PaymentProvider,
    };
  },

  // --- Checkout: subscription plan ---
  async createSubscriptionCheckout(
    planSlug: string,
    customerEmail: string,
    options?: SubscriptionCheckoutOptions
  ) {
    const plan = await planRepository.findBySlug(planSlug);
    if (!plan) throw new NotFoundError('Plan');
    if (!plan.active) throw new ValidationError('Plan satışta değil');

    const provider = selectPaymentProvider(options?.paymentProvider);
    const baseUrl = getBaseUrl();

    const useIyzico =
      provider === 'iyzico' ||
      (iyzicoSubscriptionService.shouldUseIyzico(customerEmail) && isIyzicoConfigured());

    if (useIyzico) {
      const checkout = await iyzicoSubscriptionService.createSubscriptionCheckout({
        planSlug: plan.slug,
        customerEmail,
        customerName: options?.customerName,
        customerPhone: options?.customerPhone,
        customerIp: options?.customerIp,
        callbackUrl: '/api/checkout/iyzico-callback',
      });

      return {
        url: checkout.url,
        sessionId: checkout.token,
        provider: 'iyzico' as PaymentProvider,
        mock: checkout.mock,
      };
    }

    if (!isStripeConfigured()) {
      logger.warn('Stripe not configured, returning mock subscription URL');
      return {
        url: `/odeme/basarili?mock_sub=1&plan=${planSlug}`,
        sessionId: 'mock',
        provider: 'stripe' as PaymentProvider,
        mock: true,
      };
    }

    if (!plan.stripePriceId) {
      throw new ValidationError('Plan için Stripe fiyatı tanımlı değil');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: `${baseUrl}/odeme/basarili?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/fiyatlandirma`,
      metadata: { planSlug, customerEmail, userId: options?.userId ?? '' },
    });

    return { url: session.url!, sessionId: session.id, provider: 'stripe' as PaymentProvider };
  },

  // --- Customer portal ---
  async createPortalSession(customerEmail: string) {
    if (!isStripeConfigured()) {
      return { url: '/dashboard' };
    }

    const customer = await prisma.customer.findUnique({ where: { email: customerEmail } });
    if (!customer?.stripeCustomerId) {
      throw new NotFoundError('Müşteri kaydı bulunamadı');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${getBaseUrl()}/dashboard`,
    });

    return { url: session.url };
  },

  // --- License generation (after successful payment) ---
  async generateLicenseForOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundError('Sipariş');

    const customer = await customerRepository.getOrCreate({ email: order.customerEmail });
    if (!order.customerId) {
      await prisma.order.update({
        where: { id: order.id },
        data: { customerId: customer.id },
      });
    }

    const licenses = [];
    for (const item of order.items) {
      const key = await licenseRepository.generateKey();
      const license = await licenseRepository.create({
        key,
        customerId: customer.id,
        productId: item.productId,
        orderId: order.id,
        type: 'ONE_TIME',
        status: 'active',
      });
      licenses.push(license);
    }

    return licenses;
  },

  // --- Webhook signature verification ---
  verifyWebhook(payload: string, signature: string) {
    if (!isStripeConfigured()) {
      throw new Error('Stripe not configured');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET not set');
    }
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  },

  // --- Process webhook event (idempotent) ---
  async processWebhookEvent(event: { id: string; type: string; data: { object: unknown } }) {
    const existing = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (existing?.success) {
      logger.info('Webhook event already processed', { eventId: event.id });
      return;
    }

    if (!existing) {
      await prisma.webhookEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
          payload: event.data.object as unknown as object,
          success: false,
        },
      });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as {
            id: string;
            payment_intent?: string;
            customer?: string;
            customer_email?: string;
            mode?: string;
            metadata?: Record<string, string>;
          };
          if (session.mode === 'subscription' && session.customer) {
            await this.linkStripeCustomer(
              session.customer_email ?? session.metadata?.customerEmail,
              session.customer
            );
          } else {
            await this.handleCheckoutCompleted(session);
          }
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Record<string, unknown>;
          await this.handleSubscriptionChange(subscription);
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Record<string, unknown>;
          await this.handleSubscriptionCancel(subscription);
          break;
        }
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Record<string, unknown>;
          await this.handleInvoicePayment(invoice);
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as Record<string, unknown>;
          await this.handleRefund(charge);
          break;
        }
        default:
          logger.info('Unhandled Stripe webhook type', { type: event.type, eventId: event.id });
      }

      await prisma.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: { success: true, error: null },
      });
    } catch (err) {
      logger.error('Webhook handler error', { eventId: event.id, type: event.type, error: err });
      await prisma.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: { success: false, error: String(err) },
      });
      throw err;
    }
  },

  async linkStripeCustomer(email: string | undefined, stripeCustomerId: string) {
    if (!email) return;
    await customerRepository.getOrCreate({ email, stripeCustomerId });
  },

  async handleCheckoutCompleted(session: { id: string; payment_intent?: string }) {
    const order = await orderRepository.findByStripeSession(session.id);
    if (!order || order.status === 'PAID' || order.status === 'REFUNDED') return;

    let userId = order.userId;
    if (!userId) {
      const user = await prisma.user.findUnique({
        where: { email: order.customerEmail },
        select: { id: true },
      });
      userId = user?.id ?? null;
    }

    await orderRepository.update(order.id, {
      status: 'PAID',
      stripePaymentIntent: session.payment_intent,
      deliveredAt: new Date(),
      ...(userId && !order.userId ? { userId } : {}),
    });

    const licenses = await this.generateLicenseForOrder(order.id);

    try {
      await emailService.sendReceipt({
        customerName: order.customer?.name ?? undefined,
        customerEmail: order.customerEmail,
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          title: item.productTitle,
          quantity: item.quantity,
          priceCents: item.unitPriceCents,
        })),
        totalCents: order.totalCents,
        currency: order.currency,
        licenses: licenses.map((lic) => ({
          key: lic.key,
          productTitle:
            order.items.find((i) => i.productId === lic.productId)?.productTitle ?? 'Ürün',
        })),
      });
    } catch (err) {
      logger.error('Receipt email send failed in handleCheckoutCompleted', {
        error: err,
        orderId: order.id,
      });
    }

    logger.info('Order completed', { orderId: order.id, orderNumber: order.orderNumber });

    try {
      await webhookService.dispatchEvent('order.paid', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        currency: order.currency,
        customerEmail: order.customerEmail,
      });
    } catch (err) {
      logger.warn('Webhook dispatch (order.paid) failed', {
        orderId: order.id,
        error: err,
      });
    }

    await notificationService.dispatch(userId, 'order.paid', {
      title: 'Siparişiniz Tamamlandı',
      message: `#${order.orderNumber} numaralı siparişiniz başarıyla tamamlandı.`,
      link: `/dashboard/orders`,
      icon: '🛒',
      relatedType: 'Order',
      relatedId: order.id,
    });

    try {
      await affiliateService.trackConversion(order.id);
    } catch (err) {
      logger.warn('Affiliate trackConversion failed', { orderId: order.id, error: err });
    }

    if (userId) {
      try {
        await loyaltyService.onPurchase(order.id, userId, order.totalCents);
      } catch (err) {
        logger.warn('Loyalty onPurchase failed', { orderId: order.id, error: err });
      }
    }

    try {
      await partnerService.markLeadConverted({
        customerEmail: order.customerEmail,
        orderId: order.id,
        orderAmountCents: order.totalCents,
      });
    } catch (err) {
      logger.warn('Partner markLeadConverted failed', { orderId: order.id, error: err });
    }
  },

  async activateIyzicoSubscription(
    subscriptionId: string,
    extras?: { paymentTransactionId?: string }
  ) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { customer: true, plan: true },
    });
    if (!subscription) throw new NotFoundError('Abonelik');
    if (subscription.status === 'ACTIVE') return subscription;

    const now = new Date();
    const periodEnd = addPlanInterval(now, subscription.plan.interval);

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        stripeStatus: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        metadata: {
          ...((subscription.metadata as Record<string, unknown> | null) ?? {}),
          provider: 'iyzico',
          ...(extras?.paymentTransactionId
            ? { paymentTransactionId: extras.paymentTransactionId }
            : {}),
        },
      },
    });

    await this.syncUserSubscription({
      userId: subscription.customer.userId,
      email: subscription.customer.email,
      planSlug: subscription.plan.slug,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      expiresAt: periodEnd,
      status: 'active',
    });

    return updated;
  },

  async syncUserSubscription(input: {
    userId?: string | null;
    email: string;
    planSlug: string;
    stripeSubscriptionId: string;
    expiresAt: Date;
    status: string;
  }) {
    let userId = input.userId ?? null;
    if (!userId) {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      userId = user?.id ?? null;
    }
    if (!userId) return;

    await prisma.userSubscription.upsert({
      where: { stripeSubscriptionId: input.stripeSubscriptionId },
      create: {
        userId,
        planSlug: input.planSlug,
        status: input.status,
        expiresAt: input.expiresAt,
        stripeSubscriptionId: input.stripeSubscriptionId,
        autoRenew: true,
      },
      update: {
        status: input.status,
        expiresAt: input.expiresAt,
        planSlug: input.planSlug,
      },
    });
  },

  async handleSubscriptionChange(sub: Record<string, unknown>) {
    const customerId = sub.customer as string;
    const subId = sub.id as string;
    const status = sub.status as string;
    const cps = sub.current_period_start as number;
    const cpe = sub.current_period_end as number;
    const cape = sub.cancel_at_period_end as boolean;
    const items = sub.items as { data: Array<{ price: { id: string } }> };

    const customer = await customerRepository.findByStripeId(customerId);
    if (!customer) {
      logger.warn('Subscription event for unknown customer', { stripeCustomerId: customerId });
      return;
    }

    const priceId = items?.data?.[0]?.price?.id;
    if (!priceId) {
      logger.warn('Subscription event missing price', { subId });
      return;
    }

    const plan = await planRepository.findByStripePriceId(priceId);
    if (!plan) {
      logger.warn('Subscription event for unknown price', { priceId });
      return;
    }

    const trialStart = sub.trial_start ? new Date((sub.trial_start as number) * 1000) : null;
    const trialEnd = sub.trial_end ? new Date((sub.trial_end as number) * 1000) : null;
    const mappedStatus = status.toUpperCase() as
      | 'ACTIVE'
      | 'TRIALING'
      | 'PAST_DUE'
      | 'CANCELED'
      | 'INCOMPLETE'
      | 'INCOMPLETE_EXPIRED'
      | 'UNPAID'
      | 'PAUSED';

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subId },
      create: {
        customerId: customer.id,
        planId: plan.id,
        stripeSubscriptionId: subId,
        stripeStatus: status,
        status: mappedStatus,
        currentPeriodStart: new Date(cps * 1000),
        currentPeriodEnd: new Date(cpe * 1000),
        cancelAtPeriodEnd: cape,
        trialStart,
        trialEnd,
      },
      update: {
        stripeStatus: status,
        status: mappedStatus,
        currentPeriodStart: new Date(cps * 1000),
        currentPeriodEnd: new Date(cpe * 1000),
        cancelAtPeriodEnd: cape,
      },
    });

    await this.syncUserSubscription({
      userId: customer.userId,
      email: customer.email,
      planSlug: plan.slug,
      stripeSubscriptionId: subId,
      expiresAt: new Date(cpe * 1000),
      status: status === 'active' || status === 'trialing' ? 'active' : status,
    });
  },

  async handleInvoicePayment(invoice: Record<string, unknown>) {
    const stripeSubId = invoice.subscription as string | undefined;
    if (!stripeSubId) return;
    const periodUnix = invoice.period_end as number | undefined;
    if (!periodUnix) return;

    const expiresAt = new Date(periodUnix * 1000);
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: stripeSubId },
      data: { currentPeriodEnd: expiresAt, stripeStatus: 'active', status: 'ACTIVE' },
    });
    await prisma.userSubscription.updateMany({
      where: { stripeSubscriptionId: stripeSubId },
      data: { expiresAt, status: 'active' },
    });
  },

  async handleSubscriptionCancel(sub: Record<string, unknown>) {
    const subId = sub.id as string;
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subId },
      data: { status: 'CANCELED', canceledAt: new Date() },
    });
    await prisma.userSubscription.updateMany({
      where: { stripeSubscriptionId: subId },
      data: { status: 'cancelled', autoRenew: false },
    });
  },

  async handleRefund(charge: Record<string, unknown>) {
    const paymentIntent = charge.payment_intent as string | undefined;
    if (!paymentIntent) return;
    const order = await prisma.order.findFirst({
      where: { stripePaymentIntent: paymentIntent },
    });
    if (!order) return;

    const amountRefunded = charge.amount_refunded as number;
    const amount = charge.amount as number;
    await orderRepository.update(order.id, {
      status: amountRefunded === amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      refundedAt: new Date(),
    });
  },

  // --- License activation ---
  async activateLicense(licenseKey: string, domain: string, ip: string) {
    return licenseRepository.activate(licenseKey, domain, ip);
  },
};