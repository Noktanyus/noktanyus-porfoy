/**
 * @file Admin Analytics sayfasi (server component).
 * @description Revenue Dashboard (G1), Conversion Funnel (G2) ve CLV tablosunu
 *              tek sayfada sunar. Veriler server-side paralel cekilir.
 *
 * Auth: (protected) layout client-side kontrol yapar; burada ek olarak
 *       server-side session + admin rolu dogrulanir (defense in depth).
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyticsService } from '@/modules/analytics/service';
import { RevenueDashboard } from '@/components/admin/RevenueDashboard';
import { FunnelChart } from '@/components/admin/FunnelChart';
import { AiUsageWidget } from '@/components/admin/AiUsageWidget';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Analytics Dashboard',
  description: 'Gelir, dönüşüm hunisi ve müşteri yaşam boyu değeri metrikleri',
};

/** Kurus -> okunabilir TRY metni. */
function formatTry(cents: number): string {
  return (cents / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/giris');
  }

  const [revenue, funnel, clv] = await Promise.all([
    analyticsService.getRevenueStats(),
    analyticsService.getFunnelStats(),
    analyticsService.getCLV({ limit: 50 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Gelir, dönüşüm hunisi ve müşteri yaşam boyu değeri (CLV). Tüm metrikler sipariş kayıtlarından hesaplanır."
        breadcrumb={<span>Admin / Analytics</span>}
      />

      <RevenueDashboard stats={revenue} />

      <AiUsageWidget />

      <FunnelChart stages={funnel.stages} period={funnel.period} />

      <DashboardSection
        title="En Değerli Müşteriler (CLV)"
        description={
          clv.customerCount > 0
            ? `${clv.customerCount} ödeme yapan müşteri · Ortalama CLV ₺${formatTry(clv.avgCLVCents)} · Toplam ₺${formatTry(clv.totalCLVCents)}`
            : 'Ödeme yapan müşteri bulunduğunda özet burada görünecek.'
        }
        padding={clv.customers.length === 0 ? 'md' : 'none'}
        contained
      >
        {clv.customers.length === 0 ? (
          <EmptyState
            variant="inline"
            icon="inbox"
            title="Henüz ödeme yapan müşteri yok"
            description="İlk ödeme tamamlandığında müşteri yaşam boyu değeri tablosu burada listelenecek."
          />
        ) : (
          <ResponsiveTable
            minWidth="520px"
            caption="Müşteri yaşam boyu değeri: sıra, müşteri, sipariş sayısı ve toplam harcama"
            className="rounded-none border-x-0 border-b-0 border-t border-border/40"
          >
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">#</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Müşteri</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Sipariş</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {clv.customers.map((customer, index) => (
                <tr
                  key={customer.userId}
                  className="border-t border-border/40 hover:bg-muted/40"
                >
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="block max-w-[240px] truncate">
                      {customer.name ?? customer.email}
                    </span>
                    {customer.name && (
                      <span className="block max-w-[240px] truncate text-xs text-muted-foreground">
                        {customer.email}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {customer.orderCount}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                    ₺{formatTry(customer.totalSpentCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </DashboardSection>
    </div>
  );
}
