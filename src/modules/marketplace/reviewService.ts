/**
 * Mağaza — ürün yorumları / puanları (admin-yayınlı DigitalProduct).
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ValidationError, NotFoundError, ConflictError } from '@/modules/shared/errors';

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
}

export const reviewService = {
  async create(reviewerId: string, productId: string, input: CreateReviewInput) {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new ValidationError('Puan 1 ile 5 arasında olmalı');
    }

    const product = await prisma.digitalProduct.findUnique({
      where: { id: productId },
      select: { id: true, ownerId: true, active: true },
    });

    if (!product) throw new NotFoundError('Ürün');
    if (!product.active) {
      throw new ValidationError('Pasif ürüne yorum bırakılamaz');
    }

    if (product.ownerId === reviewerId) {
      throw new ValidationError('Kendi ürününüze yorum bırakamazsınız');
    }

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
        rating: input.rating,
        comment: input.comment,
      },
      include: {
        reviewer: { select: { id: true, name: true, image: true } },
      },
    });

    logger.info('Product review created', {
      reviewId: review.id,
      productId,
      rating: input.rating,
    });

    return review;
  },

  async listForProduct(productId: string): Promise<ReviewWithReviewer[]> {
    return prisma.productReview.findMany({
      where: { productId, approved: true },
      include: {
        reviewer: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<ReviewWithReviewer[]>;
  },

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

  async flag(reviewId: string) {
    return prisma.productReview.update({
      where: { id: reviewId },
      data: { flagged: true },
    });
  },

  async setApproved(reviewId: string, approved: boolean) {
    return prisma.productReview.update({
      where: { id: reviewId },
      data: { approved },
    });
  },
};
