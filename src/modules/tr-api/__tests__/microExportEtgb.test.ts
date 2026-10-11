import { describe, it, expect } from 'vitest';
import { evaluateMicroExport, ETGB_LIMITS, AUTHORIZED_ETGB_CARRIERS } from '../microExportEtgb';

describe('evaluateMicroExport', () => {
  it('correctly qualifies an order within weight and EUR value limits', () => {
    const result = evaluateMicroExport({
      weightKg: 25,
      invoiceAmount: 1200,
      currency: 'EUR',
      costOfGoodsSold: 700,
      costVatRate: 20,
    });

    expect(result.isEligible).toBe(true);
    expect(result.status).toBe('MICRO_EXPORT_ETGB');
    expect(result.isWeightValid).toBe(true);
    expect(result.isAmountValid).toBe(true);
    expect(result.amountInEur).toBe(1200);
    expect(result.vatExemptionCode).toBe('301');
    expect(result.potentialVatRefund.eligible).toBe(true);
    expect(result.potentialVatRefund.estimatedRefundAmount).toBe(140); // 700 * 20%
    expect(result.ublExportSnippet).toContain('301');
    expect(result.ublExportSnippet).toContain('IHRACAT');
  });

  it('correctly rejects an order exceeding 300 kg ceiling', () => {
    const result = evaluateMicroExport({
      weightKg: 350,
      invoiceAmount: 4000,
      currency: 'EUR',
    });

    expect(result.isEligible).toBe(false);
    expect(result.status).toBe('STANDARD_CUSTOMS_REQUIRED');
    expect(result.isWeightValid).toBe(false);
    expect(result.isAmountValid).toBe(true);
    expect(result.statusMessageTr).toContain('300 kg sınırını aşmaktadır');
  });

  it('correctly rejects an order exceeding 15.000 EUR value ceiling in USD', () => {
    const result = evaluateMicroExport({
      weightKg: 40,
      invoiceAmount: 20000,
      currency: 'USD',
      usdToEurRate: 0.92, // 20000 * 0.92 = 18400 EUR > 15000 EUR
    });

    expect(result.isEligible).toBe(false);
    expect(result.status).toBe('STANDARD_CUSTOMS_REQUIRED');
    expect(result.isWeightValid).toBe(true);
    expect(result.isAmountValid).toBe(false);
    expect(result.amountInEur).toBe(18400);
  });

  it('correctly calculates GVK m.89/16 50% export profit exemption', () => {
    const result = evaluateMicroExport({
      weightKg: 10,
      invoiceAmount: 5000,
      currency: 'EUR',
      estimatedProfitMarginPercent: 30, // 5000 * 30% = 1500 profit
      qualifiesForGvk89Exemption: true,
    });

    expect(result.incomeTaxIncentiveGvk89.applied).toBe(true);
    expect(result.incomeTaxIncentiveGvk89.estimatedProfit).toBe(1500);
    expect(result.incomeTaxIncentiveGvk89.exemptProfitAmount).toBe(750); // 50% of 1500
    expect(result.incomeTaxIncentiveGvk89.taxableProfitAmount).toBe(750);
  });

  it('has list of authorized fast cargo carriers', () => {
    expect(AUTHORIZED_ETGB_CARRIERS.length).toBeGreaterThan(4);
    const dhl = AUTHORIZED_ETGB_CARRIERS.find((c) => c.code === 'DHL');
    expect(dhl).toBeDefined();
    expect(dhl?.supportsEtgb).toBe(true);
  });
});
