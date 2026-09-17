/**
 * TR API ön ödemeli kredi paketleri + bakiye işlemleri.
 * 1 kredi = 1 başarılı /api/v1 isteği (abonelik kotası ayrı).
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const API_CREDIT_PACKS = [
  {
    slug: 'credits-1k',
    name: '1.000 kredi',
    credits: 1000,
    priceCents: 7900,
    currency: 'try',
    description: 'Düşük hacimli, taahhütsüz deneme ve test.',
    featured: false,
  },
  {
    slug: 'credits-5k',
    name: '5.000 kredi',
    credits: 5000,
    priceCents: 29900,
    currency: 'try',
    description: 'Ara ihtiyaçlar için esnek paket.',
    featured: true,
  },
  {
    slug: 'credits-20k',
    name: '20.000 kredi',
    credits: 20000,
    priceCents: 89900,
    currency: 'try',
    description: 'Toplu alım indirimi — birim fiyat avantajı.',
    featured: false,
  },
] as const;

export type ApiCreditPackSlug = (typeof API_CREDIT_PACKS)[number]['slug'] | 'credits-25k';

export function getCreditPack(slug: string) {
  if (slug === 'credits-25k') {
    return API_CREDIT_PACKS.find((p) => p.slug === 'credits-20k') ?? null;
  }
  return API_CREDIT_PACKS.find((p) => p.slug === slug) ?? null;
}

export async function getApiCreditBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { apiCreditBalance: true },
  });
  return user?.apiCreditBalance ?? 0;
}

export const WELCOME_CREDITS = 100;

export async function grantEmailVerifiedCredits(
  userId: string,
  customTx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<{ granted: boolean; balanceAfter: number; ledgerId?: string }> {
  const run = async (tx: any) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, emailVerified: true, apiCreditBalance: true },
    });

    if (!user || !user.emailVerified) {
      return { granted: false, balanceAfter: user?.apiCreditBalance ?? 0 };
    }

    // Idempotent: kullanıcı daha önce welcome_bonus aldıysa tekrar verme
    if (tx.apiCreditLedger) {
      const existing = await tx.apiCreditLedger.findFirst({
        where: { userId, reason: 'welcome_bonus' },
      });
      if (existing) {
        return { granted: false, balanceAfter: user.apiCreditBalance, ledgerId: existing.id };
      }
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: { apiCreditBalance: { increment: WELCOME_CREDITS } },
      select: { apiCreditBalance: true },
    });

    let ledgerId: string | undefined;
    if (tx.apiCreditLedger) {
      const ledger = await tx.apiCreditLedger.create({
        data: {
          userId,
          delta: WELCOME_CREDITS,
          balanceAfter: updated.apiCreditBalance,
          reason: 'welcome_bonus',
          metadata: { note: 'E-posta onaylı kullanıcı hoş geldin kredisi' },
        },
      });
      ledgerId = ledger.id;
    }

    return { granted: true, balanceAfter: updated.apiCreditBalance, ledgerId };
  };

  if (customTx) {
    return run(customTx);
  }
  return prisma.$transaction(run);
}

export async function creditApiBalance(input: {
  userId: string;
  credits: number;
  reason: 'topup' | 'refund' | 'admin' | 'welcome_bonus';
  orderId?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ balanceAfter: number; ledgerId: string }> {
  if (input.credits <= 0) throw new Error('credits must be positive');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: input.userId },
      data: { apiCreditBalance: { increment: input.credits } },
      select: { apiCreditBalance: true },
    });
    const ledger = await tx.apiCreditLedger.create({
      data: {
        userId: input.userId,
        delta: input.credits,
        balanceAfter: updated.apiCreditBalance,
        reason: input.reason,
        orderId: input.orderId ?? null,
        metadata: (input.metadata as object | undefined) ?? undefined,
      },
    });
    return { balanceAfter: updated.apiCreditBalance, ledgerId: ledger.id };
  });
}

/** Atomik düşüm — bakiye yetersizse null */
export async function tryDebitApiCredit(input: {
  userId: string;
  amount?: number;
  endpoint?: string;
}): Promise<{ balanceAfter: number; ledgerId: string } | null> {
  const amount = input.amount ?? 1;
  try {
    return await prisma.$transaction(async (tx) => {
      const rows = await tx.$executeRaw`
        UPDATE "User"
        SET "apiCreditBalance" = "apiCreditBalance" - ${amount}
        WHERE id = ${input.userId} AND "apiCreditBalance" >= ${amount}
      `;
      if (Number(rows) === 0) return null;

      const user = await tx.user.findUniqueOrThrow({
        where: { id: input.userId },
        select: { apiCreditBalance: true },
      });
      const ledger = await tx.apiCreditLedger.create({
        data: {
          userId: input.userId,
          delta: -amount,
          balanceAfter: user.apiCreditBalance,
          reason: 'api_call',
          endpoint: input.endpoint ?? null,
        },
      });
      return { balanceAfter: user.apiCreditBalance, ledgerId: ledger.id };
    });
  } catch (error) {
    logger.error('[API credits] debit failed', { error, userId: input.userId });
    return null;
  }
}

export async function refundApiCredit(input: {
  userId: string;
  amount?: number;
  endpoint?: string;
  relatedLedgerId?: string;
}): Promise<void> {
  const amount = input.amount ?? 1;
  try {
    await creditApiBalance({
      userId: input.userId,
      credits: amount,
      reason: 'refund',
      metadata: {
        endpoint: input.endpoint,
        relatedLedgerId: input.relatedLedgerId,
      },
    });
  } catch (error) {
    logger.error('[API credits] refund failed', { error, userId: input.userId });
  }
}

/** Sipariş ödendikten sonra kredi yükle (e-posta → user) */
export async function fulfillCreditTopupOrder(input: {
  orderId: string;
  customerEmail: string;
  packSlug: string;
  userId?: string | null;
}): Promise<boolean> {
  const pack = getCreditPack(input.packSlug);
  if (!pack) {
    logger.error('[API credits] unknown pack', input);
    return false;
  }

  // Aynı sipariş için çift yüklemeyi engelle
  const existing = await prisma.apiCreditLedger.findFirst({
    where: { orderId: input.orderId, reason: 'topup' },
  });
  if (existing) return true;

  let userId = input.userId ?? null;
  if (!userId) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: input.customerEmail, mode: 'insensitive' } },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }
  if (!userId) {
    logger.error('[API credits] user not found for topup', {
      orderId: input.orderId,
      email: input.customerEmail,
    });
    return false;
  }

  await creditApiBalance({
    userId,
    credits: pack.credits,
    reason: 'topup',
    orderId: input.orderId,
    metadata: { packSlug: pack.slug },
  });
  return true;
}
