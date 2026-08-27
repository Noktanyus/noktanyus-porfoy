/**
 * Coupon / Discount Service
 *
 * Kupon kodlarının doğrulanması, kullanım kaydı (redemption) ve
 * yönetimi için tek nokta. Order oluşturma akışıyla entegre çalışır.
 *
 * İş kuralları:
 * - Kupon büyük/küçük harf duyarsız (uppercase normalize)
 * - Aktiflik, tarih aralığı ve minimum sepet tutarı kontrolü
 * - Global kullanım limiti (maxUses) ve kullanıcı başına limit (maxUsesPerUser)
 * - PERCENTAGE veya FIXED_AMOUNT indirim tipleri
 * - maxDiscountCents ile tavan indirim sınırı
 * - redemption atomik transaction içinde oluşturulur (currentUses++ ile birlikte)
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { DiscountType } from '@prisma/client';

export interface ValidateCouponInput {
  code: string;
  customerEmail: string;
  subtotalCents: number;
  productIds?: string[];
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    description: string | null;
    discountType: DiscountType;
    discountValue: number;
  };
  discountCents: number;
  reason?: string;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderCents?: number;
  maxDiscountCents?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  startsAt?: Date;
  expiresAt?: Date;
  applicableProducts?: string[];
  applicablePlans?: string[];
}

export const couponService = {
  /**
   * Kupon kodunu doğrular ve indirim tutarını hesaplar.
   * Sadece kontrol yapar, redemption oluşturmaz — redeem() ayrı çağrılır.
   */
  async validate(input: ValidateCouponInput): Promise<CouponValidationResult> {
    const code = input.code.toUpperCase().trim();
    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon) {
      return { valid: false, discountCents: 0, reason: 'Kupon kodu geçersiz' };
    }
    if (!coupon.active) {
      return { valid: false, discountCents: 0, reason: 'Kupon aktif değil' };
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return { valid: false, discountCents: 0, reason: 'Kupon henüz aktif değil' };
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return { valid: false, discountCents: 0, reason: 'Kupon süresi dolmuş' };
    }

    if (input.subtotalCents < coupon.minOrderCents) {
      return {
        valid: false,
        discountCents: 0,
        reason: `Minimum sipariş tutarı ${(coupon.minOrderCents / 100).toFixed(2)} TL`,
      };
    }

    // Ürün kısıtı (varsa)
    if (
      coupon.applicableProducts &&
      Array.isArray(coupon.applicableProducts) &&
      coupon.applicableProducts.length > 0 &&
      input.productIds &&
      input.productIds.length > 0
    ) {
      const allowed = coupon.applicableProducts as string[];
      const intersects = input.productIds.some((id) => allowed.includes(id));
      if (!intersects) {
        return {
          valid: false,
          discountCents: 0,
          reason: 'Kupon bu ürünler için geçerli değil',
        };
      }
    }

    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return {
        valid: false,
        discountCents: 0,
        reason: 'Kupon kullanım limiti dolmuş',
      };
    }

    const userRedemptions = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, customerEmail: input.customerEmail },
    });
    if (userRedemptions >= coupon.maxUsesPerUser) {
      return {
        valid: false,
        discountCents: 0,
        reason: `Bu kuponu en fazla ${coupon.maxUsesPerUser} kez kullanabilirsiniz`,
      };
    }

    // İndirim tutarını hesapla
    let discountCents: number;
    if (coupon.discountType === 'PERCENTAGE') {
      discountCents = Math.floor((input.subtotalCents * coupon.discountValue) / 100);
    } else {
      discountCents = coupon.discountValue;
    }

    // Tavan indirim sınırı
    if (coupon.maxDiscountCents !== null && discountCents > coupon.maxDiscountCents) {
      discountCents = coupon.maxDiscountCents;
    }
    // Sepet tutarını aşamasın
    if (discountCents > input.subtotalCents) {
      discountCents = input.subtotalCents;
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountCents,
    };
  },

  /**
   * Kupon redemption kaydı oluşturur ve currentUses sayaçını artırır.
   * Atomik transaction içinde çalışır (yarış durumu güvenli).
   */
  async redeem(
    couponId: string,
    customerEmail: string,
    orderId: string | null,
    discountCents: number
  ) {
    return prisma.$transaction(async (tx) => {
      const redemption = await tx.couponRedemption.create({
        data: { couponId, customerEmail, orderId, discountCents },
      });
      await tx.coupon.update({
        where: { id: couponId },
        data: { currentUses: { increment: 1 } },
      });
      return redemption;
    });
  },

  /**
   * Yeni kupon oluşturur (admin).
   */
  async create(data: CreateCouponInput) {
    return prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderCents: data.minOrderCents ?? 0,
        maxDiscountCents: data.maxDiscountCents ?? null,
        maxUses: data.maxUses ?? null,
        maxUsesPerUser: data.maxUsesPerUser ?? 1,
        startsAt: data.startsAt ?? null,
        expiresAt: data.expiresAt ?? null,
        applicableProducts:
          data.applicableProducts === undefined
            ? Prisma.JsonNull
            : (data.applicableProducts as Prisma.InputJsonValue),
        applicablePlans:
          data.applicablePlans === undefined
            ? Prisma.JsonNull
            : (data.applicablePlans as Prisma.InputJsonValue),
      },
    });
  },

  /**
   * Tüm kuponları listeler (admin paneli).
   */
  async list() {
    return prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { redemptions: true } } },
    });
  },

  /**
   * Tek bir kuponu ID ile getirir.
   */
  async findById(id: string) {
    return prisma.coupon.findUnique({ where: { id } });
  },

  /**
   * Kuponu aktif/pasif yapar (toggle).
   */
  async setActive(id: string, active: boolean) {
    return prisma.coupon.update({
      where: { id },
      data: { active },
    });
  },

  /**
   * İlk sipariş kuponu: daha önce sipariş vermemiş kullanıcılar için.
   * First-time customer coupons.
   */
  async getCouponsForFirstTime(opts: { userId?: string; email?: string } = {}) {
    if (!opts.userId && !opts.email) {
      return [];
    }

    const hasOrders = await prisma.order.count({
      where: opts.userId
        ? { userId: opts.userId }
        : { customerEmail: opts.email },
    });
    if (hasOrders > 0) return [];

    return prisma.coupon.findMany({
      where: {
        active: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: new Date() } },
        ],
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
        ],
      },
      orderBy: { discountValue: 'desc' },
      take: 10,
    });
  },

  /**
   * Doğum günü kuponu: kullanıcının doğum gününde geçerli kupon.
   */
  async getBirthdayCoupon(birthDate: Date) {
    const today = new Date();
    if (
      today.getMonth() !== birthDate.getMonth() ||
      today.getDate() !== birthDate.getDate()
    ) {
      return null;
    }

    // Yaş kontrolü (18-120 arası)
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18 || age > 120) return null;

    // Bugün için özel olarak aktif olan kuponları ara.
    // (Description içinde "birthday" geçen kuponları da dahil edebiliriz.)
    return prisma.coupon.findFirst({
      where: {
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: today } },
        ],
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: today } }] },
        ],
      },
      orderBy: { discountValue: 'desc' },
    });
  },

  /**
   * Kullanıcıya özgü benzersiz referral kodu üretir.
   * Format: REF + userId'in ilk 6 karakteri + random 4 karakter.
   */
  async generateReferralCode(userId: string): Promise<string> {
    const userIdPrefix = userId.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
    const code = `REF${userIdPrefix}${randomSuffix}`;

    // Veritabanında çakışma kontrolü
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    });
    if (existing && existing.id !== userId) {
      // Çakışma varsa yeniden üret (nadir durum)
      return this.generateReferralCode(userId + 'X');
    }

    return code;
  },

  /**
   * Kullanıcının referral kodunu kaydeder ve döner.
   */
  async ensureReferralCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (user?.referralCode) return user.referralCode;

    const code = await this.generateReferralCode(userId);
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
    return code;
  },

  /**
   * Yeni kullanıcıyı referral'a bağlar.
   */
  async trackReferral(referralCode: string, newUserId: string) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
    });
    if (!referrer) return null;
    if (referrer.id === newUserId) return null; // Self-referral engeli

    await prisma.$transaction(async (tx) => {
      // Yeni kullanıcıya referrer'ı işaretle
      await tx.user.update({
        where: { id: newUserId },
        data: { referredBy: referralCode },
      });
      // Referrer'ın sayacını artır
      await tx.user.update({
        where: { id: referrer.id },
        data: { referralCount: { increment: 1 } },
      });
    });

    return referrer;
  },

  /**
   * Referral istatistiklerini getirir.
   */
  async getReferralStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, referralCount: true },
    });

    if (!user?.referralCode) {
      const code = await this.ensureReferralCode(userId);
      return {
        referralCode: code,
        stats: { count: 0, earned: 0 },
      };
    }

    return {
      referralCode: user.referralCode,
      stats: {
        count: user.referralCount ?? 0,
        earned: (user.referralCount ?? 0) * 1000, // Her referral için 10 TL (kuruş)
      },
    };
  },
};
