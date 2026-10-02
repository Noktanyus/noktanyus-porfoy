/**
 * @file refundEligibility.ts
 * Kullanıcı tarafından başlatılan kredi veya abonelik iadelerinin uygunluk kontrolü.
 *
 * Kural Sözleşmesi:
 * 1. Sipariş Durumu: 'PAID' veya 'FULFILLED' olmalı.
 * 2. Sipariş Türü: 'api_topup' (kredi paketi) veya 'subscription' (abonelik) olmalı.
 * 3. Süre: Satın alma tarihinden itibaren en fazla 24 saat (1 gün) geçmiş olmalı.
 * 4. Hak Kullanımı ("Hiçbir hakkını kullanmamış ise"):
 *    - Kredi alımı: Satın alımdan sonra HİÇBİR API kredisi (api_call) tüketilmemiş olmalı ve mevcut bakiye satın alınan paketin altına düşmemiş olmalıdır.
 *    - Abonelik alımı: Satın alımdan sonra o abonelik dönemi içinde HİÇBİR API isteği (apiKeyUsage) yapılmamış ve lisans aktive edilmemiş olmalıdır.
 */

import { prisma } from '@/lib/prisma';

export interface RefundEligibilityResult {
  eligible: boolean;
  orderType: 'api_topup' | 'subscription' | 'other';
  reason?: string;
  hoursRemaining?: number;
  rightsUsed?: number;
  purchasedCredits?: number;
  periodStart?: Date;
}

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function isOrderWithinOneDay(date: Date | string): {
  isWithin: boolean;
  hoursRemaining: number;
} {
  const purchaseTime = new Date(date).getTime();
  const now = Date.now();
  const elapsed = now - purchaseTime;

  if (elapsed > ONE_DAY_MS) {
    return { isWithin: false, hoursRemaining: 0 };
  }

  const hoursRemaining = Math.max(
    0,
    Math.round(((ONE_DAY_MS - elapsed) / (60 * 60 * 1000)) * 10) / 10
  );

  return { isWithin: true, hoursRemaining };
}

export async function checkRefundEligibility(
  orderId: string,
  userId?: string
): Promise<RefundEligibilityResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      licenses: true,
      items: true,
    },
  });

  if (!order) {
    return {
      eligible: false,
      orderType: 'other',
      reason: 'Sipariş bulunamadı.',
    };
  }

  // 1. Ödeme durumu kontrolü
  if (order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED') {
    return {
      eligible: false,
      orderType: 'other',
      reason: 'Bu sipariş zaten iade edilmiştir.',
    };
  }

  if (order.status !== 'PAID' && order.status !== 'FULFILLED') {
    return {
      eligible: false,
      orderType: 'other',
      reason: 'Yalnızca ödenmiş ve tamamlanmış siparişler için iade başlatılabilir.',
    };
  }

  // 2. Sipariş türü belirleme (Kredi mi, Abonelik mi?)
  const meta = (order.metadata && typeof order.metadata === 'object'
    ? (order.metadata as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const notes = (order.notes || '').toLowerCase();
  const metaType = typeof meta.type === 'string' ? meta.type.toLowerCase() : '';

  const isSubscription =
    metaType === 'subscription' ||
    notes.startsWith('abonelik') ||
    Boolean(meta.planSlug) ||
    Boolean(meta.planId);

  const isApiTopup =
    metaType === 'api_topup' ||
    notes.startsWith('api kredi') ||
    typeof meta.credits === 'number';

  if (!isSubscription && !isApiTopup) {
    return {
      eligible: false,
      orderType: 'other',
      reason:
        'Kullanıcı koşulsuz iade hakkı yalnızca API kredi paketleri ve abonelikler için geçerlidir. Dijital ürünler için lütfen destek ekibimizle iletişime geçin.',
    };
  }

  const orderType: 'api_topup' | 'subscription' = isApiTopup ? 'api_topup' : 'subscription';

  // 3. Süre kontrolü (1 gün / 24 saat kuralı)
  const purchaseDate = new Date(order.deliveredAt || order.createdAt);
  const timeCheck = isOrderWithinOneDay(purchaseDate);

  if (!timeCheck.isWithin) {
    return {
      eligible: false,
      orderType,
      reason: '1 günlük iade hakkı süresi (satın alımdan itibaren 24 saat) dolmuştur.',
      hoursRemaining: 0,
    };
  }

  const hoursRemaining = timeCheck.hoursRemaining;
  const effectiveUserId = order.userId || userId;

  if (!effectiveUserId) {
    return {
      eligible: false,
      orderType,
      reason: 'Siparişe bağlı kullanıcı hesabı tespit edilemedi.',
      hoursRemaining,
    };
  }

  // 4. Kullanım Kontrolü ("Hiçbir hakkını kullanmamış ise")
  if (isApiTopup) {
    let purchasedCredits = typeof meta.credits === 'number' ? meta.credits : 0;
    if (!purchasedCredits && prisma.apiCreditLedger?.findFirst) {
      const topup = await prisma.apiCreditLedger.findFirst({
        where: { orderId: order.id, reason: 'topup' },
      });
      if (topup) purchasedCredits = topup.delta;
    }

    // A: Satın alımdan sonra herhangi bir API çağrısı (kredi tüketimi) yapılmış mı?
    if (prisma.apiCreditLedger?.count) {
      const usageCount = await prisma.apiCreditLedger.count({
        where: {
          userId: effectiveUserId,
          reason: 'api_call',
          createdAt: { gte: purchaseDate },
        },
      });

      if (usageCount > 0) {
        return {
          eligible: false,
          orderType: 'api_topup',
          reason: `Satın alınan kredilerden kullanım yapıldığı için (${usageCount} API isteği) iade hakkı bulunmamaktadır.`,
          rightsUsed: usageCount,
          hoursRemaining,
          purchasedCredits,
        };
      }
    }

    // B: Kullanıcının mevcut kredi bakiyesi satın alınan miktardan az mı?
    if (prisma.user?.findUnique) {
      const user = await prisma.user.findUnique({
        where: { id: effectiveUserId },
        select: { apiCreditBalance: true },
      });
      const currentBalance = user?.apiCreditBalance ?? 0;
      if (purchasedCredits > 0 && currentBalance < purchasedCredits) {
        return {
          eligible: false,
          orderType: 'api_topup',
          reason: 'Mevcut kredi bakiyeniz satın alınan paketin altında olduğu için iade yapılamaz.',
          rightsUsed: purchasedCredits - currentBalance,
          hoursRemaining,
          purchasedCredits,
        };
      }
    }

    return {
      eligible: true,
      orderType: 'api_topup',
      hoursRemaining,
      rightsUsed: 0,
      purchasedCredits,
      periodStart: purchaseDate,
    };
  }

  // Abonelik Kullanım Kontrolü
  // A: Kullanıcının API anahtarlarıyla bu sipariş tarihinden sonra istek yapılmış mı?
  if (prisma.apiKey?.findMany && prisma.apiKeyUsage?.count) {
    const userKeys = await prisma.apiKey.findMany({
      where: { userId: effectiveUserId },
      select: { id: true },
    });
    const keyIds = userKeys.map((k) => k.id);

    if (keyIds.length > 0) {
      const requestCount = await prisma.apiKeyUsage.count({
        where: {
          apiKeyId: { in: keyIds },
          timestamp: { gte: purchaseDate },
        },
      });

      if (requestCount > 0) {
        return {
          eligible: false,
          orderType: 'subscription',
          reason: `Abonelik dönemi içinde API kullanımı yapıldığı için (${requestCount} istek) iade hakkı bulunmamaktadır.`,
          rightsUsed: requestCount,
          hoursRemaining,
          periodStart: purchaseDate,
        };
      }
    }
  }

  // B: Varsa siparişe bağlı lisanslardan aktive edilmiş olan var mı?
  const activatedLicenses = (order.licenses || []).filter(
    (l) => (l.currentActivations ?? 0) > 0
  );
  if (activatedLicenses.length > 0) {
    return {
      eligible: false,
      orderType: 'subscription',
      reason: 'Aboneliğe ait lisans anahtarı aktive edildiği için iade yapılamaz.',
      rightsUsed: activatedLicenses.length,
      hoursRemaining,
      periodStart: purchaseDate,
    };
  }

  return {
    eligible: true,
    orderType: 'subscription',
    hoursRemaining,
    rightsUsed: 0,
    periodStart: purchaseDate,
  };
}
