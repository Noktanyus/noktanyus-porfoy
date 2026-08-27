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
    subscription: {
      upsert: vi.fn(),
      update: vi.fn(),
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

  it('processWebhookEvent is idempotent (skips already-processed events)', async () => {
    const { commerceService } = await import('../service');
    const { prisma } = await import('@/lib/prisma');

    (prisma.webhookEvent.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      stripeEventId: 'evt_existing',
      type: 'noop',
    });

    await commerceService.processWebhookEvent({
      id: 'evt_existing',
      type: 'noop',
      data: { object: {} },
    });

    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
  });
});