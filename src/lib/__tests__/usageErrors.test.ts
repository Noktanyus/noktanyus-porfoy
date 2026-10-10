import { describe, expect, it } from 'vitest';
import {
  aggregateEndpointErrorRates,
  aggregateErrorRate,
  errorRateFromCounts,
  formatErrorRatePct,
  isErrorStatus,
  topFailingEndpoints,
} from '@/lib/usageErrors';

describe('isErrorStatus', () => {
  it('treats 4xx and 5xx as errors', () => {
    expect(isErrorStatus(400)).toBe(true);
    expect(isErrorStatus(404)).toBe(true);
    expect(isErrorStatus(429)).toBe(true);
    expect(isErrorStatus(500)).toBe(true);
    expect(isErrorStatus(503)).toBe(true);
  });

  it('treats 2xx/3xx and invalid as non-errors', () => {
    expect(isErrorStatus(200)).toBe(false);
    expect(isErrorStatus(201)).toBe(false);
    expect(isErrorStatus(301)).toBe(false);
    expect(isErrorStatus(399)).toBe(false);
    expect(isErrorStatus(null)).toBe(false);
    expect(isErrorStatus(undefined)).toBe(false);
    expect(isErrorStatus(Number.NaN)).toBe(false);
  });
});

describe('errorRateFromCounts', () => {
  it('returns 0 when total is 0', () => {
    expect(errorRateFromCounts(0, 0)).toBe(0);
    expect(errorRateFromCounts(0, 5)).toBe(0);
  });

  it('computes percentage rounded to 2 decimals', () => {
    expect(errorRateFromCounts(100, 5)).toBe(5);
    expect(errorRateFromCounts(3, 1)).toBe(33.33);
    expect(errorRateFromCounts(10, 10)).toBe(100);
  });
});

describe('aggregateErrorRate', () => {
  it('returns zeros for empty / invalid input', () => {
    expect(aggregateErrorRate([])).toEqual({
      total: 0,
      errorCount: 0,
      okCount: 0,
      errorRatePct: 0,
    });
    expect(aggregateErrorRate([null, undefined, Number.NaN])).toEqual({
      total: 0,
      errorCount: 0,
      okCount: 0,
      errorRatePct: 0,
    });
  });

  it('counts 4xx+5xx over total', () => {
    const s = aggregateErrorRate([200, 201, 400, 500, 429, 301]);
    expect(s.total).toBe(6);
    expect(s.errorCount).toBe(3);
    expect(s.okCount).toBe(3);
    expect(s.errorRatePct).toBe(50);
  });
});

describe('aggregateEndpointErrorRates', () => {
  it('aggregates and sorts by errorCount then rate', () => {
    const rows = aggregateEndpointErrorRates([
      { endpoint: '/a', statusCode: 200 },
      { endpoint: '/a', statusCode: 500 },
      { endpoint: '/a', statusCode: 400 },
      { endpoint: '/b', statusCode: 404 },
      { endpoint: '/b', statusCode: 200 },
      { endpoint: '/c', statusCode: 200 },
      { endpoint: '/a', statusCode: null },
    ]);
    expect(rows[0]?.endpoint).toBe('/a');
    expect(rows[0]?.total).toBe(3);
    expect(rows[0]?.errorCount).toBe(2);
    expect(rows[0]?.errorRatePct).toBeCloseTo(66.67, 1);
    expect(rows[1]?.endpoint).toBe('/b');
    expect(rows[1]?.errorCount).toBe(1);
    expect(rows[2]?.endpoint).toBe('/c');
    expect(rows[2]?.errorCount).toBe(0);
  });
});

describe('topFailingEndpoints', () => {
  it('returns only endpoints with errors, capped by limit', () => {
    const all = aggregateEndpointErrorRates([
      { endpoint: '/fail', statusCode: 500 },
      { endpoint: '/fail', statusCode: 500 },
      { endpoint: '/ok', statusCode: 200 },
      { endpoint: '/warn', statusCode: 429 },
    ]);
    const top = topFailingEndpoints(all, 1);
    expect(top).toHaveLength(1);
    expect(top[0]?.endpoint).toBe('/fail');
    expect(topFailingEndpoints(all, 5).map((r) => r.endpoint)).toEqual([
      '/fail',
      '/warn',
    ]);
  });
});

describe('formatErrorRatePct', () => {
  it('formats null and values', () => {
    expect(formatErrorRatePct(null)).toBe('—');
    expect(formatErrorRatePct(undefined)).toBe('—');
    expect(formatErrorRatePct(0)).toBe('%0.0');
    expect(formatErrorRatePct(12.34)).toBe('%12.3');
  });
});
