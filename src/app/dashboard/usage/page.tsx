/**
 * Dashboard — API kullanım analitikleri + kota/kredi projeksiyonu
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { apiKeyService } from '@/modules/api-keys/service';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { checkApiQuota, getCurrentMonthUsage, getUserPlan } from '@/lib/planGate';
import { getApiCreditBalance } from '@/lib/apiCredits';
import { computeUsageForecast } from '@/lib/usageForecast';
import { computeBillingProjection } from '@/lib/billingProjection';
import { formatCurrency } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function statusTone(code: number): string {
  if (code >= 200 && code < 400) return 'text-emerald-700 dark:text-emerald-300';
  if (code === 429 || code === 402) return 'text-amber-700 dark:text-amber-300';
  return 'text-rose-700 dark:text-rose-300';
}

function alertTone(level: string): string {
  if (level === 'exhausted' || level === 'critical') {
    return 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200';
  }
  if (level === 'warn') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
  }
  return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100';
}

export default async function UsagePage({
  searchParams,
}: {
  searchParams?: { hours?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/usage');

  const userId = (session.user as { id: string }).id;
  const hoursRaw = Number(searchParams?.hours ?? '24');
  const hours = [24, 168, 720].includes(hoursRaw) ? hoursRaw : 24;
  const [overview, monthUsage, quota, creditBalance, planSlug] = await Promise.all([
    apiKeyService.getUserUsageOverview(userId, hours),
    getCurrentMonthUsage(userId),
    checkApiQuota(userId),
    getApiCreditBalance(userId),
    getUserPlan(userId),
  ]);

  const planRow = planSlug
    ? await prisma.plan.findUnique({
        where: { slug: planSlug },
        select: { priceCents: true, currency: true, name: true, interval: true },
      })
    : null;

  const now = new Date();
  const dayOfMonth = now.getUTCDate();
  const daysInMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
  ).getUTCDate();

  const forecast = computeUsageForecast({
    monthToDate: monthUsage.requestsUsed,
    dayOfMonth,
    daysInMonth,
    quotaLimit: quota.limitRequests > 0 ? quota.limitRequests : 0,
    creditBalance,
    windowRequests: overview.total,
    windowHours: hours,
    billingSource: quota.billingSource,
  });

  const billing = computeBillingProjection({
    monthToDate: forecast.monthToDate,
    projectedMonthEnd: forecast.projectedMonthEnd,
    quotaLimit: forecast.quotaLimit,
    billingSource: quota.billingSource,
    planPriceCents: planRow?.priceCents ?? 0,
    creditBalance,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="API kullanımı"
        description={`Son ${overview.hours} saat · ${overview.total} istek`}
        actions={
          <div className="flex flex-wrap gap-2">
            {[
              { h: 24, label: '24s' },
              { h: 168, label: '7g' },
              { h: 720, label: '30g' },
            ].map((opt) => (
              <Link
                key={opt.h}
                href={`/dashboard/usage?hours=${opt.h}`}
                className={`admin-btn text-sm ${
                  hours === opt.h ? 'admin-btn-primary' : 'admin-btn-secondary'
                }`}
              >
                {opt.label}
              </Link>
            ))}
            <a
              href={`/api/user/usage/export?hours=${hours}`}
              className="admin-btn admin-btn-secondary"
            >
              CSV indir
            </a>
            <Link href="/dashboard/api-keys" className="admin-btn admin-btn-secondary">
              API anahtarları
            </Link>
          </div>
        }
      />

      {forecast.alertMessage && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${alertTone(forecast.alertLevel)}`}
          role="status"
        >
          {forecast.alertMessage}{' '}
          <Link href="/magaza" className="underline underline-offset-2">
            Plan / kredi
          </Link>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card/50 p-5">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Kota &amp; projeksiyon</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ay başından bugüne + mevcut hızla ay sonu tahmini
            </p>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            Kaynak:{' '}
            {quota.billingSource === 'subscription'
              ? `abonelik (${quota.planSlug ?? 'plan'})`
              : quota.billingSource === 'credits'
                ? 'kredi'
                : 'yok'}
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Bu ay',
              value: forecast.monthToDate.toLocaleString('tr-TR'),
            },
            {
              label: 'Ay sonu tahmini',
              value: forecast.projectedMonthEnd.toLocaleString('tr-TR'),
            },
            {
              label: 'Kota kalan',
              value:
                forecast.quotaLimit > 0
                  ? Math.max(0, forecast.quotaLimit - forecast.monthToDate).toLocaleString(
                      'tr-TR'
                    )
                  : creditBalance > 0
                    ? `${creditBalance.toLocaleString('tr-TR')} kredi`
                    : '—',
            },
            {
              label: 'Günlük hız',
              value: `${forecast.requestsPerDay.toLocaleString('tr-TR')}/gün`,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border/80 bg-background/40 px-3 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-1 text-xl font-extrabold tabular-nums text-foreground">
                {card.value}
              </p>
            </div>
          ))}
        </div>
        {forecast.quotaLimit > 0 && forecast.quotaUsedPct != null && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Kota doluluk</span>
              <span className="tabular-nums">
                %{Math.min(100, forecast.quotaUsedPct).toFixed(0)}
                {forecast.projectedQuotaPct != null
                  ? ` · tahmini %${Math.min(999, forecast.projectedQuotaPct).toFixed(0)}`
                  : ''}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  forecast.alertLevel === 'exhausted' || forecast.alertLevel === 'critical'
                    ? 'bg-rose-500'
                    : forecast.alertLevel === 'warn'
                      ? 'bg-amber-500'
                      : 'bg-brand-primary'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, forecast.quotaUsedPct))}%` }}
              />
            </div>
          </div>
        )}
        {forecast.creditDaysRemaining != null && creditBalance > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Kredi dayanma süresi (mevcut hız): ~
            <span className="tabular-nums font-semibold text-foreground">
              {forecast.creditDaysRemaining.toLocaleString('tr-TR')}
            </span>{' '}
            gün
          </p>
        )}

        <div className="mt-5 rounded-xl border border-border/70 bg-background/40 px-4 py-4 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground">Maliyet tahmini (TRY)</h3>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              Birim ≈ {formatCurrency(Math.max(1, Math.round(billing.unitPriceCents)), 'try')}{' '}
              / istek (öne çıkan kredi paketi)
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ay sonu fatura tahmini
              </p>
              <p className="mt-1 text-lg font-extrabold tabular-nums text-foreground">
                {formatCurrency(billing.projectedBillCents, planRow?.currency ?? 'try')}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Kota aşımı (tahmini)
              </p>
              <p className="mt-1 text-lg font-extrabold tabular-nums text-foreground">
                {billing.projectedOverageRequests > 0
                  ? `${billing.projectedOverageRequests.toLocaleString('tr-TR')} · ${formatCurrency(billing.projectedOverageCents, 'try')}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Plan
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {planRow
                  ? `${planRow.name} · ${formatCurrency(planRow.priceCents, planRow.currency)}`
                  : 'Kredi / plansız'}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{billing.note}</p>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Toplam', value: overview.total },
          { label: 'Başarılı', value: overview.successCount },
          { label: 'Hata', value: overview.errorCount },
          { label: 'Başarı oranı', value: `${overview.successRate.toFixed(1)}%` },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-card/60 px-4 py-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card/50 p-5">
        <h2 className="text-base font-bold text-foreground mb-3">Endpoint dağılımı</h2>
        {overview.byEndpoint.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz istek yok. İlk çağrıyı{' '}
            <Link href="/baslangic" className="text-brand-primary hover:underline">
              başlangıç
            </Link>{' '}
            rehberinden at.
          </p>
        ) : (
          <ul className="space-y-2">
            {overview.byEndpoint.map((row) => {
              const pct = overview.total > 0 ? (row.count / overview.total) * 100 : 0;
              return (
                <li key={row.endpoint}>
                  <div className="flex items-center justify-between gap-3 text-sm mb-1">
                    <code className="font-mono text-xs sm:text-sm truncate">{row.endpoint}</code>
                    <span className="tabular-nums text-muted-foreground shrink-0">
                      {row.count}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-primary"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card/50 p-5">
        <h2 className="text-base font-bold text-foreground mb-3">Son istekler</h2>
        {overview.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Kayıt yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-semibold">Zaman</th>
                  <th className="py-2 pr-3 font-semibold">Metod</th>
                  <th className="py-2 pr-3 font-semibold">Endpoint</th>
                  <th className="py-2 pr-3 font-semibold">Durum</th>
                  <th className="py-2 font-semibold">Anahtar</th>
                </tr>
              </thead>
              <tbody>
                {overview.recent.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">
                      {r.timestamp.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{r.method}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs max-w-[220px] truncate">
                      {r.endpoint}
                    </td>
                    <td className={`py-2.5 pr-3 font-semibold tabular-nums ${statusTone(r.statusCode)}`}>
                      {r.statusCode}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{r.keyName ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {overview.keys.length > 0 && (
        <section className="rounded-2xl border border-border bg-card/50 p-5">
          <h2 className="text-base font-bold text-foreground mb-3">Anahtar özeti</h2>
          <ul className="divide-y divide-border/70">
            {overview.keys.map((k) => (
              <li
                key={k.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm"
              >
                <div>
                  <p className="font-semibold text-foreground">{k.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{k.prefix}…</p>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground tabular-nums">
                  Toplam {k.totalRequests}
                  {k.monthlyQuota != null ? ` / kota ${k.monthlyQuota}` : ''}
                  {' · '}
                  {k.rateLimit}/dk
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
