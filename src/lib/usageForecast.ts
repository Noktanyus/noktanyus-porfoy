/**
 * Kota / kredi yanma hızı ve ay sonu projeksiyonu (SaaS usage DX).
 */

export type UsageAlertLevel = 'ok' | 'warn' | 'critical' | 'exhausted';

export interface UsageForecastInput {
  /** Ay başından bugüne istek sayısı */
  monthToDate: number;
  /** Ayın 1'inden itibaren geçen gün (en az 1) */
  dayOfMonth: number;
  /** Ayın toplam günü */
  daysInMonth: number;
  /** Abonelik/kota limiti (0 = limitsiz/yok) */
  quotaLimit: number;
  /** Kredi bakiyesi */
  creditBalance: number;
  /** Son N saatteki istek (burn rate için) */
  windowRequests: number;
  /** Burn rate penceresi (saat) */
  windowHours: number;
  billingSource: 'subscription' | 'credits' | null;
}

export interface UsageForecast {
  monthToDate: number;
  projectedMonthEnd: number;
  remainingDays: number;
  quotaLimit: number;
  quotaUsedPct: number | null;
  projectedQuotaPct: number | null;
  creditBalance: number;
  requestsPerDay: number;
  creditDaysRemaining: number | null;
  alertLevel: UsageAlertLevel;
  alertMessage: string | null;
}

function clampDay(n: number): number {
  return Math.max(1, Math.floor(n));
}

export function computeUsageForecast(input: UsageForecastInput): UsageForecast {
  const dayOfMonth = clampDay(input.dayOfMonth);
  const daysInMonth = Math.max(dayOfMonth, Math.floor(input.daysInMonth));
  const remainingDays = Math.max(0, daysInMonth - dayOfMonth);

  const dailyFromMtd = input.monthToDate / dayOfMonth;
  const windowHours = Math.max(1, input.windowHours);
  const dailyFromWindow =
    input.windowRequests > 0 ? (input.windowRequests / windowHours) * 24 : 0;
  // Kısa pencerede aktivite varsa ona ağırlık ver; yoksa MTD
  const requestsPerDay =
    input.windowRequests > 0
      ? dailyFromWindow * 0.65 + dailyFromMtd * 0.35
      : dailyFromMtd;

  const projectedMonthEnd = Math.round(
    input.monthToDate + requestsPerDay * remainingDays
  );

  const quotaLimit = Math.max(0, input.quotaLimit);
  const quotaUsedPct =
    quotaLimit > 0 ? Math.min(999, (input.monthToDate / quotaLimit) * 100) : null;
  const projectedQuotaPct =
    quotaLimit > 0 ? Math.min(999, (projectedMonthEnd / quotaLimit) * 100) : null;

  const creditDaysRemaining =
    input.creditBalance > 0 && requestsPerDay > 0
      ? input.creditBalance / requestsPerDay
      : input.creditBalance > 0
        ? null
        : 0;

  let alertLevel: UsageAlertLevel = 'ok';
  let alertMessage: string | null = null;

  if (input.billingSource === null && input.creditBalance <= 0 && quotaLimit <= 0) {
    alertLevel = 'exhausted';
    alertMessage = 'Aktif kota veya kredi yok. Plan yükseltin veya kredi yükleyin.';
  } else if (quotaUsedPct != null && quotaUsedPct >= 100) {
    alertLevel = 'exhausted';
    alertMessage = 'Aylık kota doldu. İstekler krediye düşer veya reddedilir.';
  } else if (quotaUsedPct != null && quotaUsedPct >= 95) {
    alertLevel = 'critical';
    alertMessage = `Kota %${quotaUsedPct.toFixed(0)} dolu — ay sonu projeksiyonu kritik.`;
  } else if (
    (quotaUsedPct != null && quotaUsedPct >= 80) ||
    (projectedQuotaPct != null && projectedQuotaPct >= 100)
  ) {
    alertLevel = 'warn';
    alertMessage =
      projectedQuotaPct != null && projectedQuotaPct >= 100
        ? `Mevcut hızla ay sonunda kotanın ~%${projectedQuotaPct.toFixed(0)}'ini aşarsınız.`
        : `Kota %${quotaUsedPct!.toFixed(0)} dolu.`;
  } else if (
    input.billingSource === 'credits' &&
    creditDaysRemaining != null &&
    creditDaysRemaining < 7 &&
    input.creditBalance > 0
  ) {
    alertLevel = 'warn';
    alertMessage = `Mevcut hızla krediniz ~${creditDaysRemaining.toFixed(1)} gün yeter.`;
  }

  return {
    monthToDate: input.monthToDate,
    projectedMonthEnd,
    remainingDays,
    quotaLimit,
    quotaUsedPct,
    projectedQuotaPct,
    creditBalance: input.creditBalance,
    requestsPerDay: Math.round(requestsPerDay * 10) / 10,
    creditDaysRemaining:
      creditDaysRemaining == null ? null : Math.round(creditDaysRemaining * 10) / 10,
    alertLevel,
    alertMessage,
  };
}
