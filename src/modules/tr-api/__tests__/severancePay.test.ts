import { describe, it, expect } from 'vitest';
import {
  calculateSeverancePay,
  calculateServiceDuration,
  getNoticeWeeks,
  getSeveranceCapForDate,
} from '../severancePay';

describe('4857 Sayılı İş Kanunu Kıdem & İhbar Tazminatı Motoru', () => {
  it('Hizmet süresi hesabını yıl, ay, gün ve gün cinsinden doğru yapmalıdır', () => {
    const dur = calculateServiceDuration('2021-01-01', '2024-01-01');
    expect(dur.years).toBe(3);
    expect(dur.months).toBe(0);
    expect(dur.days).toBe(0);
    expect(dur.totalDays).toBeGreaterThan(1090);
  });

  it('1 yıldan az çalışan için kıdeme hak kazanılmamalıdır', () => {
    const res = calculateSeverancePay({
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      grossSalary: 30000,
    });

    expect(res.severance.eligibleForSeverance).toBe(false);
    expect(res.severance.grossSeverance).toBe(0);
    expect(res.severance.netSeverance).toBe(0);
    expect(res.notice?.noticeWeeks).toBe(2); // 6 aydan az ise 2 hafta (İş Kanunu m.17)
  });

  it('3 yıl çalışan ve tavan altı maaşı olan çalışan için kıdem ve ihbarı doğru hesaplamalıdır', () => {
    const res = calculateSeverancePay({
      startDate: '2021-01-01',
      endDate: '2024-01-01',
      grossSalary: 25000,
      regularBenefitsMonthly: 5000, // Toplam giydirilmiş brüt: 30.000 TL
      customSeveranceCap: 35058.58,
    });

    expect(res.effectiveGrossMonthly).toBe(30000);
    expect(res.severance.isCapped).toBe(false);
    // 3 yıl x 30.000 = 90.000 TL brüt kıdem
    expect(res.severance.grossSeverance).toBe(90000);
    // Damga vergisi: 90.000 * 0.00759 = 683.10 TL
    expect(res.severance.stampTax).toBe(683.1);
    expect(res.severance.netSeverance).toBe(89316.9);

    // 3 yıl ve üzeri için 8 hafta (56 gün) ihbar
    expect(res.notice?.noticeWeeks).toBe(8);
    expect(res.notice?.noticeDays).toBe(56);
  });

  it('Maaşı tavanı aşan çalışan için tavan kuralı uygulanmalıdır', () => {
    const res = calculateSeverancePay({
      startDate: '2022-01-01',
      endDate: '2024-01-01',
      grossSalary: 80000,
      customSeveranceCap: 35058.58,
    });

    expect(res.severance.isCapped).toBe(true);
    expect(res.severance.appliedCap).toBe(35058.58);
    // 2 yıl x 35058.58 = 70117.16 TL
    expect(res.severance.grossSeverance).toBe(70117.16);
  });

  it('Kullanılmamış yıllık izin ücreti dahil edildiğinde SGK ve vergi kesintilerini yapmalıdır', () => {
    const res = calculateSeverancePay({
      startDate: '2022-01-01',
      endDate: '2024-01-01',
      grossSalary: 30000,
      unusedLeaveDays: 14,
    });

    expect(res.unusedLeave).toBeDefined();
    expect(res.unusedLeave?.leaveDays).toBe(14);
    // Brüt izin: (30.000 / 30) * 14 = 14.000 TL
    expect(res.unusedLeave?.grossAmount).toBe(14000);
    expect(res.unusedLeave?.sgkWorkerTax).toBe(1960); // 14000 * 0.14
    expect(res.unusedLeave?.netAmount).toBeGreaterThan(9000);
  });

  it('getSeveranceCapForDate çıkış tarihine göre doğru tavanı getirmelidir', () => {
    const cap2024First = getSeveranceCapForDate('2024-03-15');
    expect(cap2024First).toBe(35058.58);

    const cap2024Second = getSeveranceCapForDate('2024-08-01');
    expect(cap2024Second).toBe(41828.42);
  });
});
