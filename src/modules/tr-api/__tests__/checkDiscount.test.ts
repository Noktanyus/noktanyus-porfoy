import { describe, it, expect } from 'vitest';
import { calculateCheckDiscount, TCMB_REESKONT_RATES } from '../checkDiscount';

describe('calculateCheckDiscount', () => {
  it('correctly calculates internal discount (iç iskonto) according to VUK 238', () => {
    // Formula: F = (A * n * t) / (36000 + n * t)
    // A = 100,000 TL, n = 90 days, t = 48.75%
    // Denominator = 36000 + (90 * 48.75) = 36000 + 4387.5 = 40387.5
    // Numerator = 100,000 * 90 * 48.75 = 438,750,000
    // F = 438750000 / 40387.5 = 10,863.51 TL
    const result = calculateCheckDiscount({
      valuationDate: '2024-01-01',
      rateOption: 'discount',
      method: 'internal',
      items: [
        {
          description: 'Müşteri Çeki 1',
          nominalAmount: 100000,
          dueDate: '2024-03-31', // 90 days
          itemType: 'receivable',
        },
      ],
    });

    expect(result.appliedAnnualRate).toBe(48.75);
    expect(result.method).toBe('internal');
    expect(result.totalNominalAmount).toBe(100000);
    expect(result.items[0].daysToMaturity).toBe(90);
    expect(result.totalDiscountAmount).toBeCloseTo(10863.51, 1);
    expect(result.totalNetPresentValue).toBeCloseTo(89136.49, 1);

    // Accounting entries should debit 652 and credit 122
    expect(result.accountingEntries.length).toBe(2);
    const debit652 = result.accountingEntries.find((e) => e.accountCode === '652');
    const credit122 = result.accountingEntries.find((e) => e.accountCode === '122');
    expect(debit652?.debit).toBeCloseTo(10863.51, 1);
    expect(credit122?.credit).toBeCloseTo(10863.51, 1);
  });

  it('correctly calculates external discount (dış iskonto)', () => {
    // External formula: F = (A * n * t) / 36000
    // A = 100,000 TL, n = 90 days, t = 48.75%
    // F = (100000 * 90 * 48.75) / 36000 = 12,187.50 TL
    const result = calculateCheckDiscount({
      valuationDate: '2024-01-01',
      rateOption: 'discount',
      method: 'external',
      items: [
        {
          description: 'Ticari Senet',
          nominalAmount: 100000,
          dueDate: '2024-03-31', // 90 days
          itemType: 'receivable',
        },
      ],
    });

    expect(result.method).toBe('external');
    expect(result.totalDiscountAmount).toBe(12187.5);
    expect(result.totalNetPresentValue).toBe(87812.5);
  });

  it('correctly calculates weighted average days for a multiple-check portfolio', () => {
    // Check 1: 100,000 TL, 30 days
    // Check 2: 200,000 TL, 60 days
    // Weighted avg days = (100000*30 + 200000*60) / 300000 = (3000000 + 12000000) / 300000 = 15000000 / 300000 = 50 days
    const result = calculateCheckDiscount({
      valuationDate: '2024-01-01',
      items: [
        { nominalAmount: 100000, dueDate: '2024-01-31' }, // 30 days
        { nominalAmount: 200000, dueDate: '2024-03-01' }, // 60 days
      ],
    });

    expect(result.totalNominalAmount).toBe(300000);
    expect(result.weightedAverageDays).toBe(50);
  });

  it('correctly handles payable note (borç senedi) accounting entries', () => {
    const result = calculateCheckDiscount({
      valuationDate: '2024-01-01',
      items: [
        {
          description: 'Satıcıya Verilen Senet',
          nominalAmount: 50000,
          dueDate: '2024-02-01',
          itemType: 'payable',
        },
      ],
    });

    const debit322 = result.accountingEntries.find((e) => e.accountCode === '322');
    const credit642 = result.accountingEntries.find((e) => e.accountCode === '642');
    expect(debit322).toBeDefined();
    expect(credit642).toBeDefined();
    expect(debit322?.debit).toBe(result.totalDiscountAmount);
    expect(credit642?.credit).toBe(result.totalDiscountAmount);
  });

  it('contains valid TCMB presets', () => {
    expect(TCMB_REESKONT_RATES.length).toBeGreaterThanOrEqual(3);
    const current = TCMB_REESKONT_RATES[0];
    expect(current.discountRate).toBe(48.75);
    expect(current.advanceRate).toBe(49.75);
  });
});
