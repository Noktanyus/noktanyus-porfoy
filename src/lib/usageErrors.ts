/**
 * API hata oranı agregasyonu (4xx+5xx / toplam).
 * Usage dashboard için pure helper — Moesif tarzı error-rate.
 */

export interface ErrorRateSummary {
  total: number;
  /** statusCode >= 400 */
  errorCount: number;
  /** total - errorCount */
  okCount: number;
  /** 0–100; total=0 → 0 */
  errorRatePct: number;
}

export interface EndpointErrorRow {
  endpoint: string;
  total: number;
  errorCount: number;
  errorRatePct: number;
}

/** HTTP hata yanıtı mı? (4xx + 5xx) */
export function isErrorStatus(code: number | null | undefined): boolean {
  return typeof code === 'number' && Number.isFinite(code) && code >= 400;
}

function roundPct(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Tam sayılardan hata oranı (%). total ≤ 0 → 0.
 */
export function errorRateFromCounts(total: number, errorCount: number): number {
  const t = Math.max(0, Math.floor(total));
  if (t <= 0) return 0;
  const e = Math.max(0, Math.min(t, Math.floor(errorCount)));
  return roundPct((e / t) * 100);
}

/**
 * Status kod listesinden genel hata özeti.
 * Geçersiz / null kodlar atlanır.
 */
export function aggregateErrorRate(
  statusCodes: Array<number | null | undefined>
): ErrorRateSummary {
  let total = 0;
  let errorCount = 0;
  for (const code of statusCodes) {
    if (typeof code !== 'number' || !Number.isFinite(code)) continue;
    total += 1;
    if (isErrorStatus(code)) errorCount += 1;
  }
  return {
    total,
    errorCount,
    okCount: total - errorCount,
    errorRatePct: errorRateFromCounts(total, errorCount),
  };
}

/**
 * Endpoint bazlı hata oranı; errorCount (sonra rate) azalan sırada.
 */
export function aggregateEndpointErrorRates(
  rows: Array<{ endpoint: string; statusCode: number | null | undefined }>
): EndpointErrorRow[] {
  const buckets = new Map<string, { total: number; errorCount: number }>();
  for (const row of rows) {
    if (typeof row.statusCode !== 'number' || !Number.isFinite(row.statusCode)) {
      continue;
    }
    const cur = buckets.get(row.endpoint) ?? { total: 0, errorCount: 0 };
    cur.total += 1;
    if (isErrorStatus(row.statusCode)) cur.errorCount += 1;
    buckets.set(row.endpoint, cur);
  }

  return Array.from(buckets.entries())
    .map(([endpoint, b]) => ({
      endpoint,
      total: b.total,
      errorCount: b.errorCount,
      errorRatePct: errorRateFromCounts(b.total, b.errorCount),
    }))
    .sort((a, b) => {
      if (b.errorCount !== a.errorCount) return b.errorCount - a.errorCount;
      if (b.errorRatePct !== a.errorRatePct) return b.errorRatePct - a.errorRatePct;
      return a.endpoint.localeCompare(b.endpoint);
    });
}

/**
 * En çok hata üreten endpoint’ler (errorCount > 0).
 */
export function topFailingEndpoints(
  rows: EndpointErrorRow[],
  limit = 5
): EndpointErrorRow[] {
  const take = Math.max(0, Math.floor(limit));
  return rows.filter((r) => r.errorCount > 0).slice(0, take);
}

/** UI / API için % formatı (TR). */
export function formatErrorRatePct(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return '—';
  return `%${pct.toFixed(1)}`;
}
