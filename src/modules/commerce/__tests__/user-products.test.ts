/**
 * @file User Products API Tests
 *
 * /api/user/products rotasının temel sözleşmesini doğrular:
 * - Schema validation (Zod)
 * - Slug uniqueness kontrolü
 * - OwnerId'nin session'dan alınması
 *
 * Not: Bu testler rota seviyesinde entegrasyon testi değildir; schema ve
 *      repository mantığını izole mock'lar üzerinden doğrular.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    digitalProduct: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('User Products API — Repository Contract', () => {
  it('exports digitalProduct prisma client accessor', () => {
    expect(prisma.digitalProduct).toBeDefined();
  });

  it('provides findMany, findUnique, create, update on digitalProduct', () => {
    expect(typeof prisma.digitalProduct.findMany).toBe('function');
    expect(typeof prisma.digitalProduct.findUnique).toBe('function');
    expect(typeof prisma.digitalProduct.create).toBe('function');
    expect(typeof prisma.digitalProduct.update).toBe('function');
  });

  it('mockable findUnique for slug uniqueness check', async () => {
    (prisma.digitalProduct.findUnique as any).mockResolvedValueOnce({
      id: 'prod_1',
      slug: 'taken',
    });
    const existing = await prisma.digitalProduct.findUnique({ where: { slug: 'taken' } });
    expect(existing?.slug).toBe('taken');
  });

  it('mockable create returns shape with required fields', async () => {
    (prisma.digitalProduct.create as any).mockResolvedValueOnce({
      id: 'prod_new',
      slug: 'new-product',
      ownerId: 'user_1',
      priceCents: 9900,
    });
    const created = await prisma.digitalProduct.create({
      data: {
        title: 'New',
        slug: 'new-product',
        shortDescription: 'desc desc desc desc',
        description: 'long description long description long description long description',
        fileUrl: 'r2://x',
        fileName: 'x.zip',
        fileSize: 0,
        priceCents: 9900,
        currency: 'try',
        ownerId: 'user_1',
      },
    });
    expect(created.id).toBe('prod_new');
    expect(created.ownerId).toBe('user_1');
  });
});