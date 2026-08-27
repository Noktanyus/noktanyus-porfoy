/**
 * Marketplace 2.0 — Review Service
 *
 * Ürün yorumları / puanları:
 * - 1-5 arası rating, opsiyonel yorum metni
 * - Aynı kullanıcı aynı ürüne sadece 1 review bırakabilir (unique constraint)
 * - Vendor'ın ortalama puanı güncellenir
 * - Moderasyon için approved/flagged flag'leri
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ValidationError, NotFoundError, ConflictError } from '@/modules/shared/errors';
import { vendorService } from './vendorService';

export interface CreateReviewInput {
  rating: number;
  comment?: string;
}

export interface ReviewWithReviewer {
  id: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  flagged: boolean;
  createdAt: Date;
  reviewer: {
    id: string;
    name: string | null;
    image: string | null;
  };
  productId: string;
  vendorId: string;
}

export const reviewService = {
  /**
   * Bir kullanıcı adına ürün review oluşturur.
   * - Ürünün vendor'ı olmalı
   * - Reviewer kendi ürününe review bırakamaz
   * - Daha önce review bırakılmışsa hata
   */
  async create(reviewerId: string, productId: string, input: CreateReviewInput) {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new ValidationError('Puan 1 ile 5 arasında olmalı');
    }

    const product = await prisma.digitalProduct.findUnique({
      where: { id: productId },
      select: { id: true, vendorId: true, ownerId: true, slug: true, title: true },
    });

    if (!product) throw new NotFoundError('Ürün');

    if (!product.vendorId) {
      throw new ValidationError('Bu ürün marketplace üzerinden satılmıyor');
    }

    // Kendi ürününe review bırakamaz (vendor veya owner)
    if (product.ownerId === reviewerId) {
      throw new ValidationError('Kendi ürününüze yorum bırakamazsınız');
    }

    // Daha önce review bırakılmış mı?
    const existing = await prisma.productReview.findUnique({
      where: { productId_reviewerId: { productId, reviewerId } },
    });

    if (existing) {
      throw new ConflictError('Bu ürüne zaten yorum bıraktınız');
    }

    const review = await prisma.productReview.create({
      data: {
        productId,
        reviewerId,
        vendorId: product.vendorId,
        rating: input.rating,
        comment: input.comment,
      },
      include: {
        reviewer: { select: { id: true, name: true, image: true } },
      },
    });

    // Vendor istatistiklerini güncelle (asenkron, hata olsa bile review'ı kaybetme)
    try {
      await vendorService.updateVendorStats(product.vendorId);
    } catch (err) {
      logger.warn('Vendor stats update failed (review still saved)', {
        vendorId: product.vendorId,
        error: err,
      });
    }

    logger.info('Product review created', {
      reviewId: review.id,
      productId,
      rating: input.rating,
    });

    return review;
  },

  /**
   * Bir ürünün tüm onaylı yorumlarını listeler (public).
   */
  async listForProduct(productId: string): Promise<ReviewWithReviewer[]> {
    return prisma.productReview.findMany({
      where: { productId, approved: true },
      include: {
        reviewer: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<ReviewWithReviewer[]>;
  },

  /**
   * Vendor'ın tüm yorumlarını listeler (dashboard).
   */
  async listForVendor(vendorId: string, take = 50) {
    return prisma.productReview.findMany({
      where: { vendorId },
      include: {
        reviewer: { select: { id: true, name: true, image: true } },
        product: { select: { id: true, slug: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  },

  /**
   * Ürünün ortalama puanı + yorum sayısı.
   */
  async average(productId: string): Promise<{ average: number; count: number }> {
    const agg = await prisma.productReview.aggregate({
      where: { productId, approved: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      average: agg._avg.rating ?? 0,
      count: agg._count._all,
    };
  },

  /**
   * Review'ı flagler (şüpheli içerik moderasyonu).
   */
  async flag(reviewId: string, reason?: string) {
    return prisma.productReview.update({
      where: { id: reviewId },
      data: {
        flagged: true,
        // İleride flaggedReason alanı eklenebilir
      },
    });
  },

  /**
   * Review'ı onaylar veya reddeder (admin moderation).
   */
  async setApproved(reviewId: string, approved: boolean) {
    const review = await prisma.productReview.update({
      where: { id: reviewId },
      data: { approved },
    });

    // Onay/ret sonrası vendor istatistiği değişebilir
    try {
      await vendorService.updateVendorStats(review.vendorId);
    } catch (err) {
      logger.warn('Vendor stats update failed after moderation', {
        vendorId: review.vendorId,
        error: err,
      });
    }

    return review;
  },

  /**
   * Vendor'ın tüm ürünleri için genel rating özeti.
   */
  async vendorSummary(vendorId: string) {
    const [agg, distribution] = await Promise.all([
      prisma.productReview.aggregate({
        where: { vendorId, approved: true },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.productReview.groupBy({
        by: ['rating'],
        where: { vendorId, approved: true },
        _count: { _all: true },
      }),
    ]);

    const buckets: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    };
    distribution.forEach((d) => {
      const r = d.rating as 1 | 2 | 3 | 4 | 5;
      if (r >= 1 && r <= 5) buckets[r] = d._count._all;
    });

    return {
      average: agg._avg.rating ?? 0,
      count: agg._count._all,
      distribution: buckets,
    };
  },
};