/**
 * @file Revenue Metrics
 * @description G1: SaaS için temel finansal metrikler — MRR, ARR, Churn, LTV, ARPU.
 *              Prisma'dan subscription + order verilerini çekerek hesaplar.
 *
 *              Not: Hesaplama `service.ts`'te. Bu dosya pure-function formülleri
 *              içerir (test edilebilir).
 *
 *              LTV hesaplama — 2 metod:
 *              1. Historical: ARPU × Average customer lifetime months
 *              2. Conventional (SaaS standard): ARPU / Monthly churn rate
 *              Kural: Churn > 0 ise conventional, aksi halde historical.
 *              Hem değerleri hem de hangi metodun kullanıldığını döndürürüz.
 */

export interface RevenueInputs {
  /** Aktif aboneliklerin toplam aylık geliri */
  monthlyRecurringRevenue: number;
  /** Bu ay iptal edilen abonelik sayısı */
  churnedThisMonth: number;
  /** Ay başındaki toplam aktif abonelik sayısı */
  activeAtStartOfMonth: number;
  /** Toplam müşteri sayısı */
  totalCustomers: number;
  /** Ortalama abonelik süresi (ay) — historical LTV için */
  averageLifetimeMonths: number;
}

export type LTVMethod = "conventional" | "historical" | "fallback";

export interface LTVBreakdown {
  value: number;
  method: LTVMethod;
  /** Hesaplamada kullanılan input'lar (debug için) */
  inputs: {
    arpu: number;
    monthlyChurnRate: number;
    averageLifetimeMonths: number;
  };
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  churnRate: number; // %
  ltv: number;
  arpu: number; // Average Revenue Per User
  /** LTV breakdown — hangi metod kullanıldı + bileşenleri */
  ltvBreakdown: LTVBreakdown;
}

/**
 * MRR (Monthly Recurring Revenue) — direkt girdiden alınır.
 */
export function calcMRR(input: RevenueInputs): number {
  return input.monthlyRecurringRevenue;
}

/**
 * ARR (Annual Recurring Revenue) — MRR × 12.
 */
export function calcARR(input: RevenueInputs): number {
  return calcMRR(input) * 12;
}

/**
 * Churn Rate (%) = (Bu ay churn / Ay başı aktif) × 100
 * 0'a bölünme koruması var.
 */
export function calcChurnRate(input: RevenueInputs): number {
  if (input.activeAtStartOfMonth === 0) return 0;
  return (input.churnedThisMonth / input.activeAtStartOfMonth) * 100;
}

/**
 * ARPU (Average Revenue Per User) — MRR / Toplam müşteri.
 */
export function calcARPU(input: RevenueInputs): number {
  if (input.totalCustomers === 0) return 0;
  return input.monthlyRecurringRevenue / input.totalCustomers;
}

/**
 * LTV (Lifetime Value) — SaaS standardına uygun 3-yollu hesaplama:
 *
 *   1. Conventional (tercih edilen): ARPU / (Monthly Churn Rate / 100)
 *      — Recurring revenue iş modeli için doğru tahmin.
 *
 *   2. Historical: ARPU × Average customer lifetime months
 *      — Churn verisi yetersizse (early-stage SaaS).
 *
 *   3. Fallback: 0 — Ne churn ne de lifetime verisi yoksa.
 *      — Ürün henüz launch edilmemiş.
 *
 * Not: Negatif veya anlamsız değerler (örn. %100+ churn) fallback'e düşer.
 */
export function calcLTV(input: RevenueInputs): LTVBreakdown {
  const arpu = calcARPU(input);
  const monthlyChurnRate = calcChurnRate(input);

  // Conventional path: 0 < churn < 100
  if (monthlyChurnRate > 0 && monthlyChurnRate < 100) {
    const value = arpu / (monthlyChurnRate / 100);
    if (Number.isFinite(value) && value > 0) {
      return {
        value,
        method: "conventional",
        inputs: { arpu, monthlyChurnRate, averageLifetimeMonths: input.averageLifetimeMonths },
      };
    }
  }

  // Historical path: churn 0 veya invalid, ama lifetime var
  if (input.averageLifetimeMonths > 0 && arpu > 0) {
    const value = arpu * input.averageLifetimeMonths;
    return {
      value,
      method: "historical",
      inputs: { arpu, monthlyChurnRate, averageLifetimeMonths: input.averageLifetimeMonths },
    };
  }

  // Fallback — veri yetersiz
  return {
    value: 0,
    method: "fallback",
    inputs: { arpu, monthlyChurnRate, averageLifetimeMonths: input.averageLifetimeMonths },
  };
}

/**
 * Tüm metrikleri tek seferde hesapla.
 */
export function computeMetrics(input: RevenueInputs): RevenueMetrics {
  const ltvBreakdown = calcLTV(input);
  return {
    mrr: calcMRR(input),
    arr: calcARR(input),
    churnRate: calcChurnRate(input),
    ltv: ltvBreakdown.value,
    arpu: calcARPU(input),
    ltvBreakdown,
  };
}

/**
 * Metrikleri formatlar (UI'da göstermek için).
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Trend yüzdesi — önceki dönem ile karşılaştırma.
 */
export function trendPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Trend yönü (UI badge için).
 */
export type TrendDirection = "up" | "down" | "flat";

export function trendDirection(percent: number, threshold = 0.5): TrendDirection {
  if (percent > threshold) return "up";
  if (percent < -threshold) return "down";
  return "flat";
}