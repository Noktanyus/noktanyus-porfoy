'use client';

/**
 * Loyalty Dashboard Client Component
 *
 * - Tier card (gradient)
 * - Progress bar to next tier
 * - Tier perks list
 * - Rewards grid with redeem buttons
 * - Transaction history
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaCrown,
  FaGift,
  FaCoins,
  FaCheckCircle,
  FaClock,
  FaArrowUp,
  FaHistory,
  FaLock,
  FaPercent,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils';

type TierName = 'bronze' | 'silver' | 'gold' | 'platinum';

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  balance: number;
  reason: string;
  reference: string | null;
  createdAt: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  type: string;
  pointsCost: number;
  discountPercent: number | null;
  discountCents: number | null;
  tier: string;
  canRedeem: boolean;
  reasonBlocked?: string;
}

interface LoyaltyStats {
  account: { points: number; lifetimePoints: number; tier: TierName };
  currentTier: {
    name: TierName;
    label: string;
    perks: string[];
    discountPercent: number;
    gradient: string;
  };
  nextTier: {
    name: TierName;
    label: string;
    threshold: number;
    perks: string[];
    discountPercent: number;
  } | null;
  pointsToNext: number | null;
  progressPercent: number;
  transactions: LoyaltyTransaction[];
  availableRewards: Reward[];
}

const TIER_BADGE: Record<TierName, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

const TYPE_LABEL: Record<string, { label: string; color: string; icon: any }> = {
  earn: { label: 'Kazanildi', color: 'text-green-600 dark:text-green-400', icon: FaCheckCircle },
  redeem: { label: 'Kullanildi', color: 'text-orange-600 dark:text-orange-400', icon: FaGift },
  bonus: { label: 'Bonus', color: 'text-purple-600 dark:text-purple-400', icon: FaCoins },
  adjustment: { label: 'Duzeltme', color: 'text-gray-600 dark:text-gray-400', icon: FaHistory },
};

interface Props {
  stats: LoyaltyStats;
}

export function LoyaltyDashboard({ stats }: Props) {
  const router = useRouter();
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showCodeFor, setShowCodeFor] = useState<{ code: string; rewardName: string } | null>(null);

  const redeem = async (reward: Reward) => {
    if (!reward.canRedeem) {
      toast.error(reward.reasonBlocked ?? 'Bu odul kullanilamaz');
      return;
    }
    if (!confirm(`${reward.pointsCost} puan harcayip "${reward.name}" odulunu almak istiyor musunuz?`)) {
      return;
    }
    setRedeeming(reward.id);
    try {
      const res = await fetch('/api/user/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      const json = await res.json();
      if (!json.success) {
        if (json.error?.code === 'VALIDATION_ERROR' && json.error?.details?.message === 'INSUFFICIENT_POINTS') {
          toast.error('Yetersiz puan');
        } else {
          toast.error(json.error?.message ?? 'Islem basarisiz');
        }
        return;
      }
      setShowCodeFor({
        code: json.data.redemptionCode,
        rewardName: json.data.reward.name,
      });
      toast.success('Odul alindi!');
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Islem basarisiz');
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaCrown className="text-yellow-500" />
            Sadakat Programi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Puan kazan, tier yukselt, oduller kullan.
          </p>
        </div>
      </div>

      {/* Tier Card */}
      <div
        className={`glass-card-premium overflow-hidden bg-gradient-to-br ${stats.currentTier.gradient} text-white`}
      >
        <div className="p-6 lg:p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-4xl">{TIER_BADGE[stats.currentTier.name]}</span>
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-80">Mevcut Tier</p>
                  <h2 className="text-3xl font-bold">{stats.currentTier.label}</h2>
                </div>
              </div>
              <p className="text-sm opacity-90 mt-2">
                {stats.currentTier.discountPercent > 0
                  ? `Tum siparislerde %${stats.currentTier.discountPercent} ekstra indirim`
                  : 'Tier avantajlari icin puan kazanmaya basla'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider opacity-80">Mevcut Puan</p>
              <p className="text-4xl font-bold">{stats.account.points.toLocaleString('tr-TR')}</p>
              <p className="text-xs opacity-80 mt-1">
                Toplam: {stats.account.lifetimePoints.toLocaleString('tr-TR')} puan
              </p>
            </div>
          </div>

          {/* Progress to next tier */}
          {stats.nextTier ? (
            <div className="mt-6 bg-black/20 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <FaArrowUp className="text-xs" />
                  {stats.nextTier.label}'a yuksel
                </span>
                <span className="font-semibold">
                  {stats.pointsToNext?.toLocaleString('tr-TR')} puan kaldi
                </span>
              </div>
              <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/90 transition-all"
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
              <p className="text-xs mt-2 opacity-80">
                {stats.account.lifetimePoints.toLocaleString('tr-TR')} / {stats.nextTier.threshold.toLocaleString('tr-TR')} puan
              </p>
            </div>
          ) : (
            <div className="mt-6 bg-black/20 rounded-lg p-4 text-center">
              <FaCrown className="inline-block text-2xl mb-1" />
              <p className="font-semibold">En ust seviyedesiniz!</p>
              <p className="text-xs opacity-80 mt-1">Tum VIP avantajlardan yararlaniyorsunuz.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tier Perks */}
      <div className="glass-card-premium p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <FaCheckCircle className="text-green-500" />
          {stats.currentTier.label} Avantajlari
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {stats.currentTier.perks.map((perk, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm bg-muted/30 rounded-lg p-3"
            >
              <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Rewards */}
      <div className="glass-card-premium p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FaGift className="text-purple-500" />
          Kullanilabilir Oduller
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.availableRewards.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground text-center py-8">
              Henuz odul tanimlanmamis. Yakinda eklenecek.
            </p>
          )}
          {stats.availableRewards.map((reward) => (
            <div
              key={reward.id}
              className={`border rounded-lg p-4 flex flex-col ${
                reward.canRedeem
                  ? 'border-brand-primary/40 bg-brand-primary/5'
                  : 'border-border bg-muted/20 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{reward.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{reward.description}</p>
                </div>
                {reward.type === 'discount' && reward.discountPercent && (
                  <span className="bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-bold px-2 py-0.5 rounded">
                    <FaPercent className="inline mr-0.5 text-[10px]" />
                    {reward.discountPercent}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-3">
                <span className="text-sm font-bold flex items-center gap-1">
                  <FaCoins className="text-yellow-500" />
                  {reward.pointsCost.toLocaleString('tr-TR')}
                </span>
                <button
                  onClick={() => redeem(reward)}
                  disabled={!reward.canRedeem || redeeming === reward.id || isPending}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    reward.canRedeem
                      ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                  title={reward.reasonBlocked ?? 'Kullan'}
                >
                  {redeeming === reward.id ? (
                    'Isleniyor...'
                  ) : reward.canRedeem ? (
                    'Kullan'
                  ) : (
                    <>
                      <FaLock className="inline mr-1" />
                      Kilitli
                    </>
                  )}
                </button>
              </div>
              {!reward.canRedeem && reward.reasonBlocked && (
                <p className="text-xs text-muted-foreground mt-2">{reward.reasonBlocked}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-card-premium p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FaHistory className="text-blue-500" />
          Islem Gecmisi
        </h3>
        {stats.transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Henuz islem yok. Ilk puanini kazanmak icin bir siparis ver!
          </p>
        ) : (
          <div className="divide-y divide-border">
            {stats.transactions.map((txn) => {
              const typeInfo = TYPE_LABEL[txn.type] ?? TYPE_LABEL.adjustment;
              const Icon = typeInfo.icon;
              return (
                <div key={txn.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon className={`mt-1 flex-shrink-0 ${typeInfo.color}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{txn.reason}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <FaClock />
                        {formatDateTime(txn.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-bold ${
                        txn.points > 0 ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {txn.points > 0 ? '+' : ''}
                      {txn.points}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bakiye: {txn.balance.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redemption Code Modal */}
      {showCodeFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCodeFor(null)}
        >
          <div
            className="glass-card-premium p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <FaGift className="text-green-500" />
              Odul Alindi!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>{showCodeFor.rewardName}</strong> odulunu basariyla aldiniz.
              Asagidaki kodu siparis sirasinda kullanabilirsiniz:
            </p>
            <div className="bg-muted/40 rounded-lg p-4 font-mono text-center text-lg font-bold tracking-wider mb-4">
              {showCodeFor.code}
            </div>
            <button
              onClick={() => setShowCodeFor(null)}
              className="w-full bg-brand-primary text-white py-2 rounded-lg hover:bg-brand-primary/90"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}