/**
 * @file 6183 Sayılı AATUHK Kamu & Vergi Gecikme Zammı ve Tecil Faizi Motoru
 * @description 6183 sayılı Amme Alacaklarının Tahsil Usulü Hakkında Kanun Madde 51 uyarınca
 *              vadesinde ödenmeyen kamu ve vergi borçlarına uygulanan aylık/günlük gecikme zammı
 *              ve Madde 48 uyarınca tecil faizi taksitlendirme simülasyonu.
 */

export interface LateFeeRatePeriod {
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // null ise yürürlükte
  monthlyRatePercent: number; // Aylık oran (%)
  annualRateEquivalent: number; // Yıllık eşdeğer (%)
  officialDecree: string; // Resmi Gazete / CB Kararı
}

/**
 * Resmi Gazete Tarihli 6183 m.51 Gecikme Zammı Oranları Tarihçesi
 */
export const OFFICIAL_LATE_FEE_RATES: LateFeeRatePeriod[] = [
  {
    startDate: '2019-12-30',
    endDate: '2022-07-20',
    monthlyRatePercent: 1.60,
    annualRateEquivalent: 19.20,
    officialDecree: '30.12.2019 tarihli 1947 sayılı CB Kararı',
  },
  {
    startDate: '2022-07-21',
    endDate: '2023-11-13',
    monthlyRatePercent: 2.50,
    annualRateEquivalent: 30.00,
    officialDecree: '21.07.2022 tarihli 5801 sayılı CB Kararı',
  },
  {
    startDate: '2023-11-14',
    endDate: '2024-05-20',
    monthlyRatePercent: 3.50,
    annualRateEquivalent: 42.00,
    officialDecree: '14.11.2023 tarihli 7782 sayılı CB Kararı',
  },
  {
    startDate: '2024-05-21',
    endDate: null,
    monthlyRatePercent: 4.50,
    annualRateEquivalent: 54.00,
    officialDecree: '21.05.2024 tarihli 8484 sayılı CB Kararı',
  },
];

/** Yürürlükteki 6183 m.48 Yıllık Tecil Faizi Oranı (%) */
export const OFFICIAL_ANNUAL_POSTPONEMENT_RATE = 48.00; // Yıllık %48 (Aylık %4)

export interface TaxLateInterestInput {
  /** Asıl Vergi / Kamu Borcu Tutarı (TL) */
  principalAmount: number;
  /** Vade Tarihi (YYYY-AA-GG) */
  dueDate: string;
  /** Ödeme / Hesaplama Tarihi (YYYY-AA-GG) */
  paymentDate: string;
  /** Özel Aylık Gecikme Zammı Oranı (İsteğe bağlı, girilirse resmi oran yerine kullanılır) */
  customMonthlyRatePercent?: number;
  /** 6183 m.48 Tecil ve Taksitlendirme Planı Üretilsin mi? (Opsiyonel) */
  calculateInstallments?: boolean;
  /** Tecil Taksit Sayısı (örn: 6, 12, 18, 24, 36) */
  installmentCount?: number;
}

export interface InstallmentPlanItem {
  installmentNumber: number;
  dueDate: string;
  principalPortion: number;
  postponementInterest: number;
  totalInstallmentAmount: number;
  remainingPrincipal: number;
}

export interface TaxLateInterestResult {
  principalAmount: number;
  dueDate: string;
  paymentDate: string;
  totalDaysOverdue: number;
  fullMonths: number;
  fractionDays: number;
  appliedMonthlyRatePercent: number;
  dailyRatePercent: number;
  decreeBasis: string;
  lateFeeAmount: number; // Gecikme Zammı Tutarı (TL)
  totalAmountDue: number; // Borç + Gecikme Zammı (TL)
  summaryText: string;
  installmentPlan?: {
    totalPrincipal: number;
    installmentCount: number;
    annualRatePercent: number;
    monthlyRatePercent: number;
    totalInterest: number;
    totalRepayment: number;
    schedule: InstallmentPlanItem[];
  };
}

function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Verilen tarihte geçerli resmi gecikme zammı oranını getirir
 */
export function getLateFeeRateForDate(dateStr: string): LateFeeRatePeriod {
  const d = new Date(dateStr);
  const targetTime = isNaN(d.getTime()) ? Date.now() : d.getTime();

  for (const period of OFFICIAL_LATE_FEE_RATES) {
    const start = new Date(period.startDate).getTime();
    const end = period.endDate ? new Date(period.endDate).getTime() : Infinity;
    if (targetTime >= start && targetTime <= end) {
      return period;
    }
  }

  // Varsayılan en güncel dönem
  return OFFICIAL_LATE_FEE_RATES[OFFICIAL_LATE_FEE_RATES.length - 1];
}

/**
 * 6183 sayılı AATUHK m.51 uyarınca gecikme zammı ve m.48 tecil faizi hesaplar
 */
export function calculateTaxLateInterest(input: TaxLateInterestInput): TaxLateInterestResult {
  const principalAmount = Math.max(0, input.principalAmount);
  const due = new Date(input.dueDate);
  const payment = new Date(input.paymentDate);

  if (isNaN(due.getTime()) || isNaN(payment.getTime()) || payment <= due) {
    return {
      principalAmount,
      dueDate: input.dueDate,
      paymentDate: input.paymentDate,
      totalDaysOverdue: 0,
      fullMonths: 0,
      fractionDays: 0,
      appliedMonthlyRatePercent: 0,
      dailyRatePercent: 0,
      decreeBasis: 'Vade tarihi ödeme tarihinden önce olmalıdır',
      lateFeeAmount: 0,
      totalAmountDue: principalAmount,
      summaryText: 'Gecikme bulunmamaktadır.',
    };
  }

  const diffMs = payment.getTime() - due.getTime();
  const totalDaysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // 6183 m.51: "Ay kesirleri için günlük hesap edilir (ay 30 gün kabul edilir)"
  // Tam ay hesabı: Vade gününden bir sonraki ayın aynı gününe kadar 1 tam ay
  let fullMonths = 0;
  let cursor = new Date(due);

  while (true) {
    const nextMonth = new Date(cursor);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (nextMonth <= payment) {
      fullMonths += 1;
      cursor = nextMonth;
    } else {
      break;
    }
  }

  const remainingDiffMs = payment.getTime() - cursor.getTime();
  const fractionDays = Math.max(0, Math.floor(remainingDiffMs / (1000 * 60 * 60 * 24)));

  const activePeriod = getLateFeeRateForDate(input.paymentDate);
  const appliedMonthlyRatePercent =
    input.customMonthlyRatePercent && input.customMonthlyRatePercent > 0
      ? input.customMonthlyRatePercent
      : activePeriod.monthlyRatePercent;

  const dailyRatePercent = appliedMonthlyRatePercent / 30; // Günlük oran = Aylık / 30

  // Gecikme Zammı = Asıl * [(Tam Ay * Aylık Oran) + (Kalan Gün * Günlük Oran)] / 100
  const fullMonthInterest = (principalAmount * (fullMonths * appliedMonthlyRatePercent)) / 100;
  const fractionDayInterest = (principalAmount * (fractionDays * dailyRatePercent)) / 100;
  const lateFeeAmount = roundTo2(fullMonthInterest + fractionDayInterest);
  const totalAmountDue = roundTo2(principalAmount + lateFeeAmount);

  const summaryText =
    `${principalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL tutarındaki kamu alacağı için ` +
    `${totalDaysOverdue} günlük gecikme süresinde (${fullMonths} tam ay, ${fractionDays} gün), ` +
    `aylık %${appliedMonthlyRatePercent.toLocaleString('tr-TR')} gecikme zammı oranı üzerinden ` +
    `${lateFeeAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL gecikme zammı tahakkuk etmiştir. ` +
    `Toplam ödenecek tutar ${totalAmountDue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL'dir.`;

  // Tecil ve Taksitlendirme Planı (İsteğe bağlı)
  let installmentPlanResult: TaxLateInterestResult['installmentPlan'] | undefined = undefined;
  if (input.calculateInstallments) {
    const count = Math.min(36, Math.max(2, input.installmentCount ?? 12));
    const annualRate = OFFICIAL_ANNUAL_POSTPONEMENT_RATE;
    const monthlyRate = annualRate / 12; // Aylık %4

    const principalPortion = roundTo2(principalAmount / count);
    const schedule: InstallmentPlanItem[] = [];
    let remaining = principalAmount;
    let totalInterest = 0;

    for (let i = 1; i <= count; i++) {
      const instDueDate = new Date(payment);
      instDueDate.setMonth(instDueDate.getMonth() + i);

      // Basit tecil faizi: Kalan anapara * aylık tecil faizi
      const interest = roundTo2((remaining * monthlyRate) / 100);
      totalInterest += interest;

      const instPrincipal = i === count ? roundTo2(remaining) : principalPortion;
      const totalInstAmount = roundTo2(instPrincipal + interest);
      remaining = Math.max(0, roundTo2(remaining - instPrincipal));

      schedule.push({
        installmentNumber: i,
        dueDate: instDueDate.toISOString().slice(0, 10),
        principalPortion: instPrincipal,
        postponementInterest: interest,
        totalInstallmentAmount: totalInstAmount,
        remainingPrincipal: remaining,
      });
    }

    totalInterest = roundTo2(totalInterest);
    const totalRepayment = roundTo2(principalAmount + totalInterest);

    installmentPlanResult = {
      totalPrincipal: principalAmount,
      installmentCount: count,
      annualRatePercent: annualRate,
      monthlyRatePercent: monthlyRate,
      totalInterest,
      totalRepayment,
      schedule,
    };
  }

  return {
    principalAmount,
    dueDate: input.dueDate,
    paymentDate: input.paymentDate,
    totalDaysOverdue,
    fullMonths,
    fractionDays,
    appliedMonthlyRatePercent,
    dailyRatePercent: roundTo2(dailyRatePercent * 100) / 100,
    decreeBasis: input.customMonthlyRatePercent ? 'Özel Oran' : activePeriod.officialDecree,
    lateFeeAmount,
    totalAmountDue,
    summaryText,
    installmentPlan: installmentPlanResult,
  };
}
