import { describe, it, expect } from 'vitest';
import {
  calculateRentIncrease,
  getTufeRateForPeriod,
  OFFICIAL_TUFE_RATES,
} from '../rentIncrease';

describe('Turkish Rent Increase & CPI Cap Engine (TBK m.344)', () => {
  it('should find official TUFE 12-month average rates', () => {
    const ekim2024 = getTufeRateForPeriod(2024, 10);
    expect(ekim2024).toBeDefined();
    expect(ekim2024?.twelveMonthAverageRate).toBe(62.02);
  });

  it('should correctly calculate residential rent increase with official rate', () => {
    // 20.000 TL mevcut kira, Ekim 2024 yenileme (%62.02)
    const res = calculateRentIncrease({
      currentRent: 20_000,
      propertyType: 'residential',
      year: 2024,
      month: 10,
    });

    expect(res.currentRent).toBe(20_000);
    expect(res.appliedRatePercent).toBe(62.02);
    // Artış = 20.000 * 0.6202 = 12.404 TL
    expect(res.increaseAmount).toBe(12_404);
    expect(res.newRent).toBe(32_404);
    expect(res.annualComparison.previousAnnualTotal).toBe(240_000);
    expect(res.annualComparison.newAnnualTotal).toBe(388_848);
    expect(res.commercialTaxBreakdown).toBeUndefined();
  });

  it('should calculate commercial rent with 20% stopaj breakdown', () => {
    // 10.000 TL kira, %50 artış oranı
    const res = calculateRentIncrease({
      currentRent: 10_000,
      propertyType: 'commercial',
      customTufeRate: 50,
      commercialTaxMode: 'stopaj',
    });

    expect(res.newRent).toBe(15_000); // Net yeni kira
    expect(res.commercialTaxBreakdown).toBeDefined();
    expect(res.commercialTaxBreakdown?.mode).toBe('stopaj');
    // Brüt = 15.000 / 0.8 = 18.750 TL
    expect(res.commercialTaxBreakdown?.grossTotal).toBe(18_750);
    // Stopaj = 18.750 - 15.000 = 3.750 TL
    expect(res.commercialTaxBreakdown?.taxAmount).toBe(3_750);
  });

  it('should calculate commercial rent with 20% VAT breakdown', () => {
    const res = calculateRentIncrease({
      currentRent: 10_000,
      propertyType: 'commercial',
      customTufeRate: 50,
      commercialTaxMode: 'vat',
    });

    expect(res.newRent).toBe(15_000);
    expect(res.commercialTaxBreakdown?.mode).toBe('vat');
    // KDV = 15.000 * 0.20 = 3.000 TL
    expect(res.commercialTaxBreakdown?.taxAmount).toBe(3_000);
    expect(res.commercialTaxBreakdown?.grossTotal).toBe(18_000);
  });
});
