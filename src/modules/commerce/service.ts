/**
 * Commerce Module — Service Layer
 *
 * PayTR Direkt API (TR birincil) + legacy Stripe/iyzico fallback,
 * webhook işleme, lisans aktivasyonu ve commerce iş kuralları.
 */

import { prisma } from '@/lib/prisma';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { isIyzicoConfigured, IYZICO_DIGITAL_ITEM_TYPE } from '@/lib/iyzico';
import { isPaytrConfigured } from '@/lib/paytr';
import { iyzicoService } from './iyzicoService';
import { iyzicoSubscriptionService } from './iyzicoSubscriptionService';
import { paytrService } from './paytrService';
import {
  planRepository,
  productRepository,
  customerRepository,
  orderRepository,
  licenseRepository,
} from './repository';
import { queueService } from '@/lib/queueService';
import {
  subscriptionSyncService,
  normalizeStripeSubscription,
  fromStripeEpoch,
} from './subscriptionSync';
import { NotFoundError, ValidationError } from '@/modules/shared/errors';
import { logger } from '@/lib/logger';
import type { CartItem } from './types';
import { couponService } from './couponService';

export type PaymentProvider = 'paytr' | 'stripe' | 'iyzico';

/**
 * Ödeme sağlayıcısı seçimi.
 * Türkiye için PayTR birincil. Stripe/iyzico yalnızca PayTR yoksa (geçiş/test).
 */
export function selectPaymentProvider(requested?: string | null): PaymentProvider {
  const req = (requested ?? '').toLowerCase();

  // PayTR her zaman öncelikli (TR)
  if (isPaytrConfigured()) return 'paytr';
  if (req === 'paytr') return 'paytr';

  if (req === 'iyzico' && isIyzicoConfigured()) return 'iyzico';
  if (req === 'stripe' && isStripeConfigured()) return 'stripe';

  if (isIyzicoConfigured()) return 'iyzico';
  if (isStripeConfigured()) return 'stripe';

  // Yapılandırma yoksa mock (paytr path)
  return 'paytr';
}

function centsToIyzicoString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** PayTR abonelik dönemi bitiş tarihi. */
function addPlanInterval(from: Date, interval: string): Date {
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
    case 'MONTH':
    default:
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d;
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
    options?: {
      paymentProvider?: string | null;
      customerName?: string;
      customerPhone?: string;
      customerIp?: string;
      customerAddress?: string;
      couponCode?: string | null;
    }
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

    let discountCents = 0;
    let couponId: string | undefined;
    if (options?.couponCode) {
      const couponResult = await couponService.validate({
        code: options.couponCode,
        customerEmail,
        subtotalCents: subtotal,
        productIds,
      });
      if (!couponResult.valid || !couponResult.coupon) {
        throw new ValidationError(couponResult.reason ?? 'Kupon geçersiz');
      }
      discountCents = couponResult.discountCents;
      couponId = couponResult.coupon.id;
    }

    const totalCents = Math.max(0, subtotal - discountCents);
    const provider = selectPaymentProvider(options?.paymentProvider);
    const customerName = options?.customerName?.trim() || 'Musteri';
    const customerPhone = options?.customerPhone?.trim() || '05000000000';
    const customerIp = options?.customerIp?.trim() || '127.0.0.1';

    // --- PayTR Direkt API (TR birincil) ---
    if (provider === 'paytr') {
      if (!isPaytrConfigured()) {
        logger.warn('[PayTR] Yapılandırılmamış — mock checkout');
        const orderNumber = await orderRepository.generateOrderNumber();
        const order = await prisma.order.create({
          data: {
            orderNumber,
            customerEmail,
            customerName,
            stripeSessionId: `paytr_mock_${Date.now()}`,
            status: 'PENDING',
            subtotalCents: subtotal,
            discountCents,
            totalCents,
            currency: 'try',
            ...(couponId ? { couponId } : {}),
            metadata: { provider: 'paytr', mock: true },
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
        if (couponId) {
          try {
            await couponService.redeem(couponId, customerEmail, order.id, discountCents);
          } catch (err) {
            logger.warn('[coupon] paytr mock redeem failed', { err });
          }
        }
        return {
          provider: 'paytr' as PaymentProvider,
          mock: true,
          url: `/odeme/basarili?session_id=${order.stripeSessionId}&order=${order.orderNumber}&paytr=mock`,
          sessionId: order.stripeSessionId,
          orderNumber,
        };
      }

      const orderNumber = await orderRepository.generateOrderNumber();
      const prepared = paytrService.prepareDirectPayment({
        orderNumber,
        customerEmail,
        customerName,
        customerPhone,
        customerAddress: options?.customerAddress,
        userIp: customerIp,
        totalCents,
        basket: items.map((item) => {
          const product = validProducts.find((p) => p.id === item.productId)!;
          return {
            name: product.title,
            priceCents: item.priceCents,
            quantity: item.quantity,
          };
        }),
      });

      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerEmail,
          customerName,
          stripeSessionId: prepared.merchantOid,
          status: 'PENDING',
          subtotalCents: subtotal,
          discountCents,
          totalCents,
          currency: 'try',
          ...(couponId ? { couponId } : {}),
          metadata: { provider: 'paytr' },
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

      if (couponId) {
        try {
          await couponService.redeem(couponId, customerEmail, order.id, discountCents);
        } catch (err) {
          logger.warn('[coupon] paytr redeem failed', { err });
        }
      }

      return {
        ...prepared,
        sessionId: prepared.merchantOid,
        mock: false,
      };
    }

    // --- Legacy mock (stripe unconfigured) ---
    if (provider === 'stripe' && !isStripeConfigured()) {
      logger.warn('Stripe not configured, returning mock checkout URL');
      const order = await prisma.order.create({
        data: {
          orderNumber: await orderRepository.generateOrderNumber(),
          customerEmail,
          stripeSessionId: `mock_${Date.now()}`,
          status: 'PENDING',
          subtotalCents: subtotal,
          discountCents,
          totalCents,
          currency: 'try',
          ...(couponId ? { couponId } : {}),
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

      if (couponId) {
        try {
          await couponService.redeem(couponId, customerEmail, order.id, discountCents);
        } catch (err) {
          logger.warn('[coupon] mock redeem failed', { err });
        }
      }

      return {
        url: `/odeme/basarili?session_id=mock_${order.id}&order=${order.orderNumber}`,
        sessionId: order.stripeSessionId,
        provider: 'stripe' as PaymentProvider,
      };
    }

    // --- iyzico akışı ---
    if (provider === 'iyzico') {
      // İndirim varsa kalem fiyatlarını oransal düşür (basket = paidPrice kuralı)
      const scale = subtotal > 0 ? totalCents / subtotal : 1;
      const iyzicoItems = items.map((item) => {
        const product = validProducts.find((p) => p.id === item.productId)!;
        const line = Math.max(1, Math.round(item.priceCents * item.quantity * scale));
        return {
          id: item.productId,
          name: product.title,
          category: product.category ?? 'general',
          itemType: IYZICO_DIGITAL_ITEM_TYPE,
          price: centsToIyzicoString(line),
          _lineCents: line,
        };
      });
      // Yuvarlama farkını son kaleme ekle/çıkar
      const sumLines = iyzicoItems.reduce((s, i) => s + i._lineCents, 0);
      if (iyzicoItems.length && sumLines !== totalCents) {
        iyzicoItems[iyzicoItems.length - 1]._lineCents += totalCents - sumLines;
        iyzicoItems[iyzicoItems.length - 1].price = centsToIyzicoString(
          Math.max(1, iyzicoItems[iyzicoItems.length - 1]._lineCents)
        );
      }

      const totalPrice = centsToIyzicoString(totalCents);
      const checkout = await iyzicoService.createCheckout({
        items: iyzicoItems.map(({ _lineCents: _, ...rest }) => rest),
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

      const order = await prisma.order.create({
        data: {
          orderNumber: await orderRepository.generateOrderNumber(),
          customerEmail,
          stripeSessionId: checkout.token,
          status: 'PENDING',
          subtotalCents: subtotal,
          discountCents,
          totalCents,
          currency: 'try',
          ...(couponId ? { couponId } : {}),
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

      if (couponId) {
        try {
          await couponService.redeem(couponId, customerEmail, order.id, discountCents);
        } catch (err) {
          logger.warn('[coupon] iyzico redeem failed', { err });
        }
      }

      return {
        url: checkout.paymentPageUrl,
        sessionId: checkout.token,
        provider: 'iyzico' as PaymentProvider,
      };
    }

    // --- Stripe akışı ---
    let stripeDiscountId: string | undefined;
    if (discountCents > 0) {
      const ephemeral = await stripe.coupons.create({
        amount_off: discountCents,
        currency: 'try',
        duration: 'once',
        name: options?.couponCode?.toUpperCase() ?? 'INDIRIM',
      });
      stripeDiscountId = ephemeral.id;
    }

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
      ...(stripeDiscountId ? { discounts: [{ coupon: stripeDiscountId }] } : {}),
      customer_email: customerEmail,
      success_url: `${process.env.NEXTAUTH_URL}/odeme/basarili?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/magaza`,
      metadata: {
        customerEmail,
        productIds: items.map((i) => i.productId).join(','),
        ...(couponId ? { couponId, discountCents: String(discountCents) } : {}),
      },
    });

    // Create pending order with items snapshot
    const order = await prisma.order.create({
      data: {
        orderNumber: await orderRepository.generateOrderNumber(),
        customerEmail,
        stripeSessionId: session.id,
        status: 'PENDING',
        subtotalCents: subtotal,
        discountCents,
        totalCents,
        currency: 'try',
        ...(couponId ? { couponId } : {}),
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

    if (couponId) {
      try {
        await couponService.redeem(couponId, customerEmail, order.id, discountCents);
      } catch (err) {
        logger.warn('[coupon] stripe redeem failed', { err });
      }
    }

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
    options?: {
      paymentProvider?: string | null;
      customerName?: string;
      customerPhone?: string;
      customerIp?: string;
      customerAddress?: string;
    }
  ) {
    const plan = await planRepository.findBySlug(planSlug);
    if (!plan) throw new NotFoundError('Plan');

    const provider = selectPaymentProvider(options?.paymentProvider);
    const customerName = options?.customerName?.trim() || 'Musteri';
    const customerPhone = options?.customerPhone?.trim() || '05000000000';
    const customerIp = options?.customerIp?.trim() || '127.0.0.1';

    // --- PayTR: dönem ücreti tek çekim (Direkt API recurring desteklemez) ---
    if (provider === 'paytr') {
      const orderNumber = await orderRepository.generateOrderNumber();

      if (!isPaytrConfigured()) {
        logger.warn('[PayTR] Abonelik mock — yapılandırılmamış');
        const order = await prisma.order.create({
          data: {
            orderNumber,
            customerEmail,
            customerName,
            stripeSessionId: `paytr_sub_mock_${Date.now()}`,
            status: 'PENDING',
            subtotalCents: plan.priceCents,
            discountCents: 0,
            totalCents: plan.priceCents,
            currency: plan.currency || 'try',
            metadata: {
              type: 'subscription',
              planSlug: plan.slug,
              planId: plan.id,
              interval: plan.interval,
              provider: 'paytr',
              mock: true,
            },
            notes: `Abonelik: ${plan.name}`,
          },
        });
        return {
          provider: 'paytr' as PaymentProvider,
          mock: true,
          url: `/odeme/basarili?session_id=${order.stripeSessionId}&order=${order.orderNumber}&paytr=mock&sub=1`,
          sessionId: order.stripeSessionId,
          orderNumber,
        };
      }

      const prepared = paytrService.prepareDirectPayment({
        orderNumber,
        customerEmail,
        customerName,
        customerPhone,
        customerAddress: options?.customerAddress,
        userIp: customerIp,
        totalCents: plan.priceCents,
        basket: [
          {
            name: `${plan.name} (${plan.interval})`,
            priceCents: plan.priceCents,
            quantity: 1,
          },
        ],
        okPath: '/odeme/basarili?paytr=1&sub=1',
        failPath: '/odeme/basarisiz?sub=1',
      });

      await prisma.order.create({
        data: {
          orderNumber,
          customerEmail,
          customerName,
          stripeSessionId: prepared.merchantOid,
          status: 'PENDING',
          subtotalCents: plan.priceCents,
          discountCents: 0,
          totalCents: plan.priceCents,
          currency: plan.currency || 'try',
          metadata: {
            type: 'subscription',
            planSlug: plan.slug,
            planId: plan.id,
            interval: plan.interval,
            provider: 'paytr',
          },
          notes: `Abonelik: ${plan.name}`,
        },
      });

      return {
        ...prepared,
        sessionId: prepared.merchantOid,
        mock: false,
      };
    }

    // --- Legacy iyzico subscription ---
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

    // --- Legacy Stripe ---
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
      cancel_url: `${process.env.NEXTAUTH_URL}/magaza/abonelikler`,
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

  /**
   * Sipariş PAID'e geçirir ve lisansları üretir.
   *
   * Yan etkiler (receipt e-postası, giden webhook, notification, affiliate,
   * loyalty, partner) BURADA BEKLENMEZ — `Jobs.OrderPostCheckout` job'ına
   * devredilir. Gerekçe ve retry politikası: commerce/postCheckout.ts.
   *
   * Idempotent: order PAID ise hiçbir şey yapmaz, tekrar mail göndermez.
   */
  async handleCheckoutCompleted(session: { id: string; payment_intent?: string }) {
    const order = await orderRepository.findByStripeSession(session.id);
    if (!order || order.status === 'PAID') return;

    await orderRepository.update(order.id, {
      status: 'PAID',
      stripePaymentIntent: session.payment_intent,
      deliveredAt: new Date(),
    });

    const meta = (order as { metadata?: unknown }).metadata as {
      type?: string;
      planSlug?: string;
      planId?: string;
      interval?: string;
    } | null;
    const isTip = meta?.type === 'tip';
    const isSubscription = meta?.type === 'subscription';

    if (isSubscription && meta.planSlug) {
      await this.activatePaytrSubscriptionPeriod(order, meta);
    } else if (!isTip) {
      await this.generateLicenseForOrder(order.id);
    }

    logger.info('Order completed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tip: isTip,
      subscription: isSubscription,
    });

    await queueService.enqueueOrderPostCheckout({ orderId: order.id });

    return order;
  },

  /**
   * PayTR ile alınan dönem ödemesi → Subscription + UserSubscription aktifleştir.
   * Otomatik yenileme yok; süre bitince kullanıcı yeniden öder.
   */
  async activatePaytrSubscriptionPeriod(
    order: { id: string; customerEmail: string; customerName?: string | null; stripeSessionId: string | null },
    meta: { planSlug?: string; planId?: string; interval?: string }
  ) {
    const plan = meta.planId
      ? await prisma.plan.findUnique({ where: { id: meta.planId } })
      : meta.planSlug
        ? await planRepository.findBySlug(meta.planSlug)
        : null;
    if (!plan) {
      logger.error('[PayTR] Abonelik aktivasyonu: plan yok', { orderId: order.id, meta });
      return;
    }

    const customer = await customerRepository.getOrCreate({
      email: order.customerEmail,
      name: order.customerName ?? undefined,
    });

    const periodStart = new Date();
    const periodEnd = addPlanInterval(periodStart, plan.interval);
    const paytrSubId = `paytr_sub_${order.stripeSessionId ?? order.id}`;

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: paytrSubId },
      create: {
        customerId: customer.id,
        planId: plan.id,
        stripeSubscriptionId: paytrSubId,
        stripeStatus: 'active',
        status: 'ACTIVE',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        metadata: { provider: 'paytr', orderId: order.id },
      },
      update: {
        planId: plan.id,
        stripeStatus: 'active',
        status: 'ACTIVE',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        metadata: { provider: 'paytr', orderId: order.id },
      },
    });

    if (customer.userId) {
      await subscriptionSyncService.upsertUserSubscription({
        userId: customer.userId,
        planSlug: plan.slug,
        status: 'active',
        stripeSubscriptionId: paytrSubId,
        expiresAt: periodEnd,
        startedAt: periodStart,
        autoRenew: false,
        trialEndsAt: null,
      });
    }

    logger.info('[PayTR] Abonelik dönemi aktif', {
      orderId: order.id,
      planSlug: plan.slug,
      periodEnd: periodEnd.toISOString(),
    });
  },

  /**
   * `customer.subscription.created|updated`
   *
   * Tüm yazma işi subscriptionSyncService'e devredildi — Subscription ve
   * UserSubscription tek sözleşmeden geçer (bkz. subscriptionSync.ts).
   * Payload normalize edilemezse sessizce atlanır: bozuk bir event yüzünden
   * webhook'a 500 dönüp Stripe'ı sonsuz retry'a sokmak istemiyoruz.
   */
  async handleSubscriptionChange(sub: Record<string, unknown>) {
    const input = normalizeStripeSubscription(sub);
    if (!input) return;
    return subscriptionSyncService.syncFromStripe(input);
  },

  /** `customer.subscription.deleted` */
  async handleSubscriptionCancel(sub: Record<string, unknown>) {
    const stripeSubscriptionId = typeof sub.id === 'string' ? sub.id : null;
    if (!stripeSubscriptionId) {
      logger.warn('Subscription cancel event without id');
      return;
    }
    return subscriptionSyncService.cancelFromStripe({
      stripeSubscriptionId,
      canceledAt: fromStripeEpoch(sub.canceled_at) ?? new Date(),
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