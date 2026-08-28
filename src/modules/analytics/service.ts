/**
 * @file Analytics Service — Revenue Dashboard (G1) + Funnel Analysis (G2).
 * @description Admin paneli icin gelir, donusum hunisi ve CLV metriklerini uretir.
 *
 * Onemli notlar:
 * - Tum para birimleri "cents" (kurus) cinsindendir. UI katmani 100'e boler.
 * - Order modeli Prisma'da @@map kullanmadigi icin fiziksel tablo adi "Order"dir.
 * - Postgres SUM() BigInt dondurur; JSON serialize edilebilmesi icin Number'a cevrilir.
 * - Funnel'in "Visitors" basamagi bir PROXY'dir: projede pageview/visit tablosu
 *   olmadigi icin toplam kayitli kullanici sayisi kullanilir. Gercek ziyaretci
 *   verisi eklendiginde bu basamak guncellenmelidir.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/** Gunluk gelir grafigi noktasi. */
export interface DailyRevenuePoint {
  /** ISO tarih (YYYY-MM-DD). */
  day: string;
  /** O gunun toplam geliri (kurus). */
  revenueCents: number;
}

/** Revenue dashboard metrikleri. */
export interface RevenueStats {
  totalRevenueCents: number;
  monthRevenueCents: number;
  avgOrderValueCents: number;
  orderCount: number;
  paidInPeriod: number;
  churnedSubs: number;
  dailyRevenue: DailyRevenuePoint[];
  periodDays: number;
}

/** Funnel basamagi. */
export interface FunnelStage {
  name: string;
  value: number;
  /** Onceki basamaga gore donusum orani (%). Ilk basamak her zaman 100. */
  conversionRate: number;
}

/** CLV (Customer Lifetime Value) satiri. */
export interface ClvCustomer {
  userId: string;
  name: string | null;
  email: string;
  totalSpentCents: number;
  orderCount: number;
}

/** Bir donem baslangic tarihini gun sayisindan uretir. */
function periodStart(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/** Gun sayisini pozitif tam sayiya sabitler (SQL/donem hatalarini onler). */
function normalizeDays(days: number | undefined): number {
  const value = Number(days ?? 30);
  if (!Number.isFinite(value) || value <= 0) return 30;
  return Math.min(Math.floor(value), 365);
}

/** Yuzde hesabi — sifira bolmeyi engeller. */
function rate(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

export const analyticsService = {
  /**
   * G1 — Revenue Dashboard metrikleri.
   * @param opts.days Donem uzunlugu (gun). Varsayilan 30, max 365.
   */
  async getRevenueStats(opts: { days?: number } = {}): Promise<RevenueStats> {
    const days = normalizeDays(opts.days);
    const since = periodStart(days);

    const [
      totalRevenue,
      monthRevenue,
      avgOrderValue,
      orderCount,
      paidCount,
      churnedSubs,
      dailyRevenue,
    ] = await Promise.all([
        prisma.order.aggregate({
          where: { status: 'PAID' },
          _sum: { totalCents: true },
        }),
        prisma.order.aggregate({
          where: { status: 'PAID', createdAt: { gte: since } },
          _sum: { totalCents: true },
        }),
        prisma.order.aggregate({
          where: { status: 'PAID' },
          _avg: { totalCents: true },
        }),
        prisma.order.count({ where: { status: 'PAID' } }),
        prisma.order.count({ where: { status: 'PAID', createdAt: { gte: since } } }),
        prisma.userSubscription.count({ where: { status: 'cancelled' } }),
        // Grafik serisi de ayni turda paralel cekilir.
        analyticsService.getDailyRevenue(days),
      ]);

    return {
      totalRevenueCents: totalRevenue._sum.totalCents ?? 0,
      monthRevenueCents: monthRevenue._sum.totalCents ?? 0,
      avgOrderValueCents: Math.round(avgOrderValue._avg.totalCents ?? 0),
      orderCount,
      paidInPeriod: paidCount,
      churnedSubs,
      dailyRevenue,
      periodDays: days,
    };
  },

  /**
   * Gunluk gelir serisi (grafik icin). Raw SQL kullanir cunku Prisma groupBy
   * gun bazinda DATE() truncation desteklemiyor.
   *
   * Sorgu basarisiz olursa bos dizi doner — dashboard'un tamami cokmemeli.
   */
  async getDailyRevenue(days = 30): Promise<DailyRevenuePoint[]> {
    const since = periodStart(normalizeDays(days));

    try {
      const rows = await prisma.$queryRaw<Array<{ day: Date | string; revenue: bigint | number | null }>>`
        SELECT DATE("createdAt") AS day, SUM("totalCents") AS revenue
        FROM "Order"
        WHERE "status" = 'PAID' AND "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
        ORDER BY day ASC
      `;

      return rows.map((row) => ({
        day: row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day),
        // Postgres SUM(int) -> BigInt; JSON.stringify BigInt'i serialize edemez.
        revenueCents: Number(row.revenue ?? 0),
      }));
    } catch (error) {
      logger.warn('getDailyRevenue basarisiz, bos seri donduruluyor', { error });
      return [];
    }
  },

  /**
   * G2 — Funnel Analysis.
   * Basamaklar: Visitors -> Signups -> Activated -> Orders -> Paid.
   * Her basamagin conversionRate degeri ONCEKI basamaga goredir.
   */
  async getFunnelStats(opts: { days?: number } = {}): Promise<{
    stages: FunnelStage[];
    period: number;
  }> {
    const days = normalizeDays(opts.days);
    const since = periodStart(days);

    const [visitors, signups, activated, orders, paid] = await Promise.all([
      // PROXY: pageview tablosu yok, toplam kayitli kullanici ust basamak sayilir.
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      // Aktive olmus = donem icinde kaydolup en az 1 monitor kurmus kullanici.
      prisma.user.count({ where: { createdAt: { gte: since }, monitors: { some: {} } } }),
      prisma.order.count({ where: { createdAt: { gte: since } } }),
      prisma.order.count({ where: { status: 'PAID', createdAt: { gte: since } } }),
    ]);

    const stages: FunnelStage[] = [
      { name: 'Visitors', value: visitors, conversionRate: 100 },
      { name: 'Signups', value: signups, conversionRate: rate(signups, visitors) },
      { name: 'Activated', value: activated, conversionRate: rate(activated, signups) },
      { name: 'Orders', value: orders, conversionRate: rate(orders, activated) },
      { name: 'Paid', value: paid, conversionRate: rate(paid, orders) },
    ];

    return { stages, period: days };
  },

  /**
   * CLV (Customer Lifetime Value) — en degerli musteriler.
   * Sadece PAID siparisi olan kullanicilar hesaba katilir.
   *
   * @param opts.limit Donen musteri sayisi (varsayilan 50).
   */
  async getCLV(opts: { limit?: number } = {}): Promise<{
    customers: ClvCustomer[];
    avgCLVCents: number;
    totalCLVCents: number;
    customerCount: number;
  }> {
    const limit = Math.min(Math.max(Number(opts.limit ?? 50), 1), 500);

    const users = await prisma.user.findMany({
      where: { orders: { some: { status: 'PAID' } } },
      select: {
        id: true,
        name: true,
        email: true,
        orders: {
          where: { status: 'PAID' },
          select: { totalCents: true },
        },
      },
    });

    const customers: ClvCustomer[] = users.map((user) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      totalSpentCents: user.orders.reduce((sum, order) => sum + order.totalCents, 0),
      orderCount: user.orders.length,
    }));

    const totalCLVCents = customers.reduce((sum, c) => sum + c.totalSpentCents, 0);
    const avgCLVCents = customers.length ? Math.round(totalCLVCents / customers.length) : 0;

    return {
      customers: [...customers]
        .sort((a, b) => b.totalSpentCents - a.totalSpentCents)
        .slice(0, limit),
      avgCLVCents,
      totalCLVCents,
      customerCount: customers.length,
    };
  },
};
