import { describe, expect, it } from 'vitest';
import {
  computeBillingProjection,
  creditUnitPriceCents,
} from '@/lib/billingProjection';

describe('billingProjection', () => {
  it('exposes positive unit price from credit packs', () => {
    expect(creditUnitPriceCents()).toBeGreaterThan(0);
  });

  it('adds overage on top of plan for subscription', () => {
    const p = computeBillingProjection({
      monthToDate: 800,
      projectedMonthEnd: 1200,
      quotaLimit: 1000,
      billingSource: 'subscription',
      planPriceCents: 29900,
      creditBalance: 0,
    });
    expect(p.projectedOverageRequests).toBe(200);
    expect(p.projectedBillCents).toBeGreaterThan(29900);
  });

  it('estimates credit spend when on credits', () => {
    const p = computeBillingProjection({
      monthToDate: 50,
      projectedMonthEnd: 200,
      quotaLimit: 0,
      billingSource: 'credits',
      planPriceCents: 0,
      creditBalance: 100,
    });
    expect(p.projectedOverageRequests).toBe(100);
    expect(p.projectedBillCents).toBeGreaterThan(0);
  });
});
