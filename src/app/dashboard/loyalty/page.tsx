/**
 * Dashboard — Sadakat puanları (tier + işlem geçmişi)
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LoyaltyDashboard } from '@/components/dashboard/LoyaltyDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TIERS = {
  bronze: {
    name: 'bronze' as const,
    label: 'Bronz',
    perks: ['Temel destek', '%0 ekstra indirim'],
    discountPercent: 0,
    gradient: 'from-amber-700 to-amber-500',
    threshold: 0,
  },
  silver: {
    name: 'silver' as const,
    label: 'Gümüş',
    perks: ['Öncelikli destek', '%3 ekstra indirim'],
    discountPercent: 3,
    gradient: 'from-slate-400 to-slate-200',
    threshold: 500,
  },
  gold: {
    name: 'gold' as const,
    label: 'Altın',
    perks: ['Erken erişim', '%7 ekstra indirim'],
    discountPercent: 7,
    gradient: 'from-yellow-500 to-amber-300',
    threshold: 2000,
  },
  platinum: {
    name: 'platinum' as const,
    label: 'Platin',
    perks: ['Dedicated destek', '%12 ekstra indirim'],
    discountPercent: 12,
    gradient: 'from-violet-500 to-fuchsia-400',
    threshold: 5000,
  },
};

const ORDER = ['bronze', 'silver', 'gold', 'platinum'] as const;

export default async function LoyaltyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/loyalty');

  const userId = (session.user as { id: string }).id;

  let account = await prisma.loyaltyAccount.findUnique({
    where: { userId },
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 30 },
    },
  });

  if (!account) {
    account = await prisma.loyaltyAccount.create({
      data: { userId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    });
  }

  const tierKey = (ORDER.includes(account.tier as (typeof ORDER)[number])
    ? account.tier
    : 'bronze') as (typeof ORDER)[number];
  const currentTier = TIERS[tierKey];
  const idx = ORDER.indexOf(tierKey);
  const nextKey = ORDER[idx + 1];
  const nextTier = nextKey
    ? {
        name: TIERS[nextKey].name,
        label: TIERS[nextKey].label,
        threshold: TIERS[nextKey].threshold,
        perks: TIERS[nextKey].perks,
        discountPercent: TIERS[nextKey].discountPercent,
      }
    : null;

  const pointsToNext = nextTier
    ? Math.max(0, nextTier.threshold - account.lifetimePoints)
    : null;
  const progressPercent = nextTier
    ? Math.min(
        100,
        Math.round(
          ((account.lifetimePoints - currentTier.threshold) /
            Math.max(1, nextTier.threshold - currentTier.threshold)) *
            100
        )
      )
    : 100;

  const rewards = await prisma.loyaltyReward.findMany({
    where: { active: true },
    orderBy: { pointsCost: 'asc' },
    take: 20,
  });

  const tierRank = (t: string) => ORDER.indexOf(t as (typeof ORDER)[number]);

  const stats = {
    account: {
      points: account.points,
      lifetimePoints: account.lifetimePoints,
      tier: tierKey,
    },
    currentTier: {
      name: currentTier.name,
      label: currentTier.label,
      perks: currentTier.perks,
      discountPercent: currentTier.discountPercent,
      gradient: currentTier.gradient,
    },
    nextTier,
    pointsToNext,
    progressPercent,
    transactions: account.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      points: t.points,
      balance: t.balance,
      reason: t.reason,
      reference: t.reference,
      createdAt: t.createdAt.toISOString(),
    })),
    availableRewards: rewards.map((r) => {
      const needTier = tierRank(r.tier) <= tierRank(tierKey);
      const canAfford = account!.points >= r.pointsCost;
      const canRedeem = needTier && canAfford && (r.stock == null || r.stock > 0);
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        type: r.type,
        pointsCost: r.pointsCost,
        discountPercent: r.discountPercent,
        discountCents: r.discountCents,
        tier: r.tier,
        canRedeem,
        reasonBlocked: !needTier
          ? `Min. ${r.tier} tier`
          : !canAfford
            ? 'Yetersiz puan'
            : r.stock === 0
              ? 'Stok yok'
              : undefined,
      };
    }),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sadakat"
        description="Puanlar, seviyeler ve ödüller"
      />
      <LoyaltyDashboard stats={stats} />
    </div>
  );
}
