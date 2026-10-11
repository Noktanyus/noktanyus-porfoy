import { describe, it, expect } from 'vitest';
import { calculateSalaryGarnishment } from '../salaryGarnishment';

describe('Turkish Salary Garnishment & Enforcement Queue Engine (İİK m.83)', () => {
  it('should correctly calculate standard 1/4 garnishment on net salary without alimony', () => {
    // 40.000 TL net maaş
    const res = calculateSalaryGarnishment({
      monthlyNetSalary: 40_000,
    });

    expect(res.monthlyNetSalary).toBe(40_000);
    expect(res.alimonyDeduction).toBe(0);
    expect(res.attachableBaseSalary).toBe(40_000);
    // 1/4 = 10.000 TL
    expect(res.salaryGarnishmentAmount).toBe(10_000);
    expect(res.appliedSalaryGarnishmentRatePercent).toBe(25);
    expect(res.totalMonthlyDeduction).toBe(10_000);
    expect(res.employeeRemainingNetTakeHome).toBe(30_000);
  });

  it('should prioritize current alimony and apply 1/4 only to remaining net salary', () => {
    // 35.000 TL net maaş, 5.000 TL cari nafaka
    const res = calculateSalaryGarnishment({
      monthlyNetSalary: 35_000,
      monthlyAlimonyAmount: 5_000,
    });

    expect(res.alimonyDeduction).toBe(5_000);
    // Kalan haczedilebilir matrah = 35.000 - 5.000 = 30.000 TL
    expect(res.attachableBaseSalary).toBe(30_000);
    // 30.000 TL'nin 1/4'ü = 7.500 TL
    expect(res.salaryGarnishmentAmount).toBe(7_500);
    // Toplam kesinti = 5.000 (nafaka) + 7.500 (icra) = 12.500 TL
    expect(res.totalMonthlyDeduction).toBe(12_500);
    // Çalışana kalan = 35.000 - 12.500 = 22.500 TL
    expect(res.employeeRemainingNetTakeHome).toBe(22_500);
  });

  it('should support custom garnishment consent rate and bonus deduction', () => {
    // Borçlu kendi rızasıyla %50 kesinti kabul etmiş + 10.000 TL prim var
    const res = calculateSalaryGarnishment({
      monthlyNetSalary: 20_000,
      customGarnishmentPercent: 50,
      additionalBonusNet: 10_000,
      bonusGarnishmentPercent: 25,
    });

    // 20.000 * 0.50 = 10.000 TL maaştan
    expect(res.salaryGarnishmentAmount).toBe(10_000);
    // 10.000 * 0.25 = 2.500 TL primden
    expect(res.bonusGarnishmentAmount).toBe(2_500);
    expect(res.totalMonthlyDeduction).toBe(12_500);
    // Kalan = (20.000 + 10.000) - 12.500 = 17.500 TL
    expect(res.employeeRemainingNetTakeHome).toBe(17_500);
  });

  it('should accurately simulate multiple files in queue projection', () => {
    // 20.000 TL maaş -> aylık 5.000 TL icra kesintisi
    // Dosya 1: 12.000 TL (3 ayda biter: 5.000 + 5.000 + 2.000)
    // Dosya 2: 15.000 TL (Dosya 1 bitince başlar)
    const res = calculateSalaryGarnishment({
      monthlyNetSalary: 20_000,
      files: [
        { fileId: 'Ankara 1. İcra 2024/100', remainingDebt: 12_000 },
        { fileId: 'İstanbul 4. İcra 2024/200', remainingDebt: 15_000 },
      ],
    });

    expect(res.queueProjection).toBeDefined();
    expect(res.queueProjection?.totalDebtAllFiles).toBe(27_000);
    // 27.000 / 5.000 = 6 ay (5.4 ay ceil)
    expect(res.queueProjection?.estimatedMonthsToClearAll).toBe(6);

    const plan = res.queueProjection?.first12MonthsPlan || [];
    expect(plan.length).toBeGreaterThanOrEqual(6);

    // Ay 1: Dosya 1, 5.000 TL kesilir, kalan 7.000 TL
    expect(plan[0].activeFileId).toBe('Ankara 1. İcra 2024/100');
    expect(plan[0].monthlyDeduction).toBe(5_000);
    expect(plan[0].remainingDebtAfter).toBe(7_000);
    expect(plan[0].fileCompleted).toBe(false);

    // Ay 3: Dosya 1 biter (kalan 2.000 TL kesilir)
    expect(plan[2].activeFileId).toBe('Ankara 1. İcra 2024/100');
    expect(plan[2].monthlyDeduction).toBe(2_000);
    expect(plan[2].remainingDebtAfter).toBe(0);
    expect(plan[2].fileCompleted).toBe(true);

    // Ay 4: Dosya 2 başlar
    expect(plan[3].activeFileId).toBe('İstanbul 4. İcra 2024/200');
  });
});
