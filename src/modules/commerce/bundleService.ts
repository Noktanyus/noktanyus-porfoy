/**
 * Digital Product Bundle Service
 *
 * Birden fazla dijital ürünü paketleyip indirimli satma imkanı sağlar.
 * - listBundles(): aktif bundle'ları listeler
 * - getBundle(): slug ile tekil bundle getirir
 * - getBundleProducts(): bundle içindeki ürünleri getirir
 * - validateBundleProducts(): ürün validasyonu (min 2, hepsi aktif)
 * - create(): yeni bundle oluşturur
 * - purchase(): bundle satın alma (her ürün için lisans oluşturur)
 * - getStats(): istatistikler
 *
 * Bundle purchase transaction içinde çalışır — lisans oluşturma
 * ve bundle sales counter atomik olarak artırılır.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { customerRepository } from './repository';
import { NotFoundError, ValidationError } from '@/modules/shared/errors';

interface CreateBundleInput {
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  thumbnail?: string;
  productIds: string[];
  priceCents: number;
  features?: string[];
  category?: string;
  version?: string;
}

function readProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

export const bundleService = {
  async listBundles(opts: { active?: boolean; limit?: number; ownerId?: string } = {}) {
    const where: Record<string, unknown> = {};
    if (opts.active !== false) where.active = true;
    if (opts.ownerId) where.ownerId = opts.ownerId;

    return prisma.bundle.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
      take: opts.limit ?? 20,
    });
  },

  async getBundle(slug: string) {
    const bundle = await prisma.bundle.findUnique({ where: { slug } });
    if (!bundle) throw new NotFoundError('Bundle');
    return bundle;
  },

  async getBundleProducts(bundle: { productIds: unknown }) {
    const ids = readProductIds(bundle.productIds);
    if (!ids.length) return [];
    return prisma.digitalProduct.findMany({
      where: { id: { in: ids }, active: true },
    });
  },

  /**
   * Bundle ürün validasyonu:
   * - Min 2 ürün
   * - Tüm ürünler aktif ve mevcut
   */
  async validateBundleProducts(productIds: string[]) {
    if (!Array.isArray(productIds) || productIds.length < 2) {
      throw new ValidationError('Bundle en az 2 ürün içermeli');
    }
    if (productIds.length !== new Set(productIds).size) {
      throw new ValidationError('Aynı ürün birden fazla eklenemez');
    }

    const products = await prisma.digitalProduct.findMany({
      where: { id: { in: productIds }, active: true },
    });
    if (products.length !== productIds.length) {
      throw new ValidationError('Bazı ürünler bulunamadı veya aktif değil');
    }
    return products;
  },

  /**
   * Yeni bundle oluşturur. originalPriceCents otomatik hesaplanır.
   */
  async create(userId: string, input: CreateBundleInput) {
    const products = await this.validateBundleProducts(input.productIds);
    const originalPriceCents = products.reduce((sum, p) => sum + p.priceCents, 0);

    if (!Number.isInteger(input.priceCents) || input.priceCents <= 0) {
      throw new ValidationError('Bundle fiyatı geçerli bir pozitif tam sayı olmalı');
    }
    if (input.priceCents > originalPriceCents) {
      throw new ValidationError('Bundle fiyatı orijinal toplam fiyattan yüksek olamaz', {
        priceCents: input.priceCents,
        originalPriceCents,
      });
    }

    const bundle = await prisma.bundle.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        shortDescription: input.shortDescription,
        thumbnail: input.thumbnail ?? null,
        priceCents: input.priceCents,
        originalPriceCents,
        currency: 'try',
        productIds: input.productIds as unknown as object,
        features: (input.features ?? []) as unknown as object,
        category: input.category ?? 'bundle',
        version: input.version ?? null,
        ownerId: userId,
        active: true,
      },
    });

    logger.info('Bundle created', { bundleId: bundle.id, slug: bundle.slug, userId });
    return bundle;
  },

  /**
   * Bundle satın alma — her ürün için lisans oluşturur (transaction).
   * Lisanslar için önce Customer kaydı get-or-create edilir.
   */
  async purchase(bundleId: string, buyerEmail: string, buyerId?: string) {
    const bundle = await prisma.bundle.findUnique({ where: { id: bundleId } });
    if (!bundle || !bundle.active) throw new NotFoundError('Bundle');

    // Customer kaydını transaction dışında get-or-create et (idempotent)
    const customer = await customerRepository.getOrCreate({ email: buyerEmail });

    return prisma.$transaction(async (tx) => {
      const purchase = await tx.bundlePurchase.create({
        data: {
          bundleId,
          buyerEmail,
          buyerId: buyerId ?? null,
          priceCents: bundle.priceCents,
          currency: bundle.currency,
          status: 'completed',
        },
      });

      const productIds = readProductIds(bundle.productIds);
      const licenses = [];

      for (const productId of productIds) {
        const key = `BUNDLE_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`.toUpperCase();
        const license = await tx.license.create({
          data: {
            key,
            customerId: customer.id,
            productId,
            userId: buyerId ?? null,
            type: 'ONE_TIME',
            status: 'active',
            maxActivations: 5,
            metadata: {
              source: 'bundle',
              bundleId,
              purchaseId: purchase.id,
              buyerEmail,
            },
          },
        });
        licenses.push(license);
      }

      await tx.bundle.update({
        where: { id: bundleId },
        data: { totalSales: { increment: 1 } },
      });

      logger.info('Bundle purchased', {
        bundleId,
        purchaseId: purchase.id,
        buyerEmail,
        licensesCreated: licenses.length,
      });

      return { purchase, licenses };
    });
  },

  /**
   * Bundle istatistikleri.
   */
  async getStats() {
    const [total, salesAgg, revenueAgg] = await Promise.all([
      prisma.bundle.count({ where: { active: true } }),
      prisma.bundlePurchase.count(),
      prisma.bundlePurchase.aggregate({ _sum: { priceCents: true } }),
    ]);

    return {
      total,
      sales: salesAgg,
      revenueCents: revenueAgg._sum.priceCents ?? 0,
    };
  },

  /**
   * Bundle sahibi (user) kontrolü.
   */
  async isOwnedBy(bundleId: string, userId: string): Promise<boolean> {
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
      select: { ownerId: true },
    });
    return Boolean(bundle?.ownerId && bundle.ownerId === userId);
  },
};
