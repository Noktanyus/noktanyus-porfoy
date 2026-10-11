import { describe, it, expect } from 'vitest';
import {
  calculateTaxLateInterest,
  getLateFeeRateForDate,
  OFFICIAL_LATE_FEE_RATES,
} from '../taxLateInterest';

describe('6183 Sayılı AATUHK Vergi Gecikme Zammı ve Tecil Faizi Motoru', () => {
  it('Resmi gecikme zammı oranları tarihçesi güncel oranları içermelidir', () => {
    expect(OFFICIAL_LATE_FEE_RATES.length).toBeGreaterThanOrEqual(4);
    const active = getLateFeeRateForDate('2024-06-01');
    expect(active.monthlyRatePercent).toBe(4.50);
  });

  it('Vadesi geçmemiş veya aynı gün olan borç için gecikme zammı 0 olmalıdır', () => {
    const res = calculateTaxLateInterest({
      principalAmount: 10000,
      dueDate: '2024-06-01',
      paymentDate: '2024-06-01',
    });

    expect(res.totalDaysOverdue).toBe(0);
    expect(res.lateFeeAmount).toBe(0);
    expect(res.totalAmountDue).toBe(10000);
  });

  it('1 tam ay geciken borç için tam aylık faiz hesaplamalıdır', () => {
    // 10.000 TL, 1 ay gecikme, %4.50 oran -> 450 TL gecikme zammı
    const res = calculateTaxLateInterest({
      principalAmount: 10000,
      dueDate: '2024-06-01',
      paymentDate: '2024-07-01',
      customMonthlyRatePercent: 4.50,
    });

    expect(res.fullMonths).toBe(1);
    expect(res.fractionDays).toBe(0);
    expect(res.lateFeeAmount).toBe(450);
    expect(res.totalAmountDue).toBe(10450);
  });

  it('Ay kesirlerinde günlük oran (aylık / 30) uygulamalıdır', () => {
    // 10.000 TL, 10 gün gecikme, %4.50 aylık -> günlük %0.15 -> 10 gün = %1.5 -> 150 TL
    const res = calculateTaxLateInterest({
      principalAmount: 10000,
      dueDate: '2024-06-01',
      paymentDate: '2024-06-11',
      customMonthlyRatePercent: 4.50,
    });

    expect(res.fullMonths).toBe(0);
    expect(res.fractionDays).toBe(10);
    expect(res.lateFeeAmount).toBe(150);
    expect(res.totalAmountDue).toBe(10150);
  });

  it('6183 m.48 Tecil ve taksitlendirme planını doğru üretmelidir', () => {
    const res = calculateTaxLateInterest({
      principalAmount: 12000,
      dueDate: '2024-01-01',
      paymentDate: '2024-02-01',
      calculateInstallments: true,
      installmentCount: 12,
    });

    expect(res.installmentPlan).toBeDefined();
    expect(res.installmentPlan?.installmentCount).toBe(12);
    expect(res.installmentPlan?.schedule.length).toBe(12);
    expect(res.installmentPlan?.totalRepayment).toBeGreaterThan(12000);
  });
});
