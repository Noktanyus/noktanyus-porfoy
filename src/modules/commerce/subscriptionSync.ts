/**
 * Subscription Sync — Subscription ↔ UserSubscription tek sözleşme
 *
 * Uygulamada iki abonelik tablosu var:
 *   - `Subscription`     → Customer + Plan bazlı, Stripe'ın birebir aynası
 *                          (stripeSubscriptionId unique, SubscriptionStatus enum)
 *   - `UserSubscription` → User + planSlug bazlı sadeleştirilmiş kayıt.
 *                          planGate / subscriptionPause / analytics bunu okur.
 *
 * Stripe webhook'u önceden SADECE `Subscription` yazıyordu; `UserSubscription`
 * hiç güncellenmiyordu. Yani kullanıcı ödeme yapsa bile planGate onu plansız
 * görüyordu. Bu dosya iki tabloyu tek noktadan senkronlar.
 *
 * TASARIM KURALLARI
 * -----------------
 * 1. IDEMPOTENT / REPLAY-SAFE: Aynı Stripe eventi kaç kez uygulanırsa uygulansın
 *    sonuç aynıdır. Stripe "at least once" teslim garantisi verir ve son eventi
 *    tekrar göndermek (webhook replay) normal bir operasyon adımıdır.
 * 2. YARIŞ DURUMU (race): İki webhook teslimi aynı anda gelirse ikisi de "kayıt
 *    yok" görüp create edebilir. Unique constraint (P2002) yakalanır ve update
 *    yoluna düşülür — event kaybolmaz, exception dışarı sızmaz.
 * 3. MEVCUT İLİŞKİLER KORUNUR: Customer ↔ User bağı burada KURULMAZ, sadece
 *    okunur. `customer.userId` yoksa `UserSubscription` yazılmaz (userId zorunlu
 *    alan; uydurma bir user'a bağlamak veri bozar).
 * 4. TRIAL KAYDINI EZME: Onboarding e-posta doğrulamasında kullanıcıya
 *    `stripeSubscriptionId = null` olan bir "trialing" UserSubscription açılır.
 *    Stripe'tan ilk gerçek abonelik geldiğinde bu satır YENİDEN OLUŞTURULMAZ,
 *    "adopt" edilir (üzerine yazılır) — kullanıcıda iki paralel abonelik satırı
 *    oluşmasın.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { SubscriptionStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

/**
 * Stripe subscription.status → Prisma `SubscriptionStatus` enum.
 *
 * Eskiden `status.toUpperCase()` yapılıyordu. Bu, Stripe'ın enum'da olmayan bir
 * status'u (ör. ileride eklenecek bir değer) göndermesi durumunda Prisma'da
 * runtime hatası doğuruyordu ve webhook 500 dönüyordu. Artık açık tablo var.
 */
export const STRIPE_TO_SUBSCRIPTION_STATUS: Record<string, SubscriptionStatus> = {
  active: 'ACTIVE',
  trialing: 'TRIALING',
  past_due: 'PAST_DUE',
  canceled: 'CANCELED',
  incomplete: 'INCOMPLETE',
  incomplete_expired: 'INCOMPLETE_EXPIRED',
  unpaid: 'UNPAID',
  paused: 'PAUSED',
};

/**
 * Stripe subscription.status → `UserSubscription.status` (serbest string kolon).
 *
 * Kullanılan sözlük uygulamanın MEVCUT değerleridir; yeni bir vocabulary
 * uydurulmadı:
 *   - 'active'   → planGate.getUserPlan yalnızca bunu plan sayar
 *   - 'trialing' → onboarding/service.ts verifyEmail bunu yazıyor
 *   - 'paused'   → subscriptionPause.ts bunu yazıyor
 *   - 'cancelled'→ analytics/service.ts churn sayımı bunu okuyor (çift 'l')
 *   - 'expired'  → schema.prisma yorumunda tanımlı
 *
 * DİKKAT — `past_due` bilinçli olarak 'active' YAPILMADI: ödeme başarısızken
 * planGate erişim vermeye devam etseydi ücretsiz kullanım açığı olurdu. Grace
 * period bir ürün kararıdır, burada varsayılmaz.
 */
export const STRIPE_TO_USER_SUBSCRIPTION_STATUS: Record<string, string> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  canceled: 'cancelled',
  incomplete: 'incomplete',
  incomplete_expired: 'expired',
  unpaid: 'expired',
  paused: 'paused',
};

/** Bilinmeyen Stripe status'u için güvenli varsayılan (erişim vermez). */
export const FALLBACK_SUBSCRIPTION_STATUS: SubscriptionStatus = 'INCOMPLETE';
export const FALLBACK_USER_SUBSCRIPTION_STATUS = 'incomplete';

export function mapStripeStatus(stripeStatus: string | null | undefined): SubscriptionStatus {
  if (!stripeStatus) return FALLBACK_SUBSCRIPTION_STATUS;
  const mapped = STRIPE_TO_SUBSCRIPTION_STATUS[stripeStatus.toLowerCase()];
  if (!mapped) {
    logger.warn('[subscriptionSync] Bilinmeyen Stripe status, INCOMPLETE varsayıldı', {
      stripeStatus,
    });
    return FALLBACK_SUBSCRIPTION_STATUS;
  }
  return mapped;
}

export function mapStripeStatusToUserStatus(stripeStatus: string | null | undefined): string {
  if (!stripeStatus) return FALLBACK_USER_SUBSCRIPTION_STATUS;
  return (
    STRIPE_TO_USER_SUBSCRIPTION_STATUS[stripeStatus.toLowerCase()] ??
    FALLBACK_USER_SUBSCRIPTION_STATUS
  );
}

// ---------------------------------------------------------------------------
// Normalized input
// ---------------------------------------------------------------------------

/**
 * Stripe'ın `Subscription` objesinden çıkarılmış, provider'dan bağımsız şekil.
 * Webhook payload'ını doğrudan servise sızdırmamak için ayrı tutulur.
 */
export interface SubscriptionSyncInput {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  /** Ham Stripe status string'i ('active', 'past_due', ...) */
  stripeStatus: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  canceledAt?: Date | null;
}

export interface SubscriptionSyncResult {
  /** Senkron uygulandı mı (false → customer/plan bulunamadı, atlandı) */
  synced: boolean;
  /** Neden atlandı (synced=false ise dolu) */
  skippedReason?: 'unknown-customer' | 'unknown-plan';
  subscriptionId?: string;
  /** Customer bir User'a bağlı değilse UserSubscription yazılmaz */
  userSubscriptionId?: string | null;
  userSubscriptionSkipped?: 'no-user-link';
  status?: SubscriptionStatus;
  userStatus?: string;
}

/** Prisma unique-constraint hatası mı? */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === 'P2002'
  );
}

/** Stripe epoch (saniye) → Date. Null/0 güvenli. */
export function fromStripeEpoch(seconds: unknown): Date | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return new Date(seconds * 1000);
}

/**
 * Ham Stripe subscription objesini `SubscriptionSyncInput`a çevirir.
 * Eksik/bozuk alanlarda null döner — çağıran atlar, webhook 500 olmaz.
 */
export function normalizeStripeSubscription(
  sub: Record<string, unknown>
): SubscriptionSyncInput | null {
  const stripeSubscriptionId = typeof sub.id === 'string' ? sub.id : null;
  const stripeCustomerId =
    typeof sub.customer === 'string'
      ? sub.customer
      : typeof (sub.customer as { id?: string })?.id === 'string'
        ? (sub.customer as { id: string }).id
        : null;

  const items = sub.items as { data?: Array<{ price?: { id?: string } }> } | undefined;
  const stripePriceId = items?.data?.[0]?.price?.id ?? null;

  if (!stripeSubscriptionId || !stripeCustomerId || !stripePriceId) {
    logger.warn('[subscriptionSync] Stripe subscription payload eksik alan içeriyor', {
      hasId: Boolean(stripeSubscriptionId),
      hasCustomer: Boolean(stripeCustomerId),
      hasPrice: Boolean(stripePriceId),
    });
    return null;
  }

  const now = new Date();
  const currentPeriodStart = fromStripeEpoch(sub.current_period_start) ?? now;
  const currentPeriodEnd = fromStripeEpoch(sub.current_period_end) ?? now;

  return {
    stripeSubscriptionId,
    stripeCustomerId,
    stripePriceId,
    stripeStatus: typeof sub.status === 'string' ? sub.status : '',
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancel_at_period_end === true,
    trialStart: fromStripeEpoch(sub.trial_start),
    trialEnd: fromStripeEpoch(sub.trial_end),
    canceledAt: fromStripeEpoch(sub.canceled_at),
  };
}

// ---------------------------------------------------------------------------
// Core sync
// ---------------------------------------------------------------------------

export const subscriptionSyncService = {
  /**
   * Stripe aboneliğini `Subscription` + `UserSubscription` tablolarına yazar.
   * Idempotent: aynı input tekrar uygulanabilir.
   */
  async syncFromStripe(input: SubscriptionSyncInput): Promise<SubscriptionSyncResult> {
    const customer = await prisma.customer.findUnique({
      where: { stripeCustomerId: input.stripeCustomerId },
      select: { id: true, userId: true },
    });
    if (!customer) {
      // Customer/User ilişkisi burada KURULMAZ — sadece okunur (bkz. kural 3).
      logger.warn('[subscriptionSync] Bilinmeyen Stripe customer, atlandı', {
        stripeCustomerId: input.stripeCustomerId,
      });
      return { synced: false, skippedReason: 'unknown-customer' };
    }

    const plan = await prisma.plan.findUnique({
      where: { stripePriceId: input.stripePriceId },
      select: { id: true, slug: true },
    });
    if (!plan) {
      logger.warn('[subscriptionSync] Bilinmeyen Stripe price, atlandı', {
        stripePriceId: input.stripePriceId,
      });
      return { synced: false, skippedReason: 'unknown-plan' };
    }

    const status = mapStripeStatus(input.stripeStatus);
    const userStatus = mapStripeStatusToUserStatus(input.stripeStatus);

    // --- 1. Subscription (Stripe aynası) ---
    const subscription = await this.upsertSubscription(input, {
      customerId: customer.id,
      planId: plan.id,
      status,
    });

    // --- 2. UserSubscription (uygulama tarafı) ---
    if (!customer.userId) {
      logger.info('[subscriptionSync] Customer bir User.a bağlı değil, UserSubscription atlandı', {
        customerId: customer.id,
        stripeSubscriptionId: input.stripeSubscriptionId,
      });
      return {
        synced: true,
        subscriptionId: subscription?.id,
        userSubscriptionId: null,
        userSubscriptionSkipped: 'no-user-link',
        status,
        userStatus,
      };
    }

    const userSubscription = await this.upsertUserSubscription({
      userId: customer.userId,
      planSlug: plan.slug,
      status: userStatus,
      stripeSubscriptionId: input.stripeSubscriptionId,
      expiresAt: input.currentPeriodEnd,
      startedAt: input.currentPeriodStart,
      autoRenew: !input.cancelAtPeriodEnd,
      trialEndsAt: input.trialEnd ?? null,
    });

    logger.info('[subscriptionSync] Abonelik senkronlandı', {
      stripeSubscriptionId: input.stripeSubscriptionId,
      subscriptionId: subscription?.id,
      userSubscriptionId: userSubscription?.id,
      status,
      userStatus,
    });

    return {
      synced: true,
      subscriptionId: subscription?.id,
      userSubscriptionId: userSubscription?.id,
      status,
      userStatus,
    };
  },

  /**
   * `Subscription` upsert'i. stripeSubscriptionId unique olduğu için
   * doğal olarak idempotent.
   */
  async upsertSubscription(
    input: SubscriptionSyncInput,
    resolved: { customerId: string; planId: string; status: SubscriptionStatus }
  ): Promise<{ id: string }> {
    const shared = {
      stripeStatus: input.stripeStatus,
      status: resolved.status,
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd,
      trialStart: input.trialStart ?? null,
      trialEnd: input.trialEnd ?? null,
      canceledAt: input.canceledAt ?? null,
    };

    return prisma.subscription.upsert({
      where: { stripeSubscriptionId: input.stripeSubscriptionId },
      create: {
        customerId: resolved.customerId,
        planId: resolved.planId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        ...shared,
      },
      // planId güncellenir: kullanıcı plan yükseltirse price değişir.
      update: {
        planId: resolved.planId,
        ...shared,
      },
    });
  },

  /**
   * `UserSubscription` upsert'i — 3 aşamalı eşleşme:
   *   1. stripeSubscriptionId ile (unique) → update
   *   2. Kullanıcının Stripe'a bağlanmamış mevcut satırı → adopt (trial devri)
   *   3. Yoksa create (P2002 yarışında 1'e geri düşer)
   */
  async upsertUserSubscription(data: {
    userId: string;
    planSlug: string;
    status: string;
    stripeSubscriptionId: string;
    expiresAt: Date;
    startedAt: Date;
    autoRenew: boolean;
    trialEndsAt: Date | null;
  }): Promise<{ id: string }> {
    const writable = {
      planSlug: data.planSlug,
      status: data.status,
      expiresAt: data.expiresAt,
      autoRenew: data.autoRenew,
      trialEndsAt: data.trialEndsAt,
      stripeSubscriptionId: data.stripeSubscriptionId,
    };

    // 1. Bu Stripe aboneliği daha önce yazıldı mı?
    const byStripeId = await prisma.userSubscription.findUnique({
      where: { stripeSubscriptionId: data.stripeSubscriptionId },
      select: { id: true },
    });
    if (byStripeId) {
      return prisma.userSubscription.update({
        where: { id: byStripeId.id },
        data: writable,
      });
    }

    // 2. Kullanıcının Stripe'a bağlanmamış (onboarding trial) satırını devral.
    const adoptable = await prisma.userSubscription.findFirst({
      where: { userId: data.userId, stripeSubscriptionId: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (adoptable) {
      return prisma.userSubscription.update({
        where: { id: adoptable.id },
        data: writable,
      });
    }

    // 3. Yeni kayıt. Eşzamanlı ikinci teslim aynı anda buraya girerse
    //    stripeSubscriptionId unique constraint'i patlar → 1. adıma dön.
    try {
      return await prisma.userSubscription.create({
        data: {
          userId: data.userId,
          startedAt: data.startedAt,
          ...writable,
        },
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;

      logger.warn('[subscriptionSync] UserSubscription yarış durumu, update.e düşülüyor', {
        stripeSubscriptionId: data.stripeSubscriptionId,
      });
      const raced = await prisma.userSubscription.findUnique({
        where: { stripeSubscriptionId: data.stripeSubscriptionId },
        select: { id: true },
      });
      if (!raced) throw err;
      return prisma.userSubscription.update({
        where: { id: raced.id },
        data: writable,
      });
    }
  },

  /**
   * `customer.subscription.deleted` karşılığı. Subscription'ı CANCELED yapar ve
   * varsa UserSubscription'ı 'cancelled' işaretler.
   *
   * Idempotent: kayıt yoksa sessizce atlar (silinmiş abonelik için gelen
   * tekrarlı event 500 döndürmemeli).
   */
  async cancelFromStripe(input: {
    stripeSubscriptionId: string;
    canceledAt?: Date | null;
  }): Promise<{ synced: boolean; userSubscriptionUpdated: boolean }> {
    const canceledAt = input.canceledAt ?? new Date();

    const existing = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: input.stripeSubscriptionId },
      select: { id: true },
    });
    if (!existing) {
      logger.warn('[subscriptionSync] İptal eventi bilinmeyen abonelik için geldi', {
        stripeSubscriptionId: input.stripeSubscriptionId,
      });
      return { synced: false, userSubscriptionUpdated: false };
    }

    await prisma.subscription.update({
      where: { id: existing.id },
      data: { status: 'CANCELED', stripeStatus: 'canceled', canceledAt },
    });

    // updateMany: satır yoksa 0 döner, exception atmaz → replay güvenli.
    const result = await prisma.userSubscription.updateMany({
      where: { stripeSubscriptionId: input.stripeSubscriptionId },
      data: { status: 'cancelled', autoRenew: false },
    });

    return { synced: true, userSubscriptionUpdated: result.count > 0 };
  },

  /**
   * Onboarding (trial) tarafının kullandığı sözleşme.
   *
   * `verifyEmail` içindeki inline create yerine buradan geçer; böylece trial
   * satırı ile Stripe'tan gelen satır AYNI kurallarla yazılır ve ileride Stripe
   * aboneliği geldiğinde `upsertUserSubscription` bunu devralabilir.
   *
   * `tx` parametresi opsiyoneldir — onboarding kendi transaction'ı içinde çağırır.
   */
  async ensureTrialUserSubscription(
    data: {
      userId: string;
      planSlug: string;
      trialDays: number;
      now?: Date;
    },
    tx?: TrialTxClient
  ): Promise<{ created: boolean; id?: string }> {
    const db = tx ?? prisma;
    const now = data.now ?? new Date();
    const expiresAt = new Date(now);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + data.trialDays);

    // Idempotent: hâlihazırda geçerli bir abonelik varsa dokunma.
    const existing = await db.userSubscription.findFirst({
      where: {
        userId: data.userId,
        status: { in: ['active', 'trialing'] },
        expiresAt: { gt: now },
      },
      select: { id: true },
    });
    if (existing) return { created: false, id: existing?.id };

    const created = await db.userSubscription.create({
      data: {
        userId: data.userId,
        planSlug: data.planSlug,
        status: 'trialing',
        startedAt: now,
        expiresAt,
        trialEndsAt: expiresAt,
        autoRenew: false,
      },
    });
    // `created?.id`: eski onboarding kodu create'in dönüşünü hiç okumuyordu.
    // Dönüşe zorunlu bağımlılık kurmak, bu fonksiyonu çağıran akışı (e-posta
    // doğrulama) create'in şekline duyarlı hale getirir. id bilgi amaçlıdır.
    return { created: true, id: created?.id };
  },
};

/**
 * Onboarding transaction client'ının bu servise yeten minimal yüzeyi.
 * `Prisma.TransactionClient` tamamını istemiyoruz — mock'laması zorlaşır.
 *
 * Metot sözdizimi (property değil) bilinçli: TS'te metotlar bivariant olduğu
 * için gerçek Prisma delegate'i `strictFunctionTypes` altında da atanabilir.
 */
export interface TrialTxClient {
  userSubscription: {
    findFirst(args: any): Promise<any>;
    create(args: any): Promise<any>;
  };
}
