import { describe, it, expect } from 'vitest';
import { calculateCustomsTax, CUSTOMS_LIMITS } from '../customsTax';

describe('calculateCustomsTax', () => {
  it('correctly calculates 60% tax for non-EU order within 30 EUR limit', () => {
    // 25 EUR, Non-EU (China/Temu), no SCT
    const result = calculateCustomsTax({
      productPrice: 25,
      currency: 'EUR',
      origin: 'NON_EU',
      isSpecialConsumptionTaxApplied: false,
      eurExchangeRate: 38.5,
    });

    expect(result.isExceeding30EurLimit).toBe(false);
    expect(result.status).toBe('SIMPLIFIED_CUSTOMS');
    expect(result.dutyRatePercent).toBe(60);
    expect(result.dutyAmountEur).toBe(15); // 25 * 60% = 15 EUR
    expect(result.dutyAmountTry).toBe(15 * 38.5); // 577.5 TL
    expect(result.sctRatePercent).toBe(0);
    expect(result.totalTaxPayableTry).toBeCloseTo(15 * 38.5 + 40 + 8.5, 1);
  });

  it('correctly warns when exceeding 30 EUR limit', () => {
    // 35 EUR order
    const result = calculateCustomsTax({
      productPrice: 35,
      currency: 'EUR',
      origin: 'NON_EU',
    });

    expect(result.isExceeding30EurLimit).toBe(true);
    expect(result.status).toBe('COMMERCIAL_IMPORT_REQUIRED');
    expect(result.statusMessageTr).toContain('30 Avro bireysel muafiyet sınırını aşmaktadır');
  });

  it('correctly applies 30% duty for EU origin', () => {
    // 20 EUR, EU origin (Germany/France)
    const result = calculateCustomsTax({
      productPrice: 20,
      currency: 'EUR',
      origin: 'EU',
    });

    expect(result.dutyRatePercent).toBe(30);
    expect(result.dutyAmountEur).toBe(6); // 20 * 30% = 6 EUR
  });

  it('correctly applies 20% SCT (ÖTV IV) for electronics/headphones', () => {
    // 20 EUR, Non-EU, with SCT
    const result = calculateCustomsTax({
      productPrice: 20,
      currency: 'EUR',
      origin: 'NON_EU',
      isSpecialConsumptionTaxApplied: true,
      eurExchangeRate: 38.5,
    });

    expect(result.sctRatePercent).toBe(20);
    expect(result.sctAmountEur).toBe(4); // 20 * 20% = 4 EUR
    expect(result.dutyAmountEur).toBe(12); // 20 * 60% = 12 EUR
    expect(result.dutyAmountTry).toBe(12 * 38.5);
    expect(result.sctAmountTry).toBe(4 * 38.5);
  });

  it('correctly converts USD to EUR before checking 30 EUR ceiling', () => {
    // $30 USD at 0.92 = 27.6 EUR <= 30 EUR
    const result = calculateCustomsTax({
      productPrice: 30,
      currency: 'USD',
      origin: 'NON_EU',
      usdToEurRate: 0.92,
    });

    expect(result.productPriceEur).toBe(27.6);
    expect(result.isExceeding30EurLimit).toBe(false);

    // $35 USD at 0.92 = 32.2 EUR > 30 EUR
    const resultOver = calculateCustomsTax({
      productPrice: 35,
      currency: 'USD',
      origin: 'NON_EU',
      usdToEurRate: 0.92,
    });
    expect(resultOver.productPriceEur).toBe(32.2);
    expect(resultOver.isExceeding30EurLimit).toBe(true);
  });
});
