/**
 * Kullanım anomalisi tespiti (soft alert) — pure helper.
 * Spike: son saat > N saatlik baseline medyanının K katı.
 * Silence: dün trafik var, bugün sıfır (yalnızca ücretli plan).
 */

export type UsageAnomalyKind = 'spike' | 'silence';

export interface UsageAnomaly {
  kind: UsageAnomalyKind;
  /** Soft uyarı seviyesi */
  level: 'warn' | 'info';
  /** Türkçe banner / bildirim metni */
  message: string;
  lastHour?: number;
  baselineMedian?: number;
  ratio?: number;
  yesterdayCount?: number;
  todayCount?: number;
}

export interface DetectUsageAnomaliesInput {
  /**
   * Saatlik istek sayıları, en yeni önce:
   * [son saat, saat-1, …, saat-(N)]
   */
  hourlyCountsNewestFirst: number[];
  /** Baseline için önceki saat sayısı (varsayılan 24) */
  baselineHours?: number;
  /** Spike çarpanı (varsayılan 3) */
  spikeMultiplier?: number;
  /** Silence için dünkü toplam */
  yesterdayCount?: number;
  /** Silence için bugünkü toplam (UTC gün) */
  todayCount?: number;
  /** Silence yalnız ücretli / abonelik planında */
  isPaidPlan?: boolean;
}

/** Basit medyan; boş dizi → 0 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].map((n) => Math.max(0, n)).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Soft anomali listesi (sıra: spike, silence).
 * Baseline medyanı 0 ise spike üretilmez (gürültüyü keser).
 */
export function detectUsageAnomalies(
  input: DetectUsageAnomaliesInput
): UsageAnomaly[] {
  const out: UsageAnomaly[] = [];
  const baselineHours = Math.max(1, Math.floor(input.baselineHours ?? 24));
  const multiplier = Math.max(1, input.spikeMultiplier ?? 3);
  const hours = input.hourlyCountsNewestFirst.map((n) =>
    Math.max(0, Math.floor(n))
  );

  if (hours.length >= 2) {
    const lastHour = hours[0] ?? 0;
    const baseline = hours.slice(1, 1 + baselineHours);
    const baselineMedian = median(baseline);

    if (baselineMedian > 0 && lastHour > multiplier * baselineMedian) {
      const ratio = lastHour / baselineMedian;
      out.push({
        kind: 'spike',
        level: 'warn',
        message: `Son 1 saatte istek sayısı olağandışı yüksek (${lastHour.toLocaleString('tr-TR')} · medyan ${baselineMedian.toLocaleString('tr-TR')} · ~${ratio.toFixed(1)}×).`,
        lastHour,
        baselineMedian,
        ratio,
      });
    }
  }

  const yesterday = Math.max(0, Math.floor(input.yesterdayCount ?? 0));
  const today = Math.max(0, Math.floor(input.todayCount ?? 0));
  if (input.isPaidPlan && yesterday > 0 && today === 0) {
    out.push({
      kind: 'silence',
      level: 'info',
      message:
        'Dün API trafiği varken bugün henüz istek yok. Entegrasyonu veya anahtarları kontrol edin.',
      yesterdayCount: yesterday,
      todayCount: today,
    });
  }

  return out;
}
