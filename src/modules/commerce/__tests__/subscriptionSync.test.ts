/**
 * Subscription Sync Tests (item 1)
 *
 * Kapsam:
 *   - Stripe status → Prisma enum / UserSubscription string eşlemesi
 *   - Stripe payload normalizasyonu (eksik alan toleransı)
 *   - Subscription + UserSubscription birlikte senkronu
 *   - IDEMPOTENCY: aynı eventi tekrar uygulamak (webhook replay)
 *   - YARIŞ DURUMU: eşzamanlı iki teslimde P2002 → update'e düşme
 *   - Mevcut Customer/User ilişkisinin BOZULMAMASI
 *   - Onboarding trial satırının devralınması (adopt)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: { findUnique: vi.fn(), update: vi.fn() },
    plan: { findUnique: vi.fn() },
    subscription: { upsert: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    userSubscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import {
  subscriptionSyncService,
  mapStripeStatus,
  mapStripeStatusToUserStatus,
  normalizeStripeSubscription,
  fromStripeEpoch,
  STRIPE_TO_SUBSCRIPTION_STATUS,
  STRIPE_TO_USER_SUBSCRIPTION_STATUS,
} from '../subscriptionSync';

const NOW_SEC = 1_700_000_000;

/** Gerçekçi bir Stripe subscription payload'ı üretir. */
function stripeSub(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_123',
    customer: 'cus_123',
    status: 'active',
    current_period_start: NOW_SEC,
    current_period_end: NOW_SEC + 30 * 86_400,
    cancel_at_period_end: false,
    trial_start: null,
    trial_end: null,
    canceled_at: null,
    items: { data: [{ price: { id: 'price_pro' } }] },
    ...overrides,
  };
}

function mockResolved(opts: { userId?: string | null } = {}) {
  vi.mocked(prisma.customer.findUnique).mockResolvedValue({
    id: 'cust_db_1',
    userId: opts.userId === undefined ? 'user_1' : opts.userId,
  } as any);
  vi.mocked(prisma.plan.findUnique).mockResolvedValue({
    id: 'plan_db_1',
    slug: 'pro',
  } as any);
  vi.mocked(prisma.subscription.upsert).mockResolvedValue({ id: 'sub_db_1' } as any);
}

describe('Stripe status mapping', () => {
  it('tüm Stripe status.leri Prisma SubscriptionStatus enum.una eşler', () => {
    // Prisma enum değerleri (schema.prisma SubscriptionStatus)
    const enumValues = [
      'ACTIVE',
      'TRIALING',
      'PAST_DUE',
      'CANCELED',
      'INCOMPLETE',
      'INCOMPLETE_EXPIRED',
      'UNPAID',
      'PAUSED',
    ];
    for (const mapped of Object.values(STRIPE_TO_SUBSCRIPTION_STATUS)) {
      expect(enumValues).toContain(mapped);
    }
    // Stripe'ın yayınladığı tüm subscription status'ları kapsanmalı
    expect(Object.keys(STRIPE_TO_SUBSCRIPTION_STATUS).sort()).toEqual(
      [
        'active',
        'canceled',
        'incomplete',
        'incomplete_expired',
        'past_due',
        'paused',
        'trialing',
        'unpaid',
      ].sort()
    );
  });

  it('snake_case status.ları doğru enum.a çevirir (toUpperCase yeterli değil)', () => {
    expect(mapStripeStatus('incomplete_expired')).toBe('INCOMPLETE_EXPIRED');
    expect(mapStripeStatus('past_due')).toBe('PAST_DUE');
    expect(mapStripeStatus('active')).toBe('ACTIVE');
  });

  it('büyük/küçük harf duyarsızdır', () => {
    expect(mapStripeStatus('ACTIVE')).toBe('ACTIVE');
    expect(mapStripeStatus('Trialing')).toBe('TRIALING');
  });

  it('bilinmeyen status.ta patlamaz, INCOMPLETE döner', () => {
    // Eski kod status.toUpperCase() yapıp Prisma'ya veriyordu → runtime hata.
    expect(mapStripeStatus('some_future_status')).toBe('INCOMPLETE');
    expect(mapStripeStatus(undefined)).toBe('INCOMPLETE');
    expect(mapStripeStatus('')).toBe('INCOMPLETE');
  });

  it('UserSubscription status sözlüğü uygulamanın mevcut değerlerini kullanır', () => {
    // planGate 'active', onboarding 'trialing', pause 'paused',
    // analytics 'cancelled' okuyor — bu değerler korunmalı.
    expect(mapStripeStatusToUserStatus('active')).toBe('active');
    expect(mapStripeStatusToUserStatus('trialing')).toBe('trialing');
    expect(mapStripeStatusToUserStatus('paused')).toBe('paused');
    expect(mapStripeStatusToUserStatus('canceled')).toBe('cancelled');
    expect(mapStripeStatusToUserStatus('unpaid')).toBe('expired');
  });

  it('past_due bilinçli olarak "active" DEĞİL (ödeme başarısızken erişim verilmez)', () => {
    expect(STRIPE_TO_USER_SUBSCRIPTION_STATUS['past_due']).not.toBe('active');
    expect(mapStripeStatusToUserStatus('past_due')).toBe('past_due');
  });
});

describe('fromStripeEpoch', () => {
  it('saniyeyi Date.e çevirir', () => {
    expect(fromStripeEpoch(NOW_SEC)?.getTime()).toBe(NOW_SEC * 1000);
  });

  it('null/0/NaN için null döner', () => {
    expect(fromStripeEpoch(null)).toBeNull();
    expect(fromStripeEpoch(0)).toBeNull();
    expect(fromStripeEpoch(undefined)).toBeNull();
    expect(fromStripeEpoch(Number.NaN)).toBeNull();
    expect(fromStripeEpoch('1700000000')).toBeNull();
  });
});

describe('normalizeStripeSubscription', () => {
  it('tam payload.ı normalize eder', () => {
    const input = normalizeStripeSubscription(stripeSub());
    expect(input).toMatchObject({
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
      stripePriceId: 'price_pro',
      stripeStatus: 'active',
      cancelAtPeriodEnd: false,
    });
  });

  it('customer expanded obje olarak gelirse id.yi çıkarır', () => {
    const input = normalizeStripeSubscription(
      stripeSub({ customer: { id: 'cus_expanded' } })
    );
    expect(input?.stripeCustomerId).toBe('cus_expanded');
  });

  it('eksik id/customer/price için null döner (webhook 500 olmasın)', () => {
    expect(normalizeStripeSubscription(stripeSub({ id: undefined }))).toBeNull();
    expect(normalizeStripeSubscription(stripeSub({ customer: null }))).toBeNull();
    expect(normalizeStripeSubscription(stripeSub({ items: { data: [] } }))).toBeNull();
    expect(normalizeStripeSubscription({})).toBeNull();
  });

  it('trial alanlarını Date.e çevirir', () => {
    const input = normalizeStripeSubscription(
      stripeSub({ trial_start: NOW_SEC, trial_end: NOW_SEC + 86_400 })
    );
    expect(input?.trialStart).toBeInstanceOf(Date);
    expect(input?.trialEnd?.getTime()).toBe((NOW_SEC + 86_400) * 1000);
  });
});

describe('syncFromStripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Subscription ve UserSubscription.ı birlikte yazar', async () => {
    mockResolved({ userId: 'user_1' });
    vi.mocked(prisma.userSubscription.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.userSubscription.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.userSubscription.create).mockResolvedValue({ id: 'usub_1' } as any);

    const input = normalizeStripeSubscription(stripeSub())!;
    const result = await subscriptionSyncService.syncFromStripe(input);

    expect(result.synced).toBe(true);
    expect(result.subscriptionId).toBe('sub_db_1');
    expect(result.userSubscriptionId).toBe('usub_1');

    // Subscription: stripeSubscriptionId üzerinden upsert (idempotent)
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stripeSubscriptionId: 'sub_123' } })
    );

    // UserSubscription: plan slug + status + stripe id bağlandı
    expect(prisma.userSubscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user_1',
          planSlug: 'pro',
          status: 'active',
          stripeSubscriptionId: 'sub_123',
          autoRenew: true,
        }),
      })
    );
  });

  it('cancel_at_period_end true ise autoRenew false olur', async () => {
    mockResolved({ userId: 'user_1' });
    vi.mocked(prisma.userSubscription.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.userSubscription.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.userSubscription.create).mockResolvedValue({ id: 'usub_1' } as any);

    const input = normalizeStripeSubscription(stripeSub({ cancel_at_period_end: true }))!;
    await subscriptionSyncService.syncFromStripe(input);

    expect(prisma.userSubscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ autoRenew: false }),
      })
    );
  });

  it('expiresAt = currentPeriodEnd olarak yazılır', async () => {
    mockResolved({ userId: 'user_1' });
    vi.mocked(prisma.userSubscription.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.userSubscription.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.userSubscription.create).mockResolvedValue({ id: 'usub_1' } as any);

    const input = normalizeStripeSubscription(stripeSub())!;
    await subscriptionSyncService.syncFromStripe(input);

    const call = vi.mocked(prisma.userSubscription.create).mock.calls[0]![0] as any;
    expect(call.data.expiresAt.getTime()).toBe((NOW_SEC + 30 * 86_400) * 1000);
  });

  it('bilinmeyen Stripe customer.da atlar (Customer/User ilişkisi UYDURULMAZ)', async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);

    const input = normalizeStripeSubscription(stripeSub())!;
    const result = await subscriptionSyncService.syncFromStripe(input);

    expect(result).toEqual({ synced: false, skippedReason: 'unknown-customer' });
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    expect(prisma.userSubscription.create).not.toHaveBeenCalled();
    // Mevcut ilişkiye dokunulmadı
    expect(prisma.customer.update).not.toHaveBeenCalled();
  });

  it('bilinmeyen price.ta atlar', async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({
      id: 'cust_db_1',
      userId: 'user_1',
    } as any);
    vi.mocked(prisma.plan.findUnique).mockResolvedValue(null);

    const input = normalizeStripeSubscription(stripeSub())!;
    const result = await subscriptionSyncService.syncFromStripe(input);

    expect(result).toEqual({ synced: false, skippedReason: 'unknown-plan' });
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it('Customer bir User.a bağlı değilse Subscription yazılır, UserSubscription ATLANIR', async () => {
    mockResolved({ userId: null });

    const input = normalizeStripeSubscription(stripeSub())!;
    const result = await subscriptionSyncService.syncFromStripe(input);

    expect(result.synced).toBe(true);
    expect(result.subscriptionId).toBe('sub_db_1');
    expect(result.userSubscriptionId).toBeNull();
    expect(result.userSubscriptionSkipped).toBe('no-user-link');
    // userId zorunlu alan — uydurma bir user'a bağlanmadı
    expect(prisma.userSubscription.create).not.toHaveBeenCalled();
    expect(prisma.userSubscription.update).not.toHaveBeenCalled();
  });

  it('plan yükseltmede Subscription.ın planId.si güncellenir', async () => {
    mockResolved({ userId: 'user_1' });
    vi.mocked(prisma.userSubscription.findUnique).mockResolvedValue({ id: 'usub_1' } as any);
    vi.mocked(prisma.userSubscription.update).mockResolvedValue({ id: 'usub_1' } as any);

    const input = normalizeStripeSubscription(stripeSub())!;
    await subscriptionSyncService.syncFromStripe(input);

    const call = vi.mocked(prisma.subscription.upsert).mock.calls[0]![0] as any;
    expect(call.update.planId).toBe('plan_db_1');
  });
});

describe('syncFromStripe — idempotency / replay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aynı event iki kez uygulanırsa ikinci seferde UPDATE yolundan geçer (duplicate yok)', async () => {
    mockResolved({ userId: 'user_1' });

    // 1. teslim: kayıt yok → create
    vi.mocked(prisma.userSubscription.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.userSubscription.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.userSubscription.create).mockResolvedValueOnce({ id: 'usub_1' } as any);

    const input = normalizeStripeSubscription(stripeSub())!;
    const first = await subscriptionSyncService.syncFromStripe(input);

    // 2. teslim (replay): artık stripeSubscriptionId ile bulunur → update
    vi.mocked(prisma.userSubscription.findUnique).mockResolvedValueOnce({
      id: 'usub_1',
    } as any);
    vi.mocked(prisma.userSubscription.update).mockResolvedValueOnce({ id: 'usub_1' } as any);

    const second = await subscriptionSyncService.syncFromStripe(input);

    expect(first.userSubscriptionId).toBe('usub_1');
    expect(second.userSubscriptionId).toBe('usub_1');
    // create yalnızca 1 kez çağrıldı → duplicate satır oluşmadı
    expect(prisma.userSubscription.create).toHaveBeenCalledTimes(1);
    expect(prisma.userSubscription.update).toHaveBeenCalledTimes(1);
  });

  it('son event tekrar uygulanabilir: sonuç aynı ve stripeSubscriptionId sabit', async () => {
    mockResolved({ userId: 'user_1' });
    vi.mocked(prisma.userSubscription.findUnique).mockResolvedValue({ id: 'usub_1' } as any);
    vi.mocked(prisma.userSubscription.update).mockResolvedValue({ id: 'usub_1' } as any);

    const input = normalizeStripeSubscription(stripeSub({ status: 'past_due' }))!;

    const r1 = await subscriptionSyncService.syncFromStripe(input);
    const r2 = await subscriptionSyncService.syncFromStripe(input);
    const r3 = await subscriptionSyncService.syncFromStripe(input);

    expect(r1).toEqual(r2);
    expect(r2).toEqual(r3);
    expect(r1.userStatus).toBe('past_due');
    expect(r1.status).toBe('PAST_DUE');
  });
});

describe('upsertUserSubscription — trial devri (adopt) ve yarış durumu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const base = {
    userId: 'user_1',
    planSlug: 'pro',
    status: 'active',
    stripeSubscriptionId: 'sub_123',
    expiresAt: new Date(NOW_SEC * 1000),
    startedAt: new Date(NOW_SEC * 1000),
    autoRenew: true,
    trialEndsAt: null,
  };

  it('onboarding trial satırını (stripeSubscriptionId=null) DEVRALIR, yeni satır açmaz', async () => {
    vi.mocked(prisma.userSubscription.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.userSubscription.findFirst).mockResolvedValue({
      id: 'usub_trial',
    } as any);
    vi.mocked(prisma.userSubscription.update).mockResolvedValue({ id: 'usub_trial' } as any);

    const result = await subscriptionSyncService.upsertUserSubscription(base);

    expect(result.id).toBe('usub_trial');
    expect(prisma.userSubscription.create).not.toHaveBeenCalled();
    expect(prisma.userSubscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user_1', stripeSubscriptionId: null },
      })
    );
    // Trial satırı Stripe aboneliğine bağlandı
    expect(prisma.userSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'usub_trial' },
        data: expect.objectContaining({
          stripeSubscriptionId: 'sub_123',
          planSlug: 'pro',
          status: 'active',
        }),
      })
    );
  });

  it('eşzamanlı iki teslimde P2002 yakalanır ve update.e düşülür (event kaybolmaz)', async () => {
    // Her iki teslim de "kayıt yok" gördü
    vi.mocked(prisma.userSubscription.findUnique)
      .mockResolvedValueOnce(null) // 1. arama: yok
      .mockResolvedValueOnce({ id: 'usub_winner' } as any); // P2002 sonrası: var
    vi.mocked(prisma.userSubscription.findFirst).mockResolvedValue(null);

    const p2002 = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    vi.mocked(prisma.userSubscription.create).mockRejectedValue(p2002);
    vi.mocked(prisma.userSubscription.update).mockResolvedValue({
      id: 'usub_winner',
    } as any);

    const result = await subscriptionSyncService.upsertUserSubscription(base);

    // Kaybeden teslim de doğru satıra yazdı — hata dışarı sızmadı
    expect(result.id).toBe('usub_winner');
    expect(prisma.userSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'usub_winner' } })
    );
  });

  it('P2002 dışındaki hatalar yukarı fırlatılır (sessizce yutulmaz)', async () => {
    vi.mocked(prisma.userSubscription.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.userSubscription.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.userSubscription.create).mockRejectedValue(
      Object.assign(new Error('connection lost'), { code: 'P1001' })
    );

    await expect(subscriptionSyncService.upsertUserSubscription(base)).rejects.toThrow(
      'connection lost'
    );
  });
});

describe('cancelFromStripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Subscription.ı CANCELED, UserSubscription.ı cancelled yapar', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ id: 'sub_db_1' } as any);
    vi.mocked(prisma.subscription.update).mockResolvedValue({} as any);
    vi.mocked(prisma.userSubscription.updateMany).mockResolvedValue({ count: 1 } as any);

    const result = await subscriptionSyncService.cancelFromStripe({
      stripeSubscriptionId: 'sub_123',
    });

    expect(result).toEqual({ synced: true, userSubscriptionUpdated: true });
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CANCELED', stripeStatus: 'canceled' }),
      })
    );
    expect(prisma.userSubscription.updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_123' },
      data: { status: 'cancelled', autoRenew: false },
    });
  });

  it('bilinmeyen abonelik için hata FIRLATMAZ (replay güvenli)', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

    const result = await subscriptionSyncService.cancelFromStripe({
      stripeSubscriptionId: 'sub_unknown',
    });

    expect(result).toEqual({ synced: false, userSubscriptionUpdated: false });
    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });

  it('UserSubscription satırı yoksa updateMany count=0 döner, patlamaz', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ id: 'sub_db_1' } as any);
    vi.mocked(prisma.subscription.update).mockResolvedValue({} as any);
    vi.mocked(prisma.userSubscription.updateMany).mockResolvedValue({ count: 0 } as any);

    const result = await subscriptionSyncService.cancelFromStripe({
      stripeSubscriptionId: 'sub_123',
    });

    expect(result).toEqual({ synced: true, userSubscriptionUpdated: false });
  });

  it('iptal eventi iki kez uygulanabilir (idempotent)', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ id: 'sub_db_1' } as any);
    vi.mocked(prisma.subscription.update).mockResolvedValue({} as any);
    vi.mocked(prisma.userSubscription.updateMany).mockResolvedValue({ count: 1 } as any);

    const a = await subscriptionSyncService.cancelFromStripe({
      stripeSubscriptionId: 'sub_123',
    });
    const b = await subscriptionSyncService.cancelFromStripe({
      stripeSubscriptionId: 'sub_123',
    });

    expect(a).toEqual(b);
  });
});

describe('ensureTrialUserSubscription — onboarding ile paylaşılan sözleşme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Onboarding'in verdiği tx client'ını taklit eder. */
  function fakeTx(existing: { id: string } | null) {
    return {
      userSubscription: {
        findFirst: vi.fn(async (_args?: unknown) => existing),
        create: vi.fn(async (_args?: unknown) => ({ id: 'usub_new' })),
      },
    };
  }

  it('geçerli abonelik varsa yeni satır OLUŞTURMAZ (idempotent)', async () => {
    const tx = fakeTx({ id: 'usub_existing' });

    const result = await subscriptionSyncService.ensureTrialUserSubscription(
      { userId: 'user_1', planSlug: 'starter', trialDays: 14 },
      tx
    );

    expect(result).toEqual({ created: false, id: 'usub_existing' });
    expect(tx.userSubscription.create).not.toHaveBeenCalled();
  });

  it('abonelik yoksa trialing satırı oluşturur', async () => {
    const tx = fakeTx(null);
    const now = new Date('2026-01-01T00:00:00.000Z');

    const result = await subscriptionSyncService.ensureTrialUserSubscription(
      { userId: 'user_1', planSlug: 'starter', trialDays: 14, now },
      tx
    );

    expect(result).toEqual({ created: true, id: 'usub_new' });
    const call = tx.userSubscription.create.mock.calls[0]![0] as any;
    expect(call.data).toMatchObject({
      userId: 'user_1',
      planSlug: 'starter',
      status: 'trialing',
      autoRenew: false,
    });
    // 14 gün sonrası
    expect(call.data.expiresAt.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    expect(call.data.trialEndsAt.toISOString()).toBe('2026-01-15T00:00:00.000Z');
  });

  it('trial satırı stripeSubscriptionId ALMAZ — böylece sonra adopt edilebilir', async () => {
    const tx = fakeTx(null);

    await subscriptionSyncService.ensureTrialUserSubscription(
      { userId: 'user_1', planSlug: 'starter', trialDays: 7 },
      tx
    );

    const call = tx.userSubscription.create.mock.calls[0]![0] as any;
    expect(call.data.stripeSubscriptionId).toBeUndefined();
  });

  it('tx verilmezse global prisma client.ını kullanır', async () => {
    vi.mocked(prisma.userSubscription.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.userSubscription.create).mockResolvedValue({ id: 'usub_g' } as any);

    const result = await subscriptionSyncService.ensureTrialUserSubscription({
      userId: 'user_1',
      planSlug: 'starter',
      trialDays: 14,
    });

    expect(result).toEqual({ created: true, id: 'usub_g' });
    expect(prisma.userSubscription.create).toHaveBeenCalled();
  });
});
