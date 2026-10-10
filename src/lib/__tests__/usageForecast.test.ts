import { describe, expect, it } from 'vitest';
import { computeUsageForecast } from '@/lib/usageForecast';

describe('computeUsageForecast', () => {
  it('projects month-end from MTD pace', () => {
    const f = computeUsageForecast({
      monthToDate: 300,
      dayOfMonth: 10,
      daysInMonth: 30,
      quotaLimit: 1000,
      creditBalance: 0,
      windowRequests: 0,
      windowHours: 24,
      billingSource: 'subscription',
    });
    // 300/10 = 30/day * 20 remaining = 600 → projected 900
    expect(f.projectedMonthEnd).toBe(900);
    expect(f.quotaUsedPct).toBe(30);
    expect(f.alertLevel).toBe('ok');
  });

  it('warns when projected to exceed quota', () => {
    const f = computeUsageForecast({
      monthToDate: 400,
      dayOfMonth: 10,
      daysInMonth: 30,
      quotaLimit: 1000,
      creditBalance: 50,
      windowRequests: 100,
      windowHours: 24,
      billingSource: 'subscription',
    });
    expect(f.projectedMonthEnd).toBeGreaterThan(1000);
    expect(f.alertLevel).toBe('warn');
    expect(f.alertMessage).toBeTruthy();
  });

  it('marks exhausted when quota full', () => {
    const f = computeUsageForecast({
      monthToDate: 1000,
      dayOfMonth: 15,
      daysInMonth: 30,
      quotaLimit: 1000,
      creditBalance: 0,
      windowRequests: 10,
      windowHours: 24,
      billingSource: 'subscription',
    });
    expect(f.alertLevel).toBe('exhausted');
  });

  it('estimates credit runway', () => {
    const f = computeUsageForecast({
      monthToDate: 50,
      dayOfMonth: 5,
      daysInMonth: 30,
      quotaLimit: 0,
      creditBalance: 100,
      windowRequests: 50,
      windowHours: 24,
      billingSource: 'credits',
    });
    expect(f.creditDaysRemaining).toBeGreaterThan(0);
    expect(f.creditDaysRemaining).toBeLessThan(7);
    expect(f.alertLevel).toBe('warn');
  });
});
