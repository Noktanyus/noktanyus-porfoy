/**
 * Commerce Module — Service Layer
 *
 * PayTR API (Tek ve birincil ödeme sağlayıcı),
 * sipariş takibi, lisans üretimi ve commerce iş kuralları.
 */

import { prisma } from '@/lib/prisma';
import { isPaytrConfigured } from '@/lib/paytr';
import { paytrService } from './paytrService';
import {
  planRepository,
  productRepository,
  customerRepository,
  orderRepository,
  licenseRepository,
} from './repository';
import { queueService } from '@/lib/queueService';
import { subscriptionSyncService } from './subscriptionSync';
import { NotFoundError, ValidationError } from '@/modules/shared/errors';
import { logger } from '@/lib/logger';
import type { CartItem } from './types';
import { couponService } from './couponService';

export type PaymentProvider = 'paytr';

/**
 * Ödeme sağlayıcısı seçimi.
 * Sistemde yalnızca PayTR kullanılır.
 */
export function selectPaymentProvider(_requested?: string | null): PaymentProvider {
  return 'paytr';
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

    // --- PayTR iFrame API (TR birincil) ---
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
            metadata: {
              provider: 'paytr',
              mock: true,
              itemsWithTiers: items.map((i) => ({
                productId: i.productId,
                tierDays: i.tierDays,
                tierLabel: i.tierLabel,
              })),
            },
            items: {
              create: items.map((item) => {
                const product = validProducts.find((p) => p.id === item.productId)!;
                const titleWithTier = item.tierLabel
                  ? `${product.title} (${item.tierLabel})`
                  : product.title;
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPriceCents: item.priceCents,
                  totalCents: item.priceCents * item.quantity,
                  productTitle: titleWithTier,
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
      const prepared = await paytrService.preparePayment({
        orderNumber,
        customerEmail,
        customerName,
        customerPhone,
        customerAddress: options?.customerAddress,
        userIp: customerIp,
        totalCents,
        basket: items.map((item) => {
          const product = validProducts.find((p) => p.id === item.productId)!;
          const titleWithTier = item.tierLabel
            ? `${product.title} (${item.tierLabel})`
            : product.title;
          return {
            name: titleWithTier,
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
          metadata: {
            provider: 'paytr',
            mode: prepared.mode,
            itemsWithTiers: items.map((i) => ({
              productId: i.productId,
              tierDays: i.tierDays,
              tierLabel: i.tierLabel,
            })),
          },
          items: {
            create: items.map((item) => {
              const product = validProducts.find((p) => p.id === item.productId)!;
              const titleWithTier = item.tierLabel
                ? `${product.title} (${item.tierLabel})`
                : product.title;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPriceCents: item.priceCents,
                totalCents: item.priceCents * item.quantity,
                productTitle: titleWithTier,
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

    throw new Error('Ödeme başlatılamadı');
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

    // --- PayTR: dönem ücreti tek çekim (recurring yok) ---
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

      const prepared = await paytrService.preparePayment({
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
            mode: prepared.mode,
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

    throw new Error('Ödeme başlatılamadı');
  },

  /**
   * Ön ödemeli API kredi yükleme — önce öde, sonra kullan.
   * Kullanıcı hesabı zorunlu (kredi User.apiCreditBalance'a yazılır).
   */
  async createCreditTopupCheckout(
    packSlug: string,
    customerEmail: string,
    options?: {
      paymentProvider?: string | null;
      customerName?: string;
      customerPhone?: string;
      customerIp?: string;
      customerAddress?: string;
      userId?: string;
    }
  ) {
    const { getCreditPack } = await import('@/lib/apiCredits');
    const pack = getCreditPack(packSlug);
    if (!pack) throw new NotFoundError('Kredi paketi');

    const provider = selectPaymentProvider(options?.paymentProvider);
    const customerName = options?.customerName?.trim() || 'Musteri';
    const customerPhone = options?.customerPhone?.trim() || '05000000000';
    const customerIp = options?.customerIp?.trim() || '127.0.0.1';
    const orderNumber = await orderRepository.generateOrderNumber();

    const metadata = {
      type: 'api_topup' as const,
      packSlug: pack.slug,
      credits: pack.credits,
      provider,
    };

    if (provider === 'paytr') {
      if (!isPaytrConfigured()) {
        logger.warn('[PayTR] Kredi top-up mock — yapılandırılmamış');
        const order = await prisma.order.create({
          data: {
            orderNumber,
            customerEmail,
            customerName,
            userId: options?.userId ?? null,
            stripeSessionId: `paytr_credit_mock_${Date.now()}`,
            status: 'PENDING',
            subtotalCents: pack.priceCents,
            discountCents: 0,
            totalCents: pack.priceCents,
            currency: pack.currency,
            metadata: { ...metadata, mock: true },
            notes: `API kredi: ${pack.name}`,
          },
        });
        await this.handleCheckoutCompleted({ id: order.stripeSessionId });
        return {
          provider: 'paytr' as PaymentProvider,
          mock: true,
          url: `/odeme/basarili?session_id=${order.stripeSessionId}&order=${order.orderNumber}&paytr=mock&credits=1`,
          sessionId: order.stripeSessionId,
          orderNumber,
        };
      }

      const prepared = await paytrService.preparePayment({
        orderNumber,
        customerEmail,
        customerName,
        customerPhone,
        customerAddress: options?.customerAddress,
        userIp: customerIp,
        totalCents: pack.priceCents,
        basket: [
          {
            name: `API ${pack.name} (${pack.credits} kredi)`,
            priceCents: pack.priceCents,
            quantity: 1,
          },
        ],
        okPath: '/odeme/basarili?paytr=1&credits=1',
        failPath: '/odeme/basarisiz?credits=1',
      });

      await prisma.order.create({
        data: {
          orderNumber,
          customerEmail,
          customerName,
          userId: options?.userId ?? null,
          stripeSessionId: prepared.merchantOid,
          status: 'PENDING',
          subtotalCents: pack.priceCents,
          discountCents: 0,
          totalCents: pack.priceCents,
          currency: pack.currency,
          metadata: { ...metadata, mode: prepared.mode },
          notes: `API kredi: ${pack.name}`,
        },
      });

      return {
        ...prepared,
        sessionId: prepared.merchantOid,
        mock: false,
      };
    }

    throw new Error('Kredi ödemesi başlatılamadı');
  },

  // --- Customer portal ---
  async createPortalSession(_customerEmail: string) {
    return { url: '/dashboard' };
  },

  // --- License generation (after successful payment) ---
  async generateLicenseForOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
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
      const product = item.product;
      const reqs =
        product?.requirements &&
        typeof product.requirements === 'object' &&
        !Array.isArray(product.requirements)
          ? (product.requirements as Record<string, unknown>)
          : {};

      const licenseType =
        typeof reqs.licenseType === 'string' &&
        ['PERPETUAL', 'SUBSCRIPTION', 'TRIAL', 'ONE_TIME'].includes(reqs.licenseType)
          ? (reqs.licenseType as 'PERPETUAL' | 'SUBSCRIPTION' | 'TRIAL' | 'ONE_TIME')
          : 'ONE_TIME';

      const maxActivations =
        typeof reqs.maxActivations === 'number' && reqs.maxActivations > 0
          ? Math.floor(reqs.maxActivations)
          : 1;

      // Siparişte seçilen süre paketi (tierDays) var mı kontrol et
      const orderMeta =
        order.metadata && typeof order.metadata === 'object'
          ? (order.metadata as Record<string, unknown>)
          : {};
      const itemsWithTiers = Array.isArray(orderMeta.itemsWithTiers)
        ? (orderMeta.itemsWithTiers as Array<{ productId: string; tierDays?: number; tierLabel?: string }>)
        : [];
      const matchedTier = itemsWithTiers.find((t) => t.productId === item.productId);

      const validityDays =
        typeof matchedTier?.tierDays === 'number'
          ? Math.max(0, Math.floor(matchedTier.tierDays))
          : typeof reqs.validityDays === 'number' && reqs.validityDays > 0
          ? Math.floor(reqs.validityDays)
          : 0;

      const expiresAt =
        validityDays > 0 ? new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000) : null;

      const key = await licenseRepository.generateKey();
      const license = await licenseRepository.create({
        key,
        customerId: customer.id,
        productId: item.productId,
        orderId: order.id,
        ...(order.userId ? { userId: order.userId } : {}),
        type: licenseType,
        status: 'active',
        maxActivations,
        ...(expiresAt ? { expiresAt } : {}),
        metadata: {
          productTitle: item.productTitle,
          productSlug: item.productSlug,
          tierLabel: matchedTier?.tierLabel || undefined,
          tierDays: validityDays,
          thirdPartyAppName: reqs.thirdPartyAppName || undefined,
          activationInstructions: reqs.activationInstructions || undefined,
        },
      });
      licenses.push(license);
    }

    return licenses;
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
      packSlug?: string;
    } | null;
    const isTip = meta?.type === 'tip';
    const isSubscription = meta?.type === 'subscription';
    const isCreditTopup = meta?.type === 'api_topup';

    if (isSubscription && meta.planSlug) {
      await this.activatePaytrSubscriptionPeriod(order, meta);
    } else if (isCreditTopup && meta.packSlug) {
      const { fulfillCreditTopupOrder } = await import('@/lib/apiCredits');
      await fulfillCreditTopupOrder({
        orderId: order.id,
        customerEmail: order.customerEmail,
        packSlug: meta.packSlug,
        userId: (order as { userId?: string | null }).userId,
      });
    } else if (!isTip) {
      await this.generateLicenseForOrder(order.id);
    }

    logger.info('Order completed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tip: isTip,
      subscription: isSubscription,
      creditTopup: isCreditTopup,
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

  // --- License activation ---
  async activateLicense(licenseKey: string, domain: string, ip: string) {
    return licenseRepository.activate(licenseKey, domain, ip);
  },
};