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

  it('createProductCheckout in mock mode creates a PENDING order with PayTR mock session', async () => {
    const paytr = await import('@/lib/paytr');
    vi.spyOn(paytr, 'isPaytrConfigured').mockReturnValue(false);
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
    expect(result.sessionId).toMatch(/^paytr_mock_/);
    expect(result.url).toContain('/odeme/basarili');
  });

  it('createProductCheckout overrides manipulated client priceCents with DB product price', async () => {
    const paytr = await import('@/lib/paytr');
    vi.spyOn(paytr, 'isPaytrConfigured').mockReturnValue(false);
    const { commerceService } = await import('../service');
    const { prisma } = await import('@/lib/prisma');

    const fakeProduct = {
      id: 'p_expensive',
      slug: 'expensive-product',
      title: 'Expensive Product',
      shortDescription: 'Expensive product description',
      thumbnail: null,
      priceCents: 50000, // 500 TL
    };

    (prisma.digitalProduct.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(fakeProduct);
    let createdOrderData: any = null;
    (prisma.order.create as ReturnType<typeof vi.fn>).mockImplementation(async ({ data }) => {
      createdOrderData = data;
      return { id: 'order_safe', ...data };
    });

    // Client sends priceCents: 1 (1 kuruş) trying to tamper
    await commerceService.createProductCheckout(
      [{ productId: 'p_expensive', quantity: 1, priceCents: 1 }],
      'attacker@example.com'
    );

    expect(createdOrderData).not.toBeNull();
    // Subtotal and totalCents MUST be 50000 (from DB), NOT 1
    expect(createdOrderData.subtotalCents).toBe(50000);
    expect(createdOrderData.totalCents).toBe(50000);
  });

  it('throws ValidationError in production if PayTR is unconfigured', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const paytr = await import('@/lib/paytr');
      vi.spyOn(paytr, 'isPaytrConfigured').mockReturnValue(false);
      const { commerceService } = await import('../service');
      const { prisma } = await import('@/lib/prisma');

      (prisma.digitalProduct.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'p1',
        slug: 'p1',
        title: 'P1',
        shortDescription: 'desc',
        thumbnail: null,
        priceCents: 1000,
      });

      await expect(
        commerceService.createProductCheckout(
          [{ productId: 'p1', quantity: 1, priceCents: 1000 }],
          'user@example.com'
        )
      ).rejects.toThrow('Ödeme altyapısı şu anda kullanılamıyor');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});