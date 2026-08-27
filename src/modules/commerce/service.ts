/**
 * Commerce Module — Service Layer
 *
 * Stripe + iyzico checkout, webhook işleme, lisans aktivasyonu ve commerce iş kuralları.
 */

import { prisma } from '@/lib/prisma';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { isIyzicoConfigured } from '@/lib/iyzico';
import { iyzicoService } from './iyzicoService';
import { iyzicoSubscriptionService } from './iyzicoSubscriptionService';
import { emailService } from '@/lib/emailService';
import {
  planRepository,
  productRepository,
  customerRepository,
  orderRepository,
  licenseRepository,
} from './repository';
import { webhookService } from '@/modules/webhooks';
import { NotFoundError, ValidationError } from '@/modules/shared/errors';
import { logger } from '@/lib/logger';
import type { CartItem } from './types';

export type PaymentProvider = 'stripe' | 'iyzico';

/**
 * Ödeme sağlayıcısı seçimi.
 * Öncelik: explicit istek > iyzico (TR için) > Stripe > fallback (ilk yapılandırılmış olan).
 */
export function selectPaymentProvider(requested?: string | null): PaymentProvider {
  const req = (requested ?? '').toLowerCase();

  if (req === 'iyzico' && isIyzicoConfigured()) return 'iyzico';
  if (req === 'stripe' && isStripeConfigured()) return 'stripe';

  // Default: iyzico tercih edilir (TR pazarı), Stripe yoksa
  if (isIyzicoConfigured()) return 'iyzico';
  if (isStripeConfigured()) return 'stripe';

  // Hiçbiri yapılandırılmamışsa stripe default kalsın (mock mode)
  return 'stripe';
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
    options?: { paymentProvider?: string | null; customerName?: string; customerPhone?: string; customerIp?: string }
  ) {
    if (!items.length) throw new ValidationError('Sepet boş');

    // Validate products
    const productIds = items.map((i) => i.productId);
    const products = await Promise.all(productIds.map((id) => productRepository.findById(id)));
    const validProducts = products.filter((p): p is NonNullable<typeof p> => Boolean(p));
    if (validProducts.length !== items.length) {
      throw new ValidationError('Bazı ürünler artık mevcut değil');
    }

    const subtotal = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
    const provider = selectPaymentProvider(options?.paymentProvider);

    // --- Mock mode (hiçbir provider yapılandırılmamışsa) ---
    if (provider === 'stripe' && !isStripeConfigured()) {
      logger.warn('Stripe not configured, returning mock checkout URL');
      const order = await prisma.order.create({
        data: {
          orderNumber: await orderRepository.generateOrderNumber(),
          customerEmail,
          stripeSessionId: `mock_${Date.now()}`,
          status: 'PENDING',
          subtotalCents: subtotal,
          totalCents: subtotal,
          currency: 'try',
          items: {
            create: items.map((item) => {
              const product = validProducts.find((p) => p.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPriceCents: item.priceCents,
                totalCents: item.priceCents * item.quantity,
                productTitle: product.title,
                productSlug: product.slug,
              };
            }),
          },
        },
      });

      return {
        url: `/odeme/basarili?session_id=mock_${order.id}&order=${order.orderNumber}`,
        sessionId: order.stripeSessionId,
        provider: 'stripe' as PaymentProvider,
      };
    }

    // --- iyzico akışı ---
    if (provider === 'iyzico') {
      const totalPrice = centsToIyzicoString(subtotal);
      const checkout = await iyzicoService.createCheckout({
        items: items.map((item) => {
          const product = validProducts.find((p) => p.id === item.productId)!;
          return {
            id: item.productId,
            name: product.title,
            category: product.category ?? 'general',
            itemType: 'VIRTUAL',
            price: centsToIyzicoString(item.priceCents),
          };
        }),
        totalPrice,
        paidPrice: totalPrice,
        customerEmail,
        customerName: options?.customerName,
        customerPhone: options?.customerPhone,
        customerIp: options?.customerIp,
        callbackUrl: `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/odeme/iyzico-callback`,
        currency: 'TRY',
      });

      if (checkout.status !== 'success') {
        throw new Error(
          `[iyzico] checkout başlatılamadı: ${checkout.errorCode ?? ''} ${checkout.errorMessage ?? ''}`.trim()
        );
      }

      await prisma.order.create({
        data: {
          orderNumber: await orderRepository.generateOrderNumber(),
          customerEmail,
          stripeSessionId: checkout.token, // token'ı bu alanda tutuyoruz
          status: 'PENDING',
          subtotalCents: subtotal,
          totalCents: subtotal,
          currency: 'try',
          items: {
            create: items.map((item) => {
              const product = validProducts.find((p) => p.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPriceCents: item.priceCents,
                totalCents: item.priceCents * item.quantity,
                productTitle: product.title,
                productSlug: product.slug,
              };
            }),
          },
        },
      });

      return {
        url: checkout.paymentPageUrl,
        sessionId: checkout.token,
        provider: 'iyzico' as PaymentProvider,
      };
    }

    // --- Stripe akışı ---
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map((item) => {
        const product = validProducts.find((p) => p.id === item.productId)!;
        return {
          price_data: {
            currency: 'try',
            product_data: {
              name: product.title,
              description: product.shortDescription,
              ...(product.thumbnail ? { images: [product.thumbnail] } : {}),
            },
            unit_amount: item.priceCents,
          },
          quantity: item.quantity,
        };
      }),
      customer_email: customerEmail,
      success_url: `${process.env.NEXTAUTH_URL}/odeme/basarili?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/magaza`,
      metadata: {
        customerEmail,
        productIds: items.map((i) => i.productId).join(','),
      },
    });

    // Create pending order with items snapshot
    await prisma.order.create({
      data: {
        orderNumber: await orderRepository.generateOrderNumber(),
        customerEmail,
        stripeSessionId: session.id,
        status: 'PENDING',
        subtotalCents: subtotal,
        totalCents: subtotal,
        currency: 'try',
        items: {
          create: items.map((item) => {
            const product = validProducts.find((p) => p.id === item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: item.priceCents,
              totalCents: item.priceCents * item.quantity,
              productTitle: product.title,
              productSlug: product.slug,
            };
          }),
        },
      },
    });

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
    options?: { paymentProvider?: string | null; customerName?: string; customerPhone?: string; customerIp?: string }
  ) {
    const plan = await planRepository.findBySlug(planSlug);
    if (!plan) throw new NotFoundError('Plan');

    const provider = selectPaymentProvider(options?.paymentProvider);

    // --- iyzico subscription ---
    // Email .com.tr uzantılı ise veya explicit iyzico istendiyse iyzico subscription akışı
    if (
      provider === 'iyzico' ||
      (iyzicoSubscriptionService.shouldUseIyzico(customerEmail) && isIyzicoConfigured())
    ) {
      const checkout = await iyzicoSubscriptionService.createSubscriptionCheckout({
        planSlug: plan.slug,
        customerEmail,
        customerName: options?.customerName,
        customerPhone: options?.customerPhone,
        customerIp: options?.customerIp,
        callbackUrl: '/odeme/iyzico-callback',
      });

      return {
        url: checkout.url,
        sessionId: checkout.token,
        provider: 'iyzico' as PaymentProvider,
        mock: checkout.mock,
      };
    }

    // --- Stripe akışı (veya mock) ---
    if (!isStripeConfigured()) {
      logger.warn('Stripe not configured, returning mock subscription URL');
      return {
        url: `/odeme/basarili?mock_sub=1&plan=${planSlug}`,
        sessionId: 'mock',
        provider: 'stripe' as PaymentProvider,
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: `${process.env.NEXTAUTH_URL}/odeme/basarili?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/fiyatlandirma`,
      metadata: { planSlug, customerEmail },
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
      return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
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
    // Idempotency check
    const existing = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (existing) {
      logger.info('Webhook event already processed', { eventId: event.id });
      return;
    }

    // Save event first
    await prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        payload: event.data.object as unknown as object,
      },
    });

    // Handle specific events
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as { id: string; payment_intent?: string };
          await this.handleCheckoutCompleted(session);
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
        case 'charge.refunded': {
          const charge = event.data.object as Record<string, unknown>;
          await this.handleRefund(charge);
          break;
        }
      }
    } catch (err) {
      logger.error('Webhook handler error', { eventId: event.id, type: event.type, error: err });
      await prisma.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: { success: false, error: String(err) },
      });
      throw err;
    }
  },

  async handleCheckoutCompleted(session: { id: string; payment_intent?: string }) {
    const order = await orderRepository.findByStripeSession(session.id);
    if (!order || order.status === 'PAID') return;

    await orderRepository.update(order.id, {
      status: 'PAID',
      stripePaymentIntent: session.payment_intent,
      deliveredAt: new Date(),
    });

    // Generate licenses for digital products
    const licenses = await this.generateLicenseForOrder(order.id);

    // Send receipt email to customer (with license keys if any)
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

    // Dispatch webhook event (best-effort, internal hata yakalanır)
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

    const plan = await planRepository.findByStripePriceId(items.data[0].price.id);
    if (!plan) {
      logger.warn('Subscription event for unknown price', { priceId: items.data[0].price.id });
      return;
    }

    const trialStart = sub.trial_start ? new Date((sub.trial_start as number) * 1000) : null;
    const trialEnd = sub.trial_end ? new Date((sub.trial_end as number) * 1000) : null;

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subId },
      create: {
        customerId: customer.id,
        planId: plan.id,
        stripeSubscriptionId: subId,
        stripeStatus: status,
        status: status.toUpperCase() as
          | 'ACTIVE'
          | 'TRIALING'
          | 'PAST_DUE'
          | 'CANCELED'
          | 'INCOMPLETE'
          | 'INCOMPLETE_EXPIRED'
          | 'UNPAID'
          | 'PAUSED',
        currentPeriodStart: new Date(cps * 1000),
        currentPeriodEnd: new Date(cpe * 1000),
        cancelAtPeriodEnd: cape,
        trialStart,
        trialEnd,
      },
      update: {
        stripeStatus: status,
        status: status.toUpperCase() as
          | 'ACTIVE'
          | 'TRIALING'
          | 'PAST_DUE'
          | 'CANCELED'
          | 'INCOMPLETE'
          | 'INCOMPLETE_EXPIRED'
          | 'UNPAID'
          | 'PAUSED',
        currentPeriodStart: new Date(cps * 1000),
        currentPeriodEnd: new Date(cpe * 1000),
        cancelAtPeriodEnd: cape,
      },
    });
  },

  async handleSubscriptionCancel(sub: Record<string, unknown>) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: sub.id as string },
      data: { status: 'CANCELED', canceledAt: new Date() },
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