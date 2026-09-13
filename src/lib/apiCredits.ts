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
    priceCents: 4900,
    currency: 'try',
    description: 'Küçük entegrasyon ve test için.',
    featured: false,
  },
  {
    slug: 'credits-5k',
    name: '5.000 kredi',
    credits: 5000,
    priceCents: 19900,
    currency: 'try',
    description: 'Canlı mağaza / form doğrulama için.',
    featured: true,
  },
  {
    slug: 'credits-25k',
    name: '25.000 kredi',
    credits: 25000,
    priceCents: 79900,
    currency: 'try',
    description: 'Yüksek hacim — birim fiyat düşük.',
    featured: false,
  },
] as const;

export type ApiCreditPackSlug = (typeof API_CREDIT_PACKS)[number]['slug'];

export function getCreditPack(slug: string) {
  return API_CREDIT_PACKS.find((p) => p.slug === slug) ?? null;
}

export async function getApiCreditBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { apiCreditBalance: true },
  });
  return user?.apiCreditBalance ?? 0;
}

export async function creditApiBalance(input: {
  userId: string;
  credits: number;
  reason: 'topup' | 'refund' | 'admin';
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
        metadata: input.metadata ?? undefined,
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
