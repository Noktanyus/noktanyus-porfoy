import { describe, expect, it } from 'vitest';
import {
  aggregateLatency,
  attachEndpointLatency,
  formatLatencyMs,
  percentileNearestRank,
} from '@/lib/usageLatency';

describe('percentileNearestRank', () => {
  it('returns null for empty', () => {
    expect(percentileNearestRank([], 50)).toBeNull();
  });

  it('returns single value for all percentiles', () => {
    expect(percentileNearestRank([42], 50)).toBe(42);
    expect(percentileNearestRank([42], 95)).toBe(42);
  });

  it('computes nearest-rank p50/p95 on sorted input', () => {
    const sorted = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    expect(percentileNearestRank(sorted, 50)).toBe(50);
    expect(percentileNearestRank(sorted, 95)).toBe(100);
  });
});

describe('aggregateLatency', () => {
  it('returns nulls when no valid samples', () => {
    expect(aggregateLatency([])).toEqual({
      sampleCount: 0,
      avgMs: null,
      p50Ms: null,
      p95Ms: null,
    });
    expect(aggregateLatency([null, undefined, -1, Number.NaN])).toEqual({
      sampleCount: 0,
      avgMs: null,
      p50Ms: null,
      p95Ms: null,
    });
  });

  it('computes avg, p50 and p95', () => {
    const s = aggregateLatency([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(s.sampleCount).toBe(10);
    expect(s.avgMs).toBe(55);
    expect(s.p50Ms).toBe(50);
    expect(s.p95Ms).toBe(100);
  });

  it('includes zero latency', () => {
    const s = aggregateLatency([0, 0, 10]);
    expect(s.sampleCount).toBe(3);
    expect(s.avgMs).toBeCloseTo(3.3, 1);
    expect(s.p50Ms).toBe(0);
  });
});

describe('attachEndpointLatency', () => {
  it('attaches per-endpoint summaries in caller order', () => {
    const rows = attachEndpointLatency(
      [
        { endpoint: '/a', count: 3 },
        { endpoint: '/b', count: 1 },
      ],
      [
        { endpoint: '/a', durationMs: 10 },
        { endpoint: '/a', durationMs: 30 },
        { endpoint: '/b', durationMs: 100 },
        { endpoint: '/a', durationMs: null },
      ]
    );
    expect(rows[0]?.endpoint).toBe('/a');
    expect(rows[0]?.latency.sampleCount).toBe(2);
    expect(rows[0]?.latency.avgMs).toBe(20);
    expect(rows[1]?.latency.p50Ms).toBe(100);
  });

  it('returns empty latency when no durations for endpoint', () => {
    const rows = attachEndpointLatency([{ endpoint: '/x', count: 5 }], []);
    expect(rows[0]?.latency.avgMs).toBeNull();
  });
});

describe('formatLatencyMs', () => {
  it('formats null and values', () => {
    expect(formatLatencyMs(null)).toBe('—');
    expect(formatLatencyMs(undefined)).toBe('—');
    expect(formatLatencyMs(4.2)).toBe('4.2 ms');
    expect(formatLatencyMs(42.7)).toBe('43 ms');
  });
});
