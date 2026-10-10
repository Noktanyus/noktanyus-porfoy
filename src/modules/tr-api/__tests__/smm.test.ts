import { describe, it, expect } from 'vitest';
import { calculateSmm } from '../smm';

describe('Serbest Meslek Makbuzu (SMM) Engine', () => {
  it('calculates gross to net accurately without withholding', () => {
    const result = calculateSmm({
      amount: 10000,
      mode: 'gross',
      stopajRate: 20,
      vatRate: 20,
      withholding: 'none',
    });

    expect(result.grossAmount).toBe(10000);
    expect(result.stopajAmount).toBe(2000);
    expect(result.netFee).toBe(8000);
    expect(result.vatAmount).toBe(2000);
    expect(result.withheldVatAmount).toBe(0);
    expect(result.collectedVatAmount).toBe(2000);
    expect(result.netReceived).toBe(10000); // 8000 + 2000
    expect(result.clientTotalCost).toBe(12000); // 10000 + 2000
    expect(result.totalTaxToState).toBe(2000); // Stopaj
  });

  it('calculates gross to net with 5/10 KDV withholding', () => {
    const result = calculateSmm({
      amount: 10000,
      mode: 'gross',
      stopajRate: 20,
      vatRate: 20,
      withholding: '5/10',
    });

    expect(result.grossAmount).toBe(10000);
    expect(result.stopajAmount).toBe(2000);
    expect(result.netFee).toBe(8000);
    expect(result.vatAmount).toBe(2000);
    expect(result.withheldVatAmount).toBe(1000); // 2000 * 0.5
    expect(result.collectedVatAmount).toBe(1000); // 2000 - 1000
    expect(result.netReceived).toBe(9000); // 8000 + 1000
    expect(result.clientTotalCost).toBe(12000);
    expect(result.totalTaxToState).toBe(3000); // 2000 stopaj + 1000 tevkifat
  });

  it('calculates net to gross matching expected inverse calculation', () => {
    // 9000 TL ele geçmesini istiyoruz, 5/10 tevkifat ile brüt 10.000 TL çıkmalı
    const result = calculateSmm({
      amount: 9000,
      mode: 'net',
      stopajRate: 20,
      vatRate: 20,
      withholding: '5/10',
    });

    expect(result.grossAmount).toBe(10000);
    expect(result.stopajAmount).toBe(2000);
    expect(result.netFee).toBe(8000);
    expect(result.vatAmount).toBe(2000);
    expect(result.withheldVatAmount).toBe(1000);
    expect(result.collectedVatAmount).toBe(1000);
    expect(result.netReceived).toBe(9000);
  });

  it('supports custom rates (e.g. 10% VAT, 17% stopaj)', () => {
    const result = calculateSmm({
      amount: 50000,
      mode: 'gross',
      stopajRate: 17,
      vatRate: 10,
      withholding: 'none',
    });

    expect(result.grossAmount).toBe(50000);
    expect(result.stopajAmount).toBe(8500); // 50000 * 0.17
    expect(result.netFee).toBe(41500);
    expect(result.vatAmount).toBe(5000); // 50000 * 0.10
    expect(result.netReceived).toBe(46500); // 41500 + 5000
    expect(result.clientTotalCost).toBe(55000);
  });
});
