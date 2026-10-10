import { describe, it, expect } from 'vitest';
import {
  calculateProgressiveTax,
  calculateYoungEntrepreneurBenefit,
  TAX_BRACKETS_2024,
  OFFICIAL_EXEMPTIONS,
} from '../youngEntrepreneur';

describe('Turkish Young Entrepreneur Tax Incentive Engine', () => {
  it('should correctly calculate progressive income tax for 2024', () => {
    // 100.000 TL -> %15 = 15.000 TL
    expect(calculateProgressiveTax(100_000, TAX_BRACKETS_2024)).toBe(15_000);

    // 200.000 TL:
    // İlk 110.000 TL @ 15% = 16.500 TL
    // Kalan 90.000 TL @ 20% = 18.000 TL
    // Toplam = 34.500 TL
    expect(calculateProgressiveTax(200_000, TAX_BRACKETS_2024)).toBe(34_500);
  });

  it('should grant 100% tax exemption when annual profit is within exemption ceiling', () => {
    // 2024 tavanı 230.000 TL, girişimcinin kârı 200.000 TL
    const res = calculateYoungEntrepreneurBenefit({
      annualRevenue: 300_000,
      annualExpenses: 100_000,
      year: 2024,
      includeBagkurSupport: true,
    });

    expect(res.annualGrossProfit).toBe(200_000);
    expect(res.appliedExemptionAmount).toBe(200_000);
    expect(res.taxableIncomeWithIncentive).toBe(0);
    expect(res.incentivizedIncomeTax).toBe(0); // 0 TL vergi!
    expect(res.standardIncomeTax).toBe(34_500);
    expect(res.taxSavings).toBe(34_500);
    expect(res.bagkurSavings).toBeGreaterThan(80_000); // 12 * 6900.86 = 82.810,32
    expect(res.totalAnnualBenefit).toBe(34_500 + res.bagkurSavings);
    expect(res.effectiveTaxRateWithIncentive).toBe(0);
    expect(res.evaluation.title).toContain('Sıfır Gelir Vergisi');
  });

  it('should correctly tax only the amount exceeding exemption limit when profit is higher', () => {
    // 500.000 TL kâr, 2024 yılı istisnası 230.000 TL
    // Kalan matrah = 270.000 TL
    const res = calculateYoungEntrepreneurBenefit({
      annualRevenue: 700_000,
      annualExpenses: 200_000,
      year: 2024,
      includeBagkurSupport: false, // 2. yıl senaryosu (Bağkursuz)
    });

    expect(res.annualGrossProfit).toBe(500_000);
    expect(res.appliedExemptionAmount).toBe(230_000);
    expect(res.taxableIncomeWithIncentive).toBe(270_000);

    // Teşviksiz vergi (500.000 TL):
    // 110.000 * 0.15 = 16.500
    // 120.000 * 0.20 = 24.000
    // 270.000 * 0.27 = 72.900
    // Toplam = 113.400 TL
    expect(res.standardIncomeTax).toBe(113_400);

    // Teşvikli vergi (270.000 TL):
    // 110.000 * 0.15 = 16.500
    // 120.000 * 0.20 = 24.000
    // 40.000 * 0.27 = 10.800
    // Toplam = 51.300 TL
    expect(res.incentivizedIncomeTax).toBe(51_300);

    // Vergi Tasarrufu = 113.400 - 51.300 = 62.100 TL
    expect(res.taxSavings).toBe(62_100);
    expect(res.bagkurSavings).toBe(0);
    expect(res.totalAnnualBenefit).toBe(62_100);
    expect(res.effectiveTaxRateWithIncentive).toBeLessThan(res.effectiveTaxRateStandard);
  });

  it('should handle zero profit or expenses exceeding revenue', () => {
    const res = calculateYoungEntrepreneurBenefit({
      annualRevenue: 50_000,
      annualExpenses: 80_000,
      year: 2024,
    });

    expect(res.annualGrossProfit).toBe(0);
    expect(res.incentivizedIncomeTax).toBe(0);
    expect(res.standardIncomeTax).toBe(0);
    expect(res.taxSavings).toBe(0);
  });
});
