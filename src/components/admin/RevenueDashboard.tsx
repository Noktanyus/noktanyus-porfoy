'use client';

/**
 * @file Revenue Dashboard KPI kartlari + gunluk gelir sparkline.
 * @description Admin analytics sayfasinda gelir metriklerini gosterir.
 *              Tum tutarlar kurus (cents) olarak gelir, burada TRY'ye cevrilir.
 */

import { FaMoneyBillWave, FaShoppingCart, FaChartLine, FaUserMinus } from 'react-icons/fa';
import type { RevenueStats } from '@/modules/analytics/service';

/** Kurus -> okunabilir TRY metni. */
function formatTry(cents: number): string {
  return (cents / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function RevenueDashboard({ stats }: { stats: RevenueStats }) {
  const cards = [
    {
      label: 'Toplam Gelir',
      value: `₺${formatTry(stats.totalRevenueCents)}`,
      icon: <FaMoneyBillWave className="text-emerald-500 w-6 h-6" aria-hidden="true" />,
    },
    {
      label: `Son ${stats.periodDays} Gün Gelir`,
      value: `₺${formatTry(stats.monthRevenueCents)}`,
      icon: <FaChartLine className="text-blue-500 w-6 h-6" aria-hidden="true" />,
    },
    {
      label: 'Ortalama Sipariş',
      value: `₺${formatTry(stats.avgOrderValueCents)}`,
      icon: <FaShoppingCart className="text-purple-500 w-6 h-6" aria-hidden="true" />,
    },
    {
      label: 'İptal Edilen Abonelik',
      value: String(stats.churnedSubs),
      icon: <FaUserMinus className="text-red-500 w-6 h-6" aria-hidden="true" />,
    },
  ];

  // Sparkline icin en yuksek gunluk gelir (bar yuksekliklerini normalize etmek icin).
  const peak = stats.dailyRevenue.reduce((max, point) => Math.max(max, point.revenueCents), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="admin-card">
            {card.icon}
            <p className="text-2xl font-bold mt-2 tabular-nums">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <h2 className="text-sm font-semibold mb-1">Günlük Gelir</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Son {stats.periodDays} gün · {stats.paidInPeriod} ödenen sipariş ·{' '}
          {stats.orderCount} toplam ödenen sipariş
        </p>

        {stats.dailyRevenue.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Bu dönemde ödenen sipariş bulunmuyor.
          </p>
        ) : (
          <div className="flex items-end gap-1 h-32" role="img" aria-label="Günlük gelir grafiği">
            {stats.dailyRevenue.map((point) => (
              <div
                key={point.day}
                className="flex-1 bg-primary/70 hover:bg-primary rounded-t transition-colors min-h-[2px]"
                style={{ height: peak ? `${(point.revenueCents / peak) * 100}%` : '2px' }}
                title={`${point.day}: ₺${formatTry(point.revenueCents)}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
