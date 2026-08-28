/**
 * PartnerDashboard — Authenticated partner istatistik dashboard.
 *
 * Stats cards (leads, conversion rate, commission earned), referral link
 * kopyalama, recent leads tablosu.
 */

'use client';

import { useState } from 'react';

interface PartnerDashboardProps {
  stats: {
    partner: {
      id: string;
      companyName: string;
      slug: string;
      commissionPercent: number;
      verified: boolean;
      active: boolean;
      totalLeads: number;
      totalConversions: number;
      createdAt: string;
    };
    leads: {
      total: number;
      pending: number;
      qualified: number;
      converted: number;
      rejected: number;
    };
    revenue: {
      totalCommissionCents: number;
      totalOrderCents: number;
    };
    recentLeads: Array<{
      id: string;
      customerEmail: string;
      customerName: string | null;
      status: string;
      orderAmountCents: number | null;
      commissionCents: number | null;
      createdAt: string;
      convertedAt: string | null;
    }>;
  };
  referralLink: string;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cents / 100);
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    qualified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    converted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return map[status] ?? 'bg-slate-100 text-slate-800';
}

export function PartnerDashboard({ stats, referralLink }: PartnerDashboardProps) {
  const [copied, setCopied] = useState(false);
  const conversionRate =
    stats.leads.total > 0
      ? ((stats.leads.converted / stats.leads.total) * 100).toFixed(1)
      : '0.0';

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API kullanilamazsa sessizce gec
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            İş Ortağı Paneli
          </h1>
          {stats.partner.verified && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              ✓ Doğrulanmış
            </span>
          )}
          {!stats.partner.active && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              Pasif
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">
          {stats.partner.companyName} · Komisyon: %{stats.partner.commissionPercent}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm text-slate-500">Toplam Lead</div>
          <div className="mt-1 text-2xl font-semibold">{stats.leads.total}</div>
          <div className="mt-1 text-xs text-slate-400">
            {stats.leads.pending} beklemede
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm text-slate-500">Conversion</div>
          <div className="mt-1 text-2xl font-semibold">{stats.leads.converted}</div>
          <div className="mt-1 text-xs text-slate-400">
            %{conversionRate} oran
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm text-slate-500">Kazanç</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {formatCurrency(stats.revenue.totalCommissionCents)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {formatCurrency(stats.revenue.totalOrderCents)} satış
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="text-sm text-slate-500">Public Sayfa</div>
          <div className="mt-1 truncate font-mono text-sm">/is-ortak/{stats.partner.slug}</div>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-2 text-lg font-semibold">Referans Linki</h2>
        <p className="mb-3 text-sm text-slate-500">
          Bu linki paylaşarak lead gönderebilirsiniz.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 rounded border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-600 dark:bg-slate-900"
            aria-label="Referans linki"
          />
          <button
            type="button"
            onClick={copyLink}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {copied ? '✓ Kopyalandı' : 'Kopyala'}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <header className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold">Son Leadler</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3">Müşteri</th>
                <th className="px-6 py-3">Durum</th>
                <th className="px-6 py-3">Tutar</th>
                <th className="px-6 py-3">Komisyon</th>
                <th className="px-6 py-3">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {stats.recentLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Henüz lead yok
                  </td>
                </tr>
              )}
              {stats.recentLeads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-6 py-3">
                    <div className="font-medium">{lead.customerName ?? lead.customerEmail}</div>
                    {lead.customerName && (
                      <div className="text-xs text-slate-500">{lead.customerEmail}</div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {lead.orderAmountCents !== null
                      ? formatCurrency(lead.orderAmountCents)
                      : '—'}
                  </td>
                  <td className="px-6 py-3">
                    {lead.commissionCents !== null
                      ? formatCurrency(lead.commissionCents)
                      : '—'}
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-500">
                    {new Date(lead.createdAt).toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}