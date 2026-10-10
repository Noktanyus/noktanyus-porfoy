/**
 * API istek latency agregasyonu (p50 / p95 / avg).
 * Usage dashboard ve CSV export için pure helper.
 */

export interface LatencySummary {
  /** durationMs dolu kayıt sayısı */
  sampleCount: number;
  avgMs: number | null;
  p50Ms: number | null;
  p95Ms: number | null;
}

export interface EndpointLatencyRow {
  endpoint: string;
  count: number;
  latency: LatencySummary;
}

/** Nearest-rank percentile; sorted ascending, p in (0, 100]. */
export function percentileNearestRank(
  sortedAsc: number[],
  p: number
): number | null {
  if (sortedAsc.length === 0) return null;
  const clamped = Math.min(100, Math.max(0, p));
  if (clamped <= 0) return sortedAsc[0] ?? null;
  const rank = Math.ceil((clamped / 100) * sortedAsc.length) - 1;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, rank));
  return sortedAsc[idx] ?? null;
}

function roundMs(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Null / negatif / NaN değerleri atar; avg + p50 + p95 üretir.
 * Örnek yoksa tüm metrikler null.
 */
export function aggregateLatency(
  samples: Array<number | null | undefined>
): LatencySummary {
  const values: number[] = [];
  for (const s of samples) {
    if (typeof s !== 'number' || !Number.isFinite(s) || s < 0) continue;
    values.push(s);
  }

  if (values.length === 0) {
    return { sampleCount: 0, avgMs: null, p50Ms: null, p95Ms: null };
  }

  values.sort((a, b) => a - b);
  const sum = values.reduce((acc, v) => acc + v, 0);

  return {
    sampleCount: values.length,
    avgMs: roundMs(sum / values.length),
    p50Ms: roundMs(percentileNearestRank(values, 50)!),
    p95Ms: roundMs(percentileNearestRank(values, 95)!),
  };
}

/**
 * Endpoint bazlı latency; count sırası korunur (caller sıralaması).
 */
export function attachEndpointLatency(
  byEndpoint: Array<{ endpoint: string; count: number }>,
  rows: Array<{ endpoint: string; durationMs: number | null | undefined }>
): EndpointLatencyRow[] {
  const buckets = new Map<string, number[]>();
  for (const row of rows) {
    if (typeof row.durationMs !== 'number' || !Number.isFinite(row.durationMs) || row.durationMs < 0) {
      continue;
    }
    const list = buckets.get(row.endpoint);
    if (list) list.push(row.durationMs);
    else buckets.set(row.endpoint, [row.durationMs]);
  }

  return byEndpoint.map((ep) => ({
    endpoint: ep.endpoint,
    count: ep.count,
    latency: aggregateLatency(buckets.get(ep.endpoint) ?? []),
  }));
}

/** UI / API için kompakt ms formatı (TR). */
export function formatLatencyMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  if (ms < 10) return `${ms.toFixed(1)} ms`;
  return `${Math.round(ms)} ms`;
}
