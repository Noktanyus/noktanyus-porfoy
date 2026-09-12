/**
 * Onboarding ↔ subscriptionSync Sözleşme Testi (item 1)
 *
 * Stripe webhook'u ve onboarding e-posta doğrulaması AYNI sözleşmeden geçmeli.
 * Aksi halde iki taraf `UserSubscription` satırını farklı kurallarla yazar ve
 * kullanıcıda paralel/çelişkili abonelik oluşur.
 *
 * Burada onboarding'in `verifyEmail` akışının gerçekten
 * `subscriptionSyncService.ensureTrialUserSubscription`e delege ettiği ve
 * transaction client'ını AKTARDIĞI doğrulanır.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const txMock = {
  user: { update: vi.fn() },
  userSubscription: { findFirst: vi.fn(), create: vi.fn() },
  plan: { findUnique: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    userSubscription: { findFirst: vi.fn(), create: vi.fn() },
    plan: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(async (cb: any) => cb(txMock)),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/emailService', () => ({ sendEmail: vi.fn(async () => ({ success: true })) }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => undefined) }));
vi.mock('@/lib/auth-utils', () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
  verifyPassword: vi.fn(async () => true),
}));
vi.mock('@/lib/twoFactor', () => ({ verifyTotp: vi.fn(() => true) }));

// Paylaşılan sözleşmeyi mock'la — onboarding'in ONA delege ettiğini görmek için.
vi.mock('@/modules/commerce/subscriptionSync', () => ({
  subscriptionSyncService: {
    ensureTrialUserSubscription: vi.fn(async () => ({ created: true, id: 'usub_1' })),
  },
}));

import { prisma } from '@/lib/prisma';
import { subscriptionSyncService } from '@/modules/commerce/subscriptionSync';
import { verifyEmail } from '@/modules/onboarding/service';

describe('verifyEmail → subscriptionSync sözleşmesi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'user_1',
      email: 'a@b.com',
      trialStartedAt: null,
    } as any);
    txMock.plan.findUnique.mockResolvedValue({ trialDays: 14 });
  });

  it('trial kaydını inline OLUŞTURMAZ, ensureTrialUserSubscription.a delege eder', async () => {
    await verifyEmail({ token: 'tok' } as any);

    expect(subscriptionSyncService.ensureTrialUserSubscription).toHaveBeenCalledTimes(1);
    // Onboarding artık kendi başına create/findFirst yapmıyor.
    expect(txMock.userSubscription.create).not.toHaveBeenCalled();
    expect(txMock.userSubscription.findFirst).not.toHaveBeenCalled();
  });

  it('transaction client.ını sözleşmeye AKTARIR (atomiklik korunur)', async () => {
    await verifyEmail({ token: 'tok' } as any);

    const call = vi.mocked(subscriptionSyncService.ensureTrialUserSubscription).mock
      .calls[0]!;
    expect(call[1]).toBe(txMock);
  });

  it('plan.trialDays DB.den okunup sözleşmeye geçirilir', async () => {
    txMock.plan.findUnique.mockResolvedValue({ trialDays: 30 });

    await verifyEmail({ token: 'tok' } as any);

    expect(subscriptionSyncService.ensureTrialUserSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        planSlug: 'starter',
        trialDays: 30,
      }),
      txMock
    );
  });

  it('plan bulunamazsa varsayılan 14 gün kullanılır', async () => {
    txMock.plan.findUnique.mockResolvedValue(null);

    await verifyEmail({ token: 'tok' } as any);

    expect(subscriptionSyncService.ensureTrialUserSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ trialDays: 14 }),
      txMock
    );
  });

  it('kullanıcı emailVerified + trial alanları yine güncellenir', async () => {
    await verifyEmail({ token: 'tok' } as any);

    expect(txMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user_1' },
        data: expect.objectContaining({
          emailVerifyToken: null,
          emailVerifyExpires: null,
        }),
      })
    );
  });

  it('token geçersizse sözleşme HİÇ çağrılmaz', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    await expect(verifyEmail({ token: 'bad' } as any)).rejects.toThrow();
    expect(subscriptionSyncService.ensureTrialUserSubscription).not.toHaveBeenCalled();
  });

  it('now değeri sözleşmeye geçirilir (deterministik expiresAt)', async () => {
    await verifyEmail({ token: 'tok' } as any);

    const arg = vi.mocked(subscriptionSyncService.ensureTrialUserSubscription).mock
      .calls[0]![0];
    expect(arg.now).toBeInstanceOf(Date);
  });
});
