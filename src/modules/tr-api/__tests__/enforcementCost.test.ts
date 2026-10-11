import { describe, it, expect } from 'vitest';
import {
  calculateEnforcementCost,
  OFFICIAL_ENFORCEMENT_FEES_2024,
} from '../enforcementCost';

describe('Türkiye İcra Takibi Açılış Harç ve Masraf Motoru', () => {
  it('Harç tarifesi geçerli resmi değerleri içermelidir', () => {
    expect(OFFICIAL_ENFORCEMENT_FEES_2024.applicationFee).toBe(427.60);
    expect(OFFICIAL_ENFORCEMENT_FEES_2024.advanceFeeRatePercent).toBe(0.50);
    expect(OFFICIAL_ENFORCEMENT_FEES_2024.barAssociationStampFee).toBe(96.00);
  });

  it('100.000 TL ilamsız icra takibinde peşin harç (binde 5 = 500 TL) ve masrafları hesaplamalıdır', () => {
    const res = calculateEnforcementCost({
      claimAmount: 100000,
      enforcementType: 'without_judgment',
      hasAttorney: true,
      debtorCount: 1,
      noticeType: 'postal',
    });

    // Peşin harç: 100.000 * 0.005 = 500 TL
    expect(res.advanceFee).toBe(500);
    expect(res.applicationFee).toBe(427.60);
    expect(res.powerOfAttorneyFee).toBe(60.80);
    expect(res.barStampFee).toBe(96.00);
    expect(res.noticeTotalFee).toBe(200.00); // 1 borçlu PTT
    expect(res.fileExpense).toBe(35.00);

    const total = 500 + 427.60 + 60.80 + 96.00 + 200.00 + 35.00; // 1319.40 TL
    expect(res.totalOpeningCost).toBe(1319.40);
    expect(res.totalClaimWithCost).toBe(101319.40);
  });

  it('İlamlı takiplerde peşin harç 0 TL (muaf) olmalıdır', () => {
    const res = calculateEnforcementCost({
      claimAmount: 100000,
      enforcementType: 'with_judgment',
      hasAttorney: true,
      debtorCount: 1,
    });

    expect(res.advanceFee).toBe(0);
    expect(res.totalOpeningCost).toBeLessThan(1000);
  });

  it('Avukatsız takipte vekalet harcı ve baro pulu 0 olmalıdır', () => {
    const res = calculateEnforcementCost({
      claimAmount: 50000,
      hasAttorney: false,
    });

    expect(res.powerOfAttorneyFee).toBe(0);
    expect(res.barStampFee).toBe(0);
  });

  it('Çoklu borçlu (örn: 3 borçlu) için tebligat masrafını çarpmalıdır', () => {
    const res = calculateEnforcementCost({
      claimAmount: 50000,
      debtorCount: 3,
      noticeType: 'postal',
    });

    expect(res.debtorCount).toBe(3);
    // 3 x 200 = 600 TL
    expect(res.noticeTotalFee).toBe(600);
  });
});
