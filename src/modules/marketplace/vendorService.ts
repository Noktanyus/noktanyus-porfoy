/**
 * Marketplace 2.0 — Vendor Service
 *
 * Vendor (satıcı) profili yönetimi:
 * - Profil oluşturma / güncelleme
 * - Slug çakışma kontrolü
 * - Vendor istatistiklerini (ürün sayısı, ortalama puan) toplama
 * - Top vendor listeleme
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ValidationError, NotFoundError, ConflictError } from '@/modules/shared/errors';

export interface CreateVendorInput {
  displayName: string;
  slug: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  website?: string;
  twitter?: string;
  github?: string;
}

export interface UpdateVendorInput {
  displayName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  website?: string;
  twitter?: string;
  github?: string;
}

const SLUG_REGEX = /^[a-z0-9-]+$/;

export const vendorService = {
  /**
   * Yeni vendor profili oluşturur.
   * Slug benzersizliğini kontrol eder.
   */
  async createProfile(userId: string, input: CreateVendorInput) {
    if (!input.displayName || input.displayName.trim().length < 2) {
      throw new ValidationError('Görünen isim en az 2 karakter olmalı');
    }

    if (!input.slug || !SLUG_REGEX.test(input.slug) || input.slug.length < 3) {
      throw new ValidationError('Slug sadece küçük harf, rakam ve tire içerebilir (min 3 karakter)');
    }

    // Kullanıcının zaten profili var mı?
    const existing = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictError('Bu kullanıcının zaten bir vendor profili var');
    }

    // Slug benzersiz mi?
    const slugTaken = await prisma.vendorProfile.findUnique({ where: { slug: input.slug } });
    if (slugTaken) {
      throw new ConflictError('Bu slug zaten kullanımda');
    }

    const profile = await prisma.vendorProfile.create({
      data: {
        userId,
        displayName: input.displayName.trim(),
        slug: input.slug,
        bio: input.bio,
        avatar: input.avatar,
        banner: input.banner,
        website: input.website,
        twitter: input.twitter,
        github: input.github,
      },
    });

    logger.info('Vendor profile created', { vendorId: profile.id, userId });
    return profile;
  },

  /**
   * Slug ile public vendor profilini getirir.
   * Aktif ürünleri + review sayısını içerir.
   */
  async getProfile(slug: string) {
    const profile = await prisma.vendorProfile.findUnique({
      where: { slug },
      include: {
        products: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!profile) throw new NotFoundError('Vendor profili');
    return profile;
  },

  /**
   * Kullanıcının kendi vendor profilini getirir (auth).
   */
  async getMyProfile(userId: string) {
    return prisma.vendorProfile.findUnique({
      where: { userId },
      include: {
        products: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });
  },

  /**
   * Vendor profilini günceller (auth).
   */
  async updateProfile(userId: string, input: UpdateVendorInput) {
    const existing = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!existing) throw new NotFoundError('Vendor profili');

    return prisma.vendorProfile.update({
      where: { userId },
      data: {
        displayName: input.displayName?.trim(),
        bio: input.bio,
        avatar: input.avatar,
        banner: input.banner,
        website: input.website,
        twitter: input.twitter,
        github: input.github,
      },
    });
  },

  /**
   * En yüksek puanlı vendorları listeler (public landing).
   */
  async listTopVendors(limit = 10) {
    return prisma.vendorProfile.findMany({
      where: { active: true, verified: true },
      orderBy: [{ avgRating: 'desc' }, { totalSales: 'desc' }],
      take: limit,
      include: {
        _count: {
          select: { products: true, reviews: true },
        },
      },
    });
  },

  /**
   * Vendor istatistiklerini (ürün sayısı, ortalama rating, toplam satış) toplar
   * ve profile yazar. Review eklendikten / ürün eklendikten sonra çağrılır.
   */
  async updateVendorStats(vendorId: string) {
    const [productCount, reviews] = await Promise.all([
      prisma.digitalProduct.count({
        where: { vendorId, active: true },
      }),
      prisma.productReview.aggregate({
        where: { vendorId, approved: true },
        _avg: { rating: true },
      }),
    ]);

    const updated = await prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        totalProducts: productCount,
        avgRating: reviews._avg.rating ?? 0,
      },
    });

    logger.info('Vendor stats updated', {
      vendorId,
      totalProducts: productCount,
      avgRating: reviews._avg.rating ?? 0,
    });

    return updated;
  },

  /**
   * Vendor profilini slug ile birlikte getirir (varsa).
   * Public sayfa için.
   */
  async getBySlugSafe(slug: string) {
    return prisma.vendorProfile.findUnique({
      where: { slug },
    });
  },
};