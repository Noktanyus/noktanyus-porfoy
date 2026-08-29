/**
 * @file Funnel Analyzer (Pure Functions)
 * @description Event listesinden funnel raporu üretir. DB erişimi yok —
 *              sadece saf hesaplama. Test edilebilir.
 */

import type {
  FunnelEvent,
  FunnelReport,
  FunnelStep,
  FunnelStepResult,
} from "./schemas";

/**
 * Event listesini alır, step'lere göre gruplar, dönüşüm oranlarını hesaplar.
 *
 * Mantık:
 * 1. Her step için unique kullanıcı/session sayısını bul
 * 2. Önceki step'ten conversion = bu step'e ulaşan / önceki step'e ulaşan
 * 3. Cumulative = bu step / ilk step
 * 4. Drop-off = önceki - bu
 */
export function analyzeFunnel(
  events: FunnelEvent[],
  steps: ReadonlyArray<FunnelStep>,
  options?: {
    rangeStart?: number;
    rangeEnd?: number;
  }
): FunnelReport {
  const rangeStart = options?.rangeStart ?? 0;
  const rangeEnd = options?.rangeEnd ?? Date.now();

  // Zaman aralığı filtresi
  const filtered = events.filter(
    (e) => e.timestamp >= rangeStart && e.timestamp <= rangeEnd
  );

  // Her step için unique identifier'lar (sessionId + userId)
  const stepReached = new Map<string, Set<string>>();
  steps.forEach((s) => stepReached.set(s.id, new Set()));

  for (const ev of filtered) {
    for (const step of steps) {
      if (ev.name === step.eventName) {
        const key = ev.userId ?? ev.sessionId;
        stepReached.get(step.id)?.add(key);
      }
    }
  }

  // Sonuçları sırayla hesapla
  const results: FunnelStepResult[] = [];
  let prevCount = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const reached = stepReached.get(step.id)?.size ?? 0;
    const converted = i === 0 ? reached : Math.min(reached, prevCount);
    const conversionRate = prevCount > 0 ? (converted / prevCount) * 100 : 100;
    const cumulativeRate = i === 0 ? 100 : 0; // aşağıda doldurulur
    const dropped = Math.max(0, prevCount - converted);

    results.push({
      stepId: step.id,
      stepName: step.name,
      reached,
      converted,
      conversionRate,
      cumulativeRate,
      dropped,
    });

    prevCount = reached;
  }

  // Cumulative oranları doldur (ilk step'i 100% kabul ederek)
  const totalEntered = results[0]?.reached ?? 0;
  results.forEach((r) => {
    if (totalEntered > 0) {
      r.cumulativeRate = (r.reached / totalEntered) * 100;
    }
  });

  const totalCompleted = results[results.length - 1]?.reached ?? 0;
  const overallConversion = totalEntered > 0 ? (totalCompleted / totalEntered) * 100 : 0;

  // En büyük drop-off — sadece önceki step'te veri olan karşılaştırmalar
  let biggestDropoff: FunnelReport["biggestDropoff"] = null;
  let maxDropoff = 0;
  for (let i = 1; i < results.length; i++) {
    const prev = results[i - 1];
    const r = results[i];
    // Önceki step'te veri yoksa (prevCount === 0) bu karşılaştırma anlamsız
    if (prev.reached === 0) continue;
    const dropoffPercent = 100 - r.conversionRate;
    if (dropoffPercent > maxDropoff) {
      maxDropoff = dropoffPercent;
      biggestDropoff = { stepId: r.stepId, dropoffPercent };
    }
  }

  return {
    steps: results,
    totalEntered,
    totalCompleted,
    overallConversion,
    biggestDropoff,
    rangeStart,
    rangeEnd,
  };
}

/**
 * Belirli bir step'te drop-off yüzdesini döner.
 */
export function stepDropoffPercent(report: FunnelReport, stepId: string): number {
  const step = report.steps.find((s) => s.stepId === stepId);
  if (!step) return 0;
  return 100 - step.conversionRate;
}

/**
 * Funnel'i iyileştirme için öneriler üretir.
 */
export interface FunnelInsight {
  type: "warning" | "info" | "success";
  stepId: string;
  message: string;
}

export function generateInsights(report: FunnelReport): FunnelInsight[] {
  const insights: FunnelInsight[] = [];

  report.steps.forEach((step, i) => {
    if (i === 0) return; // İlk step'te drop-off kontrol edilmez
    if (step.reached === 0) return; // Veri yoksa insight üretme

    if (step.conversionRate < 30) {
      insights.push({
        type: "warning",
        stepId: step.stepId,
        message: `${step.stepName} adımında %${(100 - step.conversionRate).toFixed(1)} drop-off var. UX veya teknik sorun olabilir.`,
      });
    } else if (step.conversionRate < 60) {
      insights.push({
        type: "info",
        stepId: step.stepId,
        message: `${step.stepName} dönüşüm oranı %${step.conversionRate.toFixed(1)}. İyileştirme fırsatı.`,
      });
    } else if (step.conversionRate >= 80) {
      insights.push({
        type: "success",
        stepId: step.stepId,
        message: `${step.stepName} dönüşüm oranı mükemmel: %${step.conversionRate.toFixed(1)}.`,
      });
    }
  });

  return insights;
}