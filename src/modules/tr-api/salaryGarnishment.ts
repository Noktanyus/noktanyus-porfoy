/**
 * @file Türkiye Maaş Haczi Kesinti Oranı, Nafaka Önceliği & İcra Sıra Cetveli Motoru
 * @description 2004 Sayılı İcra ve İflas Kanunu (İİK) Madde 83 ve Yargıtay içtihatları
 *              uyarınca çalışanın net maaşından 1/4 oranında haciz kesintisi,
 *              öncelikli cari nafaka alacakları ve birden fazla icra dosyası için sıra cetveli simülasyonu.
 */

export interface GarnishmentFile {
  /** Dosya Kimliği veya İcra Dairesi / Dosya No (örn: "İstanbul 12. İcra 2024/1234") */
  fileId: string;
  /** Kalan Toplam Dosya Borcu (TL) */
  remainingDebt: number;
  /** Alacak Türü: 'regular' (Adi İcra Borcu) | 'alimony_arrears' (Birikmiş Nafaka) */
  debtType?: 'regular' | 'alimony_arrears';
  /** İcra tebliğ tarihi (Sıralama için opsiyonel) */
  servedDate?: string;
}

export interface SalaryGarnishmentInput {
  /** Çalışanın Aylık Net Maaşı (TL) (Vergi ve SGK sonrası ele geçen) */
  monthlyNetSalary: number;
  /** Aylık Düzenli Cari Nafaka Tutarı (TL) (İİK m.83 sınırına tabi değildir, önceliklidir) */
  monthlyAlimonyAmount?: number;
  /** Çalışanın Özel Muvafakat Oranı (%) (Standart 1/4 yerine kendi rızasıyla daha yüksek kesinti kabul ettiyse, ör. 50) */
  customGarnishmentPercent?: number;
  /** İkramiye / Prim / Yan Haklar Net Tutarı (TL) (Mevcut ayda varsa) */
  additionalBonusNet?: number;
  /** İkramiyeden Haciz Kesinti Oranı (%) (Yargıtay kuralı: genelde 1/4 veya muvafakatle tamamı) */
  bonusGarnishmentPercent?: number;
  /** İcra Dosyaları Listesi (Tebliğ sırasına göre) */
  files?: GarnishmentFile[];
}

export interface MonthlyGarnishmentPlanItem {
  monthIndex: number;
  activeFileId: string;
  monthlyDeduction: number;
  remainingDebtAfter: number;
  fileCompleted: boolean;
}

export interface SalaryGarnishmentResult {
  /** Aylık Net Maaş (TL) */
  monthlyNetSalary: number;
  /** Kesilen Öncelikli Cari Nafaka Tutarı (TL) */
  alimonyDeduction: number;
  /** Nafaka Sonrası Kalan Haczedilebilir Maaş Matrahı (TL) */
  attachableBaseSalary: number;

  /** Maaştan Yapılan Standart İcra Kesintisi (1/4 veya muvafakat) (TL) */
  salaryGarnishmentAmount: number;
  /** Uygulanan Maaş Kesinti Oranı (%) */
  appliedSalaryGarnishmentRatePercent: number;

  /** İkramiye / Primden Yapılan Kesinti (TL) */
  bonusGarnishmentAmount: number;

  /** Bu Ay Toplam Yapılacak İcra & Nafaka Kesintisi (TL) */
  totalMonthlyDeduction: number;
  /** Kesintiler Sonrası Çalışanın Eline Kalan Net Para (TL) */
  employeeRemainingNetTakeHome: number;

  /** İcra Sıra Cetveli ve Dosya Bitirme Projeksiyonu */
  queueProjection?: {
    totalDebtAllFiles: number;
    estimatedMonthsToClearAll: number;
    filesSummary: {
      fileId: string;
      debt: number;
      estimatedMonths: number;
      orderNumber: number;
      status: 'active' | 'waiting' | 'paid';
    }[];
    first12MonthsPlan: MonthlyGarnishmentPlanItem[];
  };

  /** Hukuki Uyarı ve Değerlendirme */
  legalNotice: {
    legalBasis: string;
    alimonyPriorityNotice: string;
    employerLiabilityWarning: string;
  };
}

function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * İİK m.83 uyarınca maaş haczi, nafaka kesintisi ve icra sıra cetvelini hesaplar
 */
export function calculateSalaryGarnishment(input: SalaryGarnishmentInput): SalaryGarnishmentResult {
  const netSalary = Math.max(0, input.monthlyNetSalary);
  const alimony = Math.max(0, input.monthlyAlimonyAmount || 0);

  // 1. Cari Nafaka Kesintisi (Öncelikli kural: İİK m.83 sınırlarına tabi değildir, nafaka tam kesilir)
  // Eğer nafaka net maaştan büyükse en fazla net maaş kadar kesilebilir.
  const alimonyDeduction = Math.min(netSalary, alimony);

  // 2. Nafaka sonrası kalan haczedilebilir maaş matrahı
  const attachableBaseSalary = roundTo2(Math.max(0, netSalary - alimonyDeduction));

  // 3. İcra Kesinti Oranı (Yasal tavan 1/4 = %25. Borçlunun açık muvafakati varsa özel oran)
  let appliedRatePercent = 25;
  if (input.customGarnishmentPercent !== undefined && input.customGarnishmentPercent > 0) {
    appliedRatePercent = Math.min(100, Math.max(1, input.customGarnishmentPercent));
  }

  const salaryGarnishmentAmount = roundTo2(attachableBaseSalary * (appliedRatePercent / 100));

  // 4. İkramiye / Ek Kazanç Kesintisi
  const bonusNet = Math.max(0, input.additionalBonusNet || 0);
  const bonusRate = input.bonusGarnishmentPercent !== undefined ? Math.min(100, Math.max(0, input.bonusGarnishmentPercent)) : 25;
  const bonusGarnishmentAmount = roundTo2(bonusNet * (bonusRate / 100));

  // 5. Toplam Kesinti ve Çalışana Kalan Tutar
  const totalMonthlyDeduction = roundTo2(alimonyDeduction + salaryGarnishmentAmount + bonusGarnishmentAmount);
  const employeeRemainingNetTakeHome = roundTo2(netSalary + bonusNet - totalMonthlyDeduction);

  // 6. Sıra Cetveli ve Çoklu Dosya Projeksiyonu
  let queueProjection: SalaryGarnishmentResult['queueProjection'] = undefined;

  const files = input.files && input.files.length > 0 ? input.files : [];
  if (files.length > 0) {
    const totalDebtAllFiles = roundTo2(files.reduce((sum, f) => sum + Math.max(0, f.remainingDebt), 0));
    const monthlyRateForDebt = salaryGarnishmentAmount; // Her ay düzenli kesilecek tutar

    let currentFileDebt = 0;
    let accumulatedMonths = 0;

    const filesSummary: NonNullable<SalaryGarnishmentResult['queueProjection']>['filesSummary'] = [];
    const first12MonthsPlan: MonthlyGarnishmentPlanItem[] = [];

    // Dosyaların her biri için bitiş ayı tahmini
    files.forEach((file, index) => {
      const debt = Math.max(0, file.remainingDebt);
      const monthsForThisFile = monthlyRateForDebt > 0 ? Math.ceil(debt / monthlyRateForDebt) : 0;
      filesSummary.push({
        fileId: file.fileId || `Dosya #${index + 1}`,
        debt,
        estimatedMonths: monthsForThisFile,
        orderNumber: index + 1,
        status: index === 0 ? 'active' : 'waiting',
      });
    });

    // İlk 12 ay için simülasyon planı
    let simFileIndex = 0;
    let simDebtRemainingInCurrent = files[0] ? Math.max(0, files[0].remainingDebt) : 0;

    for (let month = 1; month <= 12; month++) {
      if (simFileIndex >= files.length) break;

      const activeFile = files[simFileIndex];
      const activeFileId = activeFile.fileId || `Dosya #${simFileIndex + 1}`;

      const deduction = Math.min(simDebtRemainingInCurrent, monthlyRateForDebt);
      simDebtRemainingInCurrent = roundTo2(simDebtRemainingInCurrent - deduction);

      const isCompleted = simDebtRemainingInCurrent <= 0.01;

      first12MonthsPlan.push({
        monthIndex: month,
        activeFileId,
        monthlyDeduction: deduction,
        remainingDebtAfter: simDebtRemainingInCurrent,
        fileCompleted: isCompleted,
      });

      if (isCompleted) {
        simFileIndex++;
        if (simFileIndex < files.length) {
          simDebtRemainingInCurrent = Math.max(0, files[simFileIndex].remainingDebt);
        }
      }
    }

    const estimatedMonthsToClearAll = monthlyRateForDebt > 0 ? Math.ceil(totalDebtAllFiles / monthlyRateForDebt) : 0;

    queueProjection = {
      totalDebtAllFiles,
      estimatedMonthsToClearAll,
      filesSummary,
      first12MonthsPlan,
    };
  }

  return {
    monthlyNetSalary: netSalary,
    alimonyDeduction,
    attachableBaseSalary,
    salaryGarnishmentAmount,
    appliedSalaryGarnishmentRatePercent: appliedRatePercent,
    bonusGarnishmentAmount,
    totalMonthlyDeduction,
    employeeRemainingNetTakeHome,
    queueProjection,
    legalNotice: {
      legalBasis:
        '2004 sayılı İcra ve İflas Kanunu Madde 83 uyarınca borçlunun maaş ve ücretinin haczedilebilir kısmı dörtte birinden (1/4) az olamaz ve aksine anlaşma olmadıkça 1/4 oranında kesilir.',
      alimonyPriorityNotice:
        'Yargıtay Hukuk Genel Kurulu kararları uyarınca cari nafaka alacakları İİK m.83 sınırlamasına tabi olmaksızın öncelikle ve tamamen kesilir. Kalan net maaş üzerinden 1/4 icra kesintisi yapılır.',
      employerLiabilityWarning:
        'İİK m.356 uyarınca işveren, icra tebliğine rağmen kesintiyi yapmaz veya geciktirirse, kesilmesi gereken tutarı bizzat ödemekle yükümlü tutulur (İşverenin doğrudan hukuki ve cezai sorumluluğu).',
    },
  };
}
