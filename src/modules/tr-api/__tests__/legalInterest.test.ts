import { describe, it, expect } from 'vitest';
import {
  calculateLegalInterest,
  LEGAL_INTEREST_RATES,
  COMMERCIAL_DEFAULT_RATES,
} from '../legalInterest';

describe('TCMB & Yasal Faiz Hesaplama Motoru', () => {
  it('Mevzuat tabloları geçerli ve sıralı olmalı', () => {
    expect(LEGAL_INTEREST_RATES.length).toBeGreaterThanOrEqual(4);
    expect(COMMERCIAL_DEFAULT_RATES.length).toBeGreaterThanOrEqual(5);
    expect(LEGAL_INTEREST_RATES[0].rate).toBe(24.0);
    expect(COMMERCIAL_DEFAULT_RATES[0].rate).toBe(48.0);
  });

  it('2024 yılı Ticari Temerrüt faizi (%48) doğru hesaplanmalı', () => {
    // 100.000 TL anapara, 2024-01-01 ile 2024-12-31 (365 gün)
    // Faiz = 100.000 * 48 * 365 / 36500 = 48.000 TL
    const result = calculateLegalInterest({
      principal: 100000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      interestType: 'commercial_default',
    });

    expect(result.principal).toBe(100000);
    expect(result.totalDays).toBe(365);
    expect(result.totalInterest).toBe(48000);
    expect(result.totalPayable).toBe(148000);
    expect(result.periods.length).toBe(1);
    expect(result.periods[0].annualRate).toBe(48);
  });

  it('2024 yılı Yasal Faiz kademe değişimi (%9 -> %24) dilimlere bölünmeli', () => {
    // 2024-01-01 ile 2024-12-31 arası
    // 01.01.2024 - 31.05.2024 arası %9 faiz
    // 01.06.2024 - 31.12.2024 arası %24 faiz
    const result = calculateLegalInterest({
      principal: 100000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      interestType: 'legal',
    });

    expect(result.periods.length).toBe(2);
    expect(result.periods[0].annualRate).toBe(9);
    expect(result.periods[1].annualRate).toBe(24);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalPayable).toBe(result.principal + result.totalInterest);
  });

  it('Özel faiz oranı doğru hesaplanmalı', () => {
    // 50.000 TL anapara, 73 gün, %20 oran
    // Faiz = 50.000 * 20 * 73 / 36500 = 2.000 TL
    const result = calculateLegalInterest({
      principal: 50000,
      startDate: '2024-01-01',
      endDate: '2024-03-14', // 73 gün
      interestType: 'custom',
      customRate: 20,
    });

    expect(result.totalDays).toBe(73);
    expect(result.totalInterest).toBe(2000);
    expect(result.totalPayable).toBe(52000);
  });

  it('0 gün veya 0 anapara durumunda faiz 0 dönmeli', () => {
    const result = calculateLegalInterest({
      principal: 10000,
      startDate: '2024-01-01',
      endDate: '2024-01-01',
    });

    expect(result.totalDays).toBe(0);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPayable).toBe(10000);
  });
});
