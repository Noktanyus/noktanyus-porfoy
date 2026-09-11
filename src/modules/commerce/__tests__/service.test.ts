/**
 * Commerce Service Tests
 *
 * Vitest ile temel davranış testleri (mock mode dahil).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    digitalProduct: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    plan: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    license: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    userSubscription: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    subscription: {
      upsert: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    webhookEvent: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
    billingPortal: { sessions: { create: vi.fn() } },
  },
  isStripeConfigured: vi.fn(() => false),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/emailService', () => ({
  emailService: { sendReceipt: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('@/modules/webhooks', () => ({
  webhookService: { dispatchEvent: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('@/modules/notifications', () => ({
  notificationService: { dispatch: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('@/modules/affiliate', () => ({
  affiliateService: { trackConversion: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('@/modules/partners', () => ({
  partnerService: { markLeadConverted: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('@/modules/loyalty', () => ({
  loyaltyService: { onPurchase: vi.fn().mockResolvedValue(undefined) },
}));

describe('commerceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listProducts calls productRepository.findActive', async () => {
    const { commerceService } = await import('../service');
    const { prisma } = await import('@/lib/prisma');
    await commerceService.listProducts();
    expect(prisma.digitalProduct.findMany).toHaveBeenCalled();
  });

  it('listPlans calls planRepository.findActive', async () => {
    const { commerceService } = await import('../service');
    const { prisma } = await import('@/lib/prisma');
    await commerceService.listPlans();
    expect(prisma.plan.findMany).toHaveBeenCalled();
  });

  it('createProductCheckout in mock mode creates a PENDING order without hitting Stripe', async () => {
    const { commerceService } = await import('../service');
    const { prisma } = await import('@/lib/prisma');

    // Mock ürün
    const fakeProduct = {
      id: 'p1',
      slug: 'test-product',
      title: 'Test Product',
      shortDescription: 'A test product description',
      thumbnail: null,
      priceCents: 1000,
      active: true,
      category: 'general',
    };

    (prisma.digitalProduct.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(fakeProduct);
    (prisma.order.create as ReturnType<typeof vi.fn>).mockImplementation(async ({ data }) => ({
      id: 'order1',
      ...data,
    }));

    const result = await commerceService.createProductCheckout(
      [{ productId: 'p1', quantity: 1, priceCents: 1000 }],
      'buyer@example.com'
    );

    expect(prisma.order.create).toHaveBeenCalled();
    expect(result.sessionId).toMatch(/^mock_/);
    expect(result.url).toContain('/odeme/basarili');
  });

  it('verifyWebhook throws when Stripe is not configured', async () => {
    const { commerceService } = await import('../service');
    expect(() => commerceService.verifyWebhook('payload', 'sig')).toThrow('Stripe not configured');
  });

    it('processWebhookEvent retries previously failed events', async () => {
      const { commerceService } = await import('../service');
      const { prisma } = await import('@/lib/prisma');

      (prisma.webhookEvent.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        stripeEventId: 'evt_retry',
        type: 'noop',
        success: false,
      });
      (prisma.webhookEvent.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await commerceService.processWebhookEvent({
        id: 'evt_retry',
        type: 'noop',
        data: { object: {} },
      });

      expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
      expect(prisma.webhookEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripeEventId: 'evt_retry' },
          data: expect.objectContaining({ success: true }),
        })
      );
    });

    it('createProductCheckout uses DB price instead of client priceCents', async () => {
      const { commerceService } = await import('../service');
      const { prisma } = await import('@/lib/prisma');

      const fakeProduct = {
        id: 'p1',
        slug: 'test-product',
        title: 'Test Product',
        shortDescription: 'A test product description',
        thumbnail: null,
        priceCents: 5000,
        active: true,
        category: 'general',
      };

      (prisma.digitalProduct.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(fakeProduct);
      (prisma.order.create as ReturnType<typeof vi.fn>).mockImplementation(async ({ data }) => ({
        id: 'order1',
        ...data,
      }));
      (prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await commerceService.createProductCheckout(
        [{ productId: 'p1', quantity: 1, priceCents: 1 }],
        'buyer@example.com'
      );

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalCents: 5000,
            subtotalCents: 5000,
          }),
        })
      );
    });

  it('processWebhookEvent is idempotent (skips already-processed events)', async () => {
    const { commerceService } = await import('../service');
    const { prisma } = await import('@/lib/prisma');

    (prisma.webhookEvent.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      stripeEventId: 'evt_existing',
      type: 'noop',
      success: true,
    });

    await commerceService.processWebhookEvent({
      id: 'evt_existing',
      type: 'noop',
      data: { object: {} },
    });

    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
  });
});