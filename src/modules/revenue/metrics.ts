/**
 * @file Revenue Metrics
 * @description G1: SaaS için temel finansal metrikler — MRR, ARR, Churn, LTV, ARPU.
 *              Prisma'dan subscription + order verilerini çekerek hesaplar.
 *
 *              Not: Gerçek hesaplama `service.ts`'te. Bu dosya sadece
 *              pure-function formülleri içerir (test edilebilir).
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
  /** Ortalama abonelik süresi (ay) */
  averageLifetimeMonths: number;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  churnRate: number; // %
  ltv: number;
  arpu: number; // Average Revenue Per User
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
 * LTV (Lifetime Value) — ARPU × Ortalama ömür (ay).
 *
 * Alternatif: ARPU / Monthly churn rate (eğer churn > 0 ise).
 * Burada basitleştirilmiş LTV kullanıyoruz.
 */
export function calcLTV(input: RevenueInputs): number {
  const churn = calcChurnRate(input);
  if (churn > 0) {
    // LTV = ARPU / (Churn Rate / 100)
    const arpu = calcARPU(input);
    return arpu / (churn / 100);
  }
  // Churn 0 ise averageLifetimeMonths kullan
  return calcARPU(input) * input.averageLifetimeMonths;
}

/**
 * Tüm metrikleri tek seferde hesapla.
 */
export function computeMetrics(input: RevenueInputs): RevenueMetrics {
  return {
    mrr: calcMRR(input),
    arr: calcARR(input),
    churnRate: calcChurnRate(input),
    ltv: calcLTV(input),
    arpu: calcARPU(input),
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