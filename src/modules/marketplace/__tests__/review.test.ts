import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    productReview: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      aggregate: vi.fn(),
      update: vi.fn(),
    },
    digitalProduct: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import { reviewService } from '../reviewService';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('reviewService — validation', () => {
  it('rejects rating < 1', async () => {
    await expect(
      reviewService.create('user-1', 'prod-1', { rating: 0 })
    ).rejects.toThrow();
  });

  it('rejects rating > 5', async () => {
    await expect(
      reviewService.create('user-1', 'prod-1', { rating: 6 })
    ).rejects.toThrow();
  });

  it('rejects non-integer rating', async () => {
    await expect(
      reviewService.create('user-1', 'prod-1', { rating: 4.5 })
    ).rejects.toThrow();
  });
});

describe('reviewService — create', () => {
  it('throws when product not found', async () => {
    (prisma.digitalProduct.findUnique as any).mockResolvedValueOnce(null);
    await expect(
      reviewService.create('user-1', 'prod-1', { rating: 5 })
    ).rejects.toThrow(/Ürün/);
  });

  it('throws when product is inactive', async () => {
    (prisma.digitalProduct.findUnique as any).mockResolvedValueOnce({
      id: 'prod-1',
      ownerId: 'other-user',
      active: false,
    });
    await expect(
      reviewService.create('user-1', 'prod-1', { rating: 5 })
    ).rejects.toThrow(/Pasif/);
  });

  it('throws when reviewer is the product owner', async () => {
    (prisma.digitalProduct.findUnique as any).mockResolvedValueOnce({
      id: 'prod-1',
      ownerId: 'user-1',
      active: true,
    });
    await expect(
      reviewService.create('user-1', 'prod-1', { rating: 5 })
    ).rejects.toThrow(/Kendi ürününüz/);
  });

  it('throws when user already reviewed', async () => {
    (prisma.digitalProduct.findUnique as any).mockResolvedValueOnce({
      id: 'prod-1',
      ownerId: 'other-user',
      active: true,
    });
    (prisma.productReview.findUnique as any).mockResolvedValueOnce({ id: 'existing' });
    await expect(
      reviewService.create('user-1', 'prod-1', { rating: 5 })
    ).rejects.toThrow(/zaten/);
  });

  it('creates review when valid', async () => {
    (prisma.digitalProduct.findUnique as any).mockResolvedValueOnce({
      id: 'prod-1',
      ownerId: 'other-user',
      active: true,
    });
    (prisma.productReview.findUnique as any).mockResolvedValueOnce(null);
    (prisma.productReview.create as any).mockResolvedValueOnce({
      id: 'r-1',
      productId: 'prod-1',
      reviewerId: 'user-1',
      rating: 5,
    });

    const result = await reviewService.create('user-1', 'prod-1', {
      rating: 5,
      comment: 'Harika!',
    });
    expect(result.id).toBe('r-1');
  });
});

describe('reviewService — average', () => {
  it('returns 0 when no reviews', async () => {
    (prisma.productReview.aggregate as any).mockResolvedValueOnce({
      _avg: { rating: null },
      _count: { _all: 0 },
    });
    const result = await reviewService.average('prod-1');
    expect(result).toEqual({ average: 0, count: 0 });
  });

  it('returns average and count when reviews exist', async () => {
    (prisma.productReview.aggregate as any).mockResolvedValueOnce({
      _avg: { rating: 4.25 },
      _count: { _all: 12 },
    });
    const result = await reviewService.average('prod-1');
    expect(result).toEqual({ average: 4.25, count: 12 });
  });
});
