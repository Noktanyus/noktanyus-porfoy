import { describe, expect, it } from 'vitest';
import { detectUsageAnomalies, median } from '@/lib/usageAnomaly';

describe('median', () => {
  it('returns 0 for empty', () => {
    expect(median([])).toBe(0);
  });

  it('handles odd and even lengths', () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('detectUsageAnomalies', () => {
  it('detects spike when last hour > 3x baseline median', () => {
    // last=30, baseline all 5 → median 5 → 30 > 15
    const hourly = [30, 5, 5, 5, 5, 5];
    const anomalies = detectUsageAnomalies({
      hourlyCountsNewestFirst: hourly,
      baselineHours: 5,
      spikeMultiplier: 3,
    });
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.kind).toBe('spike');
    expect(anomalies[0]?.lastHour).toBe(30);
    expect(anomalies[0]?.baselineMedian).toBe(5);
    expect(anomalies[0]?.message).toMatch(/olağandışı/i);
  });

  it('skips spike when median is 0', () => {
    const anomalies = detectUsageAnomalies({
      hourlyCountsNewestFirst: [10, 0, 0, 0],
      baselineHours: 3,
    });
    expect(anomalies.filter((a) => a.kind === 'spike')).toHaveLength(0);
  });

  it('skips spike under multiplier', () => {
    const anomalies = detectUsageAnomalies({
      hourlyCountsNewestFirst: [14, 5, 5, 5],
      baselineHours: 3,
      spikeMultiplier: 3,
    });
    // 14 <= 15
    expect(anomalies.filter((a) => a.kind === 'spike')).toHaveLength(0);
  });

  it('detects silence for paid plan with yesterday traffic and zero today', () => {
    const anomalies = detectUsageAnomalies({
      hourlyCountsNewestFirst: [0, 0],
      yesterdayCount: 40,
      todayCount: 0,
      isPaidPlan: true,
    });
    expect(anomalies.some((a) => a.kind === 'silence')).toBe(true);
  });

  it('skips silence for free / unpaid', () => {
    const anomalies = detectUsageAnomalies({
      hourlyCountsNewestFirst: [],
      yesterdayCount: 40,
      todayCount: 0,
      isPaidPlan: false,
    });
    expect(anomalies.filter((a) => a.kind === 'silence')).toHaveLength(0);
  });

  it('skips silence when today already has traffic', () => {
    const anomalies = detectUsageAnomalies({
      hourlyCountsNewestFirst: [1],
      yesterdayCount: 40,
      todayCount: 1,
      isPaidPlan: true,
    });
    expect(anomalies.filter((a) => a.kind === 'silence')).toHaveLength(0);
  });
});
