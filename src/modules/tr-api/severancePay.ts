/**
 * @file 4857 Sayılı İş Kanunu Kıdem, İhbar Tazminatı & Yıllık İzin Motoru
 * @description 1475 sayılı Kanun m.14 ve 4857 sayılı İş Kanunu m.17 uyarınca
 *              giydirilmiş brüt ücret, Hazine resmi kıdem tavanı, damga vergisi,
 *              ihbar önelleri, gelir vergisi dilimleri ve net hakediş hesaplayıcı.
 */

export interface SeveranceCapPeriod {
  year: number;
  period: 'first_half' | 'second_half' | 'full_year';
  label: string;
  capAmount: number; // TL
}

/**
 * Resmi Hazine ve Maliye Bakanlığı Kıdem Tazminatı Tavanları
 */
export const OFFICIAL_SEVERANCE_CAPS: SeveranceCapPeriod[] = [
  { year: 2023, period: 'first_half', label: '2023 1. Dönem (Ocak - Haziran)', capAmount: 19982.83 },
  { year: 2023, period: 'second_half', label: '2023 2. Dönem (Temmuz - Aralık)', capAmount: 23489.83 },
  { year: 2024, period: 'first_half', label: '2024 1. Dönem (Ocak - Haziran)', capAmount: 35058.58 },
  { year: 2024, period: 'second_half', label: '2024 2. Dönem (Temmuz - Aralık)', capAmount: 41828.42 },
  { year: 2025, period: 'first_half', label: '2025 1. Dönem (Ocak - Haziran)', capAmount: 46800.00 },
  { year: 2025, period: 'second_half', label: '2025 2. Dönem (Temmuz - Aralık)', capAmount: 52000.00 },
];

/** Damga Vergisi Oranı (Binde 7,59) */
export const STAMP_TAX_RATE = 0.00759;

export interface SeverancePayInput {
  /** İşe Giriş Tarihi (YYYY-AA-GG) */
  startDate: string;
  /** İşten Çıkış Tarihi (YYYY-AA-GG) */
  endDate: string;
  /** Çıplak Brüt Maaş (TL) */
  grossSalary: number;
  /** Aylık Ortalama Düzenli Yan Haklar (Yol + Yemek + Prim + İkramiye vb. brüt TL) */
  regularBenefitsMonthly?: number;
  /** Özel Kıdem Tazminatı Tavanı (Belirtilmezse tarihe göre resmi tavan seçilir) */
  customSeveranceCap?: number;
  /** İhbar Tazminatı Hesaplansın mı? (Varsayılan: true) */
  calculateNoticePay?: boolean;
  /** İhbar Gelir Vergisi Dilimi (Varsayılan: 15 (%15), opsiyonel: 20, 27, 35, 40) */
  noticeIncomeTaxRate?: number;
  /** Kullanılmamış Yıllık İzin Gün Sayısı (0 ise hesaplanmaz) */
  unusedLeaveDays?: number;
}

export interface ServiceDuration {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  formattedText: string;
}

export interface SeverancePayBreakdown {
  eligibleForSeverance: boolean;
  effectiveGrossMonthly: number;
  isCapped: boolean;
  appliedCap: number;
  grossSeverance: number;
  stampTax: number;
  netSeverance: number;
}

export interface NoticePayBreakdown {
  noticeWeeks: number;
  noticeDays: number;
  grossNotice: number;
  incomeTax: number;
  stampTax: number;
  netNotice: number;
}

export interface UnusedLeaveBreakdown {
  leaveDays: number;
  grossAmount: number;
  sgkWorkerTax: number; // %14
  unemploymentTax: number; // %1
  incomeTax: number; // %15
  stampTax: number; // binde 7.59
  netAmount: number;
}

export interface SeverancePayResult {
  serviceDuration: ServiceDuration;
  rawGrossSalary: number;
  regularBenefitsMonthly: number;
  effectiveGrossMonthly: number; // Giydirilmiş Brüt Ücret
  severance: SeverancePayBreakdown;
  notice?: NoticePayBreakdown;
  unusedLeave?: UnusedLeaveBreakdown;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  legalSummary: string;
}

function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * İki tarih arasındaki hizmet süresini (yıl, ay, gün) hesaplar
 */
export function calculateServiceDuration(startDateStr: string, endDateStr: string): ServiceDuration {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      formattedText: 'Geçersiz tarih aralığı',
    };
  }

  const diffMs = end.getTime() - start.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // Başlangıç ve bitiş dahil

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    // Bir önceki ayın gün sayısını ekle
    const prevMonthDate = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonthDate.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalDays,
    formattedText: `${years} Yıl, ${months} Ay, ${days} Gün`,
  };
}

/**
 * İşten çıkış tarihine göre geçerli resmi kıdem tazminatı tavanını bulur
 */
export function getSeveranceCapForDate(dateStr: string): number {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return OFFICIAL_SEVERANCE_CAPS[OFFICIAL_SEVERANCE_CAPS.length - 1].capAmount;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const period = month <= 6 ? 'first_half' : 'second_half';

  const match = OFFICIAL_SEVERANCE_CAPS.find((c) => c.year === year && c.period === period);
  if (match) return match.capAmount;

  if (year >= 2025) {
    return OFFICIAL_SEVERANCE_CAPS[OFFICIAL_SEVERANCE_CAPS.length - 1].capAmount;
  }

  return OFFICIAL_SEVERANCE_CAPS[0].capAmount;
}

/**
 * Hizmet süresine göre 4857 sayılı İş Kanunu m.17 ihbar önel haftalarını belirler
 */
export function getNoticeWeeks(duration: ServiceDuration): { weeks: number; days: number } {
  const totalMonths = duration.years * 12 + duration.months;

  if (totalMonths < 6) {
    return { weeks: 2, days: 14 };
  } else if (totalMonths < 18) {
    return { weeks: 4, days: 28 };
  } else if (totalMonths < 36) {
    return { weeks: 6, days: 42 };
  } else {
    return { weeks: 8, days: 56 };
  }
}

/**
 * 4857 Sayılı İş Kanunu Kıdem, İhbar ve İzin Tazminatı Hesaplar
 */
export function calculateSeverancePay(input: SeverancePayInput): SeverancePayResult {
  const rawGrossSalary = Math.max(0, input.grossSalary);
  const regularBenefitsMonthly = Math.max(0, input.regularBenefitsMonthly || 0);
  const effectiveGrossMonthly = rawGrossSalary + regularBenefitsMonthly;

  const duration = calculateServiceDuration(input.startDate, input.endDate);

  // 1. Kıdem Tazminatı (En az 1 tam yıl / 365 gün şartı)
  const eligibleForSeverance = duration.totalDays >= 365;

  const cap = input.customSeveranceCap && input.customSeveranceCap > 0
    ? input.customSeveranceCap
    : getSeveranceCapForDate(input.endDate);

  const cappedBasis = Math.min(effectiveGrossMonthly, cap);
  const isCapped = effectiveGrossMonthly > cap;

  let grossSeverance = 0;
  if (eligibleForSeverance) {
    const yearPart = duration.years * cappedBasis;
    const monthPart = (duration.months / 12) * cappedBasis;
    const dayPart = (duration.days / 365) * cappedBasis;
    grossSeverance = roundTo2(yearPart + monthPart + dayPart);
  }

  // Kıdemden sadece Damga Vergisi (%0.759) kesilir
  const severanceStampTax = roundTo2(grossSeverance * STAMP_TAX_RATE);
  const netSeverance = roundTo2(grossSeverance - severanceStampTax);

  const severanceBreakdown: SeverancePayBreakdown = {
    eligibleForSeverance,
    effectiveGrossMonthly,
    isCapped,
    appliedCap: cap,
    grossSeverance,
    stampTax: severanceStampTax,
    netSeverance,
  };

  // 2. İhbar Tazminatı
  let noticeBreakdown: NoticePayBreakdown | undefined = undefined;
  if (input.calculateNoticePay !== false) {
    const { weeks, days: noticeDays } = getNoticeWeeks(duration);
    // Günlük giydirilmiş brüt ücret = Giydirilmiş brüt / 30
    const dailyRate = effectiveGrossMonthly / 30;
    const grossNotice = roundTo2(dailyRate * noticeDays);

    const taxRate = (input.noticeIncomeTaxRate ?? 15) / 100;
    const noticeIncomeTax = roundTo2(grossNotice * taxRate);
    const noticeStampTax = roundTo2(grossNotice * STAMP_TAX_RATE);
    const netNotice = roundTo2(grossNotice - noticeIncomeTax - noticeStampTax);

    noticeBreakdown = {
      noticeWeeks: weeks,
      noticeDays,
      grossNotice,
      incomeTax: noticeIncomeTax,
      stampTax: noticeStampTax,
      netNotice,
    };
  }

  // 3. Kullanılmamış Yıllık İzin Ücreti
  let unusedLeaveBreakdown: UnusedLeaveBreakdown | undefined = undefined;
  if (input.unusedLeaveDays && input.unusedLeaveDays > 0) {
    const leaveDays = input.unusedLeaveDays;
    // Yıllık izin çıplak brüt ücretten hesaplanır (Yargıtay yerleşik içtihadı)
    const dailyRawRate = rawGrossSalary / 30;
    const grossLeave = roundTo2(dailyRawRate * leaveDays);

    const sgkWorkerTax = roundTo2(grossLeave * 0.14);
    const unemploymentTax = roundTo2(grossLeave * 0.01);
    const taxableBase = grossLeave - sgkWorkerTax - unemploymentTax;
    const leaveIncomeTax = roundTo2(taxableBase * 0.15); // %15 başlangıç dilimi
    const leaveStampTax = roundTo2(grossLeave * STAMP_TAX_RATE);
    const netLeave = roundTo2(grossLeave - sgkWorkerTax - unemploymentTax - leaveIncomeTax - leaveStampTax);

    unusedLeaveBreakdown = {
      leaveDays,
      grossAmount: grossLeave,
      sgkWorkerTax,
      unemploymentTax,
      incomeTax: leaveIncomeTax,
      stampTax: leaveStampTax,
      netAmount: netLeave,
    };
  }

  const totalGrossPay = roundTo2(
    grossSeverance +
    (noticeBreakdown ? noticeBreakdown.grossNotice : 0) +
    (unusedLeaveBreakdown ? unusedLeaveBreakdown.grossAmount : 0)
  );

  const totalDeductions = roundTo2(
    severanceStampTax +
    (noticeBreakdown ? noticeBreakdown.incomeTax + noticeBreakdown.stampTax : 0) +
    (unusedLeaveBreakdown
      ? unusedLeaveBreakdown.sgkWorkerTax +
        unusedLeaveBreakdown.unemploymentTax +
        unusedLeaveBreakdown.incomeTax +
        unusedLeaveBreakdown.stampTax
      : 0)
  );

  const totalNetPay = roundTo2(totalGrossPay - totalDeductions);

  let legalSummary = `${duration.formattedText} (${duration.totalDays} gün) hizmet süresi için `;
  if (eligibleForSeverance) {
    legalSummary += `brüt ${grossSeverance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL kıdem tazminatı (net ${netSeverance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL)`;
    if (isCapped) {
      legalSummary += ` [Hazine tavanı olan ${cap.toLocaleString('tr-TR')} TL esas alınmıştır]`;
    }
  } else {
    legalSummary += 'hizmet süresi 1 yıldan az olduğundan kıdem tazminatına hak kazanılamamıştır';
  }

  if (noticeBreakdown) {
    legalSummary += `, ${noticeBreakdown.noticeWeeks} haftalık (${noticeBreakdown.noticeDays} gün) ihbar öneli karşılığı net ${noticeBreakdown.netNotice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL ihbar tazminatı`;
  }

  if (unusedLeaveBreakdown) {
    legalSummary += `, ${unusedLeaveBreakdown.leaveDays} günlük kullanılmamış yıllık izin karşılığı net ${unusedLeaveBreakdown.netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
  }

  legalSummary += ` olmak üzere toplam net ${totalNetPay.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL fesih hakedişi hesaplanmıştır.`;

  return {
    serviceDuration: duration,
    rawGrossSalary,
    regularBenefitsMonthly,
    effectiveGrossMonthly,
    severance: severanceBreakdown,
    notice: noticeBreakdown,
    unusedLeave: unusedLeaveBreakdown,
    totalGrossPay,
    totalDeductions,
    totalNetPay,
    legalSummary,
  };
}
