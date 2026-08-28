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
    redirect('/admin/login');
  }

  const [revenue, funnel, clv] = await Promise.all([
    analyticsService.getRevenueStats(),
    analyticsService.getFunnelStats(),
    analyticsService.getCLV({ limit: 50 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Analytics Dashboard</h1>
          <p className="admin-subtitle">
            Gelir, dönüşüm hunisi ve müşteri yaşam boyu değeri (CLV)
          </p>
        </div>
      </div>

      <RevenueDashboard stats={revenue} />

      <FunnelChart stages={funnel.stages} period={funnel.period} />

      <div className="admin-card">
        <h2 className="text-sm font-semibold mb-1">En Değerli Müşteriler (CLV)</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {clv.customerCount} ödeme yapan müşteri · Ortalama CLV ₺{formatTry(clv.avgCLVCents)} ·
          Toplam ₺{formatTry(clv.totalCLVCents)}
        </p>

        {clv.customers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Henüz ödeme yapan müşteri bulunmuyor.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="py-2 pr-4 font-medium text-muted-foreground">#</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground">Müşteri</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground text-right">
                    Sipariş
                  </th>
                  <th className="py-2 font-medium text-muted-foreground text-right">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {clv.customers.map((customer, index) => (
                  <tr
                    key={customer.userId}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <td className="py-2 pr-4 tabular-nums text-muted-foreground">{index + 1}</td>
                    <td className="py-2 pr-4">
                      <span className="block truncate max-w-[240px]">
                        {customer.name ?? customer.email}
                      </span>
                      {customer.name && (
                        <span className="block text-xs text-muted-foreground truncate max-w-[240px]">
                          {customer.email}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{customer.orderCount}</td>
                    <td className="py-2 text-right tabular-nums font-medium">
                      ₺{formatTry(customer.totalSpentCents)}
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
