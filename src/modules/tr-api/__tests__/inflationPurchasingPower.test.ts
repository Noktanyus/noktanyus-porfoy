import { describe, it, expect } from 'vitest';
import {
  calculateInflationPurchasingPower,
  findCpiIndex,
  TUIK_HISTORICAL_CPI_TABLE,
} from '../inflationPurchasingPower';

describe('TÜİK TÜFE Enflasyon & Alım Gücü Motoru', () => {
  it('Veri tabanı geçerli TÜİK verilerini içermelidir', () => {
    expect(TUIK_HISTORICAL_CPI_TABLE.length).toBeGreaterThan(30);
    const y2003 = TUIK_HISTORICAL_CPI_TABLE.find((e) => e.year === 2003 && e.month === 1);
    expect(y2003?.cpiIndex).toBe(94.77);
    const y2024dec = TUIK_HISTORICAL_CPI_TABLE.find((e) => e.year === 2024 && e.month === 12);
    expect(y2024dec?.cpiIndex).toBe(2684.55);
  });

  it('Aynı dönem seçildiğinde enflasyon 0 ve değer eşit olmalıdır', () => {
    const res = calculateInflationPurchasingPower({
      initialAmount: 10000,
      startYear: 2024,
      startMonth: 12,
      targetYear: 2024,
      targetMonth: 12,
    });

    expect(res.adjustedAmount).toBe(10000);
    expect(res.cumulativeInflationRatePercent).toBe(0);
    expect(res.multiplier).toBe(1);
    expect(res.purchasingPowerLossPercent).toBe(0);
    expect(res.realValueOfOneLira).toBe(1);
  });

  it('2015 yılı sonundan 2024 yılı sonuna doğru değer artışı ve alım gücü erimesini hesaplamalıdır', () => {
    // 2015 Aralık: 269.54, 2024 Aralık: 2684.55
    const res = calculateInflationPurchasingPower({
      initialAmount: 100000,
      startYear: 2015,
      startMonth: 12,
      targetYear: 2024,
      targetMonth: 12,
    });

    // 2684.55 / 269.54 = ~9.9597 kat
    expect(res.multiplier).toBeCloseTo(9.96, 1);
    expect(res.adjustedAmount).toBeGreaterThan(990000);
    expect(res.cumulativeInflationRatePercent).toBeGreaterThan(850);
    expect(res.purchasingPowerLossPercent).toBeGreaterThan(89);
    expect(res.realValueOfOneLira).toBeLessThan(0.15);
    expect(res.annualCompoundRatePercent).toBeGreaterThan(25);
    expect(res.yearlyProgression.length).toBe(10); // 2015 to 2024 inclusive
  });

  it('Özel endeks değerleri verildiğinde formülü doğru uygulamalıdır', () => {
    const res = calculateInflationPurchasingPower({
      initialAmount: 50000,
      startYear: 2020,
      targetYear: 2025,
      customStartIndex: 500,
      customTargetIndex: 2000,
    });

    // 4 katına çıkmalı
    expect(res.multiplier).toBe(4);
    expect(res.adjustedAmount).toBe(200000);
    expect(res.cumulativeInflationRatePercent).toBe(300);
    expect(res.purchasingPowerLossPercent).toBe(75);
    expect(res.realValueOfOneLira).toBe(0.25);
  });

  it('findCpiIndex fonksiyonu ay veya yıl sonu bazında doğru endeksi getirmelidir', () => {
    const jan2024 = findCpiIndex(2024, 1);
    expect(jan2024.index).toBe(1984.02);
    expect(jan2024.label).toBe('Ocak 2024');

    const yearDec = findCpiIndex(2022);
    expect(yearDec.index).toBe(1128.45);
  });
});
