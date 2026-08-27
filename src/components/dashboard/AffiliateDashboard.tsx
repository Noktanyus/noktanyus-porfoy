'use client';

/**
 * Affiliate Dashboard Client Component
 *
 * Phase "Video Calls + Affiliate" kapsaminda eklendi.
 * - Stats cards (balance, total referrals, commission %)
 * - Referral link kopyalama
 * - Status bazli komisyon ozet
 * - Son komisyonlar listesi
 * - Payout talebi formu
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FaGift, FaDollarSign, FaUsers, FaCopy, FaDownload, FaCheckCircle, FaClock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export interface AffiliateStats {
  balanceCents: number;
  percent: number;
  totalReferrals: number;
  approved: boolean;
  referralCode: string | null;
  byStatus: Record<string, { count: number; amountCents: number }>;
}

export interface AffiliateCommissionRow {
  id: string;
  status: string;
  commissionCents: number;
  commissionPercent: number;
  orderAmountCents: number;
  createdAt: string;
  referred: { name: string | null; email: string } | null;
  order: { orderNumber: string } | null;
}

interface Props {
  stats: AffiliateStats;
  referralCode: string;
  referralLink: string;
  commissions: AffiliateCommissionRow[];
}

const PAYOUT_METHODS = [
  { value: 'bank_transfer', label: 'Banka Havalesi' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'stripe', label: 'Stripe' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  paid: 'Ödendi',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  approved: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  paid: 'bg-green-500/20 text-green-700 dark:text-green-300',
  cancelled: 'bg-red-500/20 text-red-700 dark:text-red-300',
};

export function AffiliateDashboard({ stats, referralCode, referralLink, commissions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [requesting, setRequesting] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referans linki kopyalandı');
    } catch {
      toast.error('Kopyalama başarısız');
    }
  };

  const requestPayout = async () => {
    if (!confirm(`${formatCurrency(stats.balanceCents)} tutarında payout talebi oluşturulsun mu?`)) return;
    setRequesting(true);
    try {
      const res = await fetch('/api/affiliate/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: payoutMethod }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Talep başarısız');
      toast.success('Payout talebi oluşturuldu');
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Talep başarısız');
    } finally {
      setRequesting(false);
    }
  };

  const pendingStat = stats.byStatus.pending;
  const paidStat = stats.byStatus.paid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FaGift className="text-primary w-7 h-7" />
        <div>
          <h1 className="text-2xl font-bold">Affiliate Programı</h1>
          <p className="text-sm text-muted-foreground">
            Davet et, kazanç elde et. Komisyon oranın: <strong>%{stats.percent}</strong>
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card-premium p-5">
          <FaDollarSign className="text-green-500 w-6 h-6" />
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.balanceCents)}</p>
          <p className="text-xs text-muted-foreground">Kullanılabilir Bakiye</p>
        </div>
        <div className="glass-card-premium p-5">
          <FaUsers className="text-blue-500 w-6 h-6" />
          <p className="text-2xl font-bold mt-2">{stats.totalReferrals}</p>
          <p className="text-xs text-muted-foreground">Toplam Davet</p>
        </div>
        <div className="glass-card-premium p-5">
          <FaGift className="text-purple-500 w-6 h-6" />
          <p className="text-2xl font-bold mt-2">%{stats.percent}</p>
          <p className="text-xs text-muted-foreground">Komisyon Oranı</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="glass-card-premium p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <FaCopy className="w-4 h-4" /> Referans Linkin
        </h2>
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <code className="flex-1 font-mono text-sm break-all">{referralLink}</code>
          <button
            onClick={copyLink}
            className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors whitespace-nowrap"
            type="button"
          >
            <FaCopy className="inline mr-1" /> Kopyala
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Bu linki paylaş, kayıt olan her kullanıcının siparişlerinden <strong>%{stats.percent}</strong> kazanırsın.
        </p>
      </div>

      {/* Status summary */}
      {(pendingStat || paidStat) && (
        <div className="glass-card-premium p-6">
          <h3 className="font-semibold mb-4">Komisyon Durumu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {pendingStat && (
              <div className="flex items-center gap-3">
                <FaClock className="text-yellow-500 w-5 h-5" />
                <div>
                  <p className="text-muted-foreground">Bekleyen</p>
                  <p className="font-bold">{formatCurrency(pendingStat.amountCents)}</p>
                  <p className="text-xs text-muted-foreground">{pendingStat.count} işlem</p>
                </div>
              </div>
            )}
            {paidStat && (
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-green-500 w-5 h-5" />
                <div>
                  <p className="text-muted-foreground">Ödenmiş</p>
                  <p className="font-bold">{formatCurrency(paidStat.amountCents)}</p>
                  <p className="text-xs text-muted-foreground">{paidStat.count} işlem</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payout request */}
      {stats.approved && (
        <div className="glass-card-premium p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FaDownload className="w-4 h-4" /> Payout Talebi
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <label htmlFor="payout-method" className="block text-sm font-medium mb-1">
                Ödeme Yöntemi
              </label>
              <select
                id="payout-method"
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full px-3 py-2 rounded bg-background border border-border"
              >
                {PAYOUT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={requestPayout}
              disabled={requesting || isPending || stats.balanceCents < 10000}
              className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              type="button"
            >
              {requesting ? 'Gönderiliyor...' : 'Payout Talep Et'}
            </button>
          </div>
          {stats.balanceCents < 10000 && (
            <p className="text-xs text-muted-foreground mt-2">
              Minimum payout: 100,00 ₺. Mevcut bakiye yetersiz.
            </p>
          )}
        </div>
      )}

      {!stats.approved && (
        <div className="glass-card-premium p-6">
          <p className="text-sm text-muted-foreground">
            Payout talepleri için hesabınız admin tarafından onaylanmalıdır.
          </p>
        </div>
      )}

      {/* Commissions list */}
      <div className="glass-card-premium p-6">
        <h3 className="font-semibold mb-3">Son Komisyonlar</h3>
        {commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Henüz komisyon yok. Davet linkini paylaşmaya başla!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium">Tarih</th>
                  <th className="text-left p-2 font-medium">Davetli</th>
                  <th className="text-left p-2 font-medium">Sipariş</th>
                  <th className="text-right p-2 font-medium">Tutar</th>
                  <th className="text-right p-2 font-medium">Komisyon</th>
                  <th className="text-right p-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id} className="border-b border-border/50">
                    <td className="p-2 text-muted-foreground">{formatDateTime(c.createdAt)}</td>
                    <td className="p-2">
                      {c.referred?.name ?? c.referred?.email ?? 'Anonim'}
                    </td>
                    <td className="p-2 font-mono text-xs">
                      #{c.order?.orderNumber ?? '—'}
                    </td>
                    <td className="p-2 text-right">{formatCurrency(c.orderAmountCents)}</td>
                    <td className="p-2 text-right font-semibold">{formatCurrency(c.commissionCents)}</td>
                    <td className="p-2 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[c.status] ?? 'bg-gray-500/20'}`}
                      >
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AffiliateDashboard;