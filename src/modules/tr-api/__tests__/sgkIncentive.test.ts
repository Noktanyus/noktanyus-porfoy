import { describe, it, expect } from 'vitest';
import { calculateSgkIncentive, SGK_OFFICIAL_CONSTANTS } from '../sgkIncentive';

describe('calculateSgkIncentive', () => {
  it('correctly calculates 5-points discount and minimum wage support for single employee at minimum wage', () => {
    // 20,002.50 TL gross salary, 1 employee
    // Standard employer SGK: 20002.5 * 20.5% = 4100.51 TL
    // Discounted employer SGK: 20002.5 * 15.5% = 3100.39 TL
    // 5-points savings: 1000.125 -> 1000.13 TL
    // Min wage support: 700 TL
    // Total monthly savings: 1000.13 + 700 = 1700.13 TL
    const result = calculateSgkIncentive({
      grossSalaryPerEmployee: 20002.5,
      employeeCount: 1,
      apply5PointsDiscount: true,
      applyMinimumWageSupport: true,
    });

    expect(result.employeeCount).toBe(1);
    expect(result.appliedEmployerSgkRatePercent).toBe(15.5);
    expect(result.standardEmployerSgkRatePercent).toBe(20.5);
    expect(result.fivePointsSavingsPerMonth).toBeCloseTo(1000.13, 1);
    expect(result.minimumWageSupportTotal).toBe(700);
    expect(result.monthlyNetSavingsTotal).toBeCloseTo(1700.13, 1);
    expect(result.annualNetSavingsTotal).toBeCloseTo(1700.13 * 12, 0);
  });

  it('correctly scales for a company with 10 employees', () => {
    const result = calculateSgkIncentive({
      grossSalaryPerEmployee: 35000,
      employeeCount: 10,
      apply5PointsDiscount: true,
      applyMinimumWageSupport: true,
    });

    expect(result.totalGrossPayroll).toBe(350000);
    // 5 points on 350,000 = 17,500 TL
    expect(result.fivePointsSavingsPerMonth).toBe(17500);
    // 700 * 10 = 7,000 TL
    expect(result.minimumWageSupportTotal).toBe(7000);
    // Total monthly savings = 24,500 TL
    expect(result.monthlyNetSavingsTotal).toBe(24500);
    // Annual savings = 294,000 TL
    expect(result.annualNetSavingsTotal).toBe(294000);
  });

  it('caps SGK base at SGK ceiling (150,018.75 TL) for high salaries', () => {
    const result = calculateSgkIncentive({
      grossSalaryPerEmployee: 200000, // exceeds 150,018.75
      employeeCount: 1,
    });

    expect(result.grossSalaryPerEmployee).toBe(200000);
    expect(result.sgkBaseAmountPerEmployee).toBe(SGK_OFFICIAL_CONSTANTS.MAX_SGK_CEILING_2024);
    // 5% of ceiling = 150018.75 * 5% = 7500.94 TL
    expect(result.fivePointsSavingsPerMonth).toBeCloseTo(7500.94, 1);
  });

  it('correctly returns zero savings if discounts are disabled (e.g. debt or delay)', () => {
    const result = calculateSgkIncentive({
      grossSalaryPerEmployee: 20002.5,
      employeeCount: 1,
      apply5PointsDiscount: false,
      applyMinimumWageSupport: false,
    });

    expect(result.appliedEmployerSgkRatePercent).toBe(20.5);
    expect(result.fivePointsSavingsPerMonth).toBe(0);
    expect(result.minimumWageSupportTotal).toBe(0);
    expect(result.monthlyNetSavingsTotal).toBe(0);
    expect(result.incentivizedTotalEmployerCost).toBe(result.standardTotalEmployerCost);
  });

  it('includes mandatory legal conditions and risk warning', () => {
    const result = calculateSgkIncentive({
      grossSalaryPerEmployee: 20002.5,
    });

    expect(result.legalWarning.requirements.length).toBeGreaterThan(2);
    expect(result.legalWarning.riskIfDelayed).toContain('gecikirse');
  });
});
