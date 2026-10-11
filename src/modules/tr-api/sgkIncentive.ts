/**
 * @file sgkIncentive.ts
 * @description SGK 5510 Sayılı Kanun m.81/ı %5 Puanlık Hazine Teşviki, Asgari Ücret Desteği
 *              ve İşveren Maliyeti Hesaplama Motoru.
 *
 * Yasal Dayanaklar:
 * 1. 5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu m.81/ı:
 *    - Özel sektör işverenlerinin malullük, yaşlılık ve ölüm sigortaları primlerinden
 *      işveren hissesinin 5 puanlık kısmı Hazine tarafından karşılanır.
 *    - Standart İşveren Payı: %20.5
 *    - 5 Puan İndirimli İşveren Payı: %15.5 (%5 tasarruf)
 *    - İşsizlik Sigortası İşveren Payı: %2.0
 * 2. 5510 sayılı Kanun Geçici Maddeleri uyarınca Asgari Ücret Desteği:
 *    - 2024 ve 2025 yılı için çalışan başına aylık 700 TL (günlük 23,33 TL x 30 gün) prim desteği.
 * 3. 7349 sayılı Kanun uyarınca Asgari Ücret Vergi İstisnası:
 *    - Tüm çalışanların ücretlerinin asgari ücrete kadar olan kısmı Gelir Vergisi ve Damga Vergisinden istisnadır.
 * 4. 2024 SGK Taban ve Tavan Parametreleri:
 *    - Asgari Brüt Ücret (Taban): 20.002,50 TL
 *    - SGK Tavan Ücreti (7.5 Katı): 150.018,75 TL
 */

export const SGK_OFFICIAL_CONSTANTS = {
  MIN_GROSS_SALARY_2024: 20002.5,
  MAX_SGK_CEILING_2024: 150018.75,
  STANDARD_EMPLOYER_SGK_RATE: 20.5,
  DISCOUNTED_EMPLOYER_SGK_RATE: 15.5,
  INCENTIVE_POINTS: 5.0,
  EMPLOYER_UNEMPLOYMENT_RATE: 2.0,
  EMPLOYEE_SGK_RATE: 14.0,
  EMPLOYEE_UNEMPLOYMENT_RATE: 1.0,
  MINIMUM_WAGE_SUPPORT_PER_EMPLOYEE: 700.0, // Aylık kişi başı 700 TL
};

export interface SgkIncentiveInput {
  grossSalaryPerEmployee: number; // Çalışan başına aylık brüt ücret
  employeeCount?: number; // Çalışan sayısı (varsayılan 1)
  apply5PointsDiscount?: boolean; // 5510 m.81/ı 5 puan indirimi
  applyMinimumWageSupport?: boolean; // Kişi başı 700 TL asgari ücret desteği
  customMonthlySupportPerEmployee?: number; // Özel asgari ücret desteği tutarı
}

export interface SgkIncentiveResult {
  employeeCount: number;
  grossSalaryPerEmployee: number;
  totalGrossPayroll: number;
  sgkBaseAmountPerEmployee: number; // SGK tavan/tabanına kırpılmış matrah
  totalSgkBasePayroll: number;
  standardEmployerSgkRatePercent: number;
  appliedEmployerSgkRatePercent: number;
  standardEmployerSgkCost: number; // 5 puan indirimsiz SGK primi
  appliedEmployerSgkCost: number; // 5 puan indirimli SGK primi
  fivePointsSavingsPerMonth: number; // 5 puan indirimi aylık toplam tasarrufu
  employerUnemploymentCost: number; // %2 işsizlik primi
  minimumWageSupportTotal: number; // Asgari ücret desteği toplamı (700 TL x N)
  standardTotalEmployerCost: number; // Teşviksiz toplam işveren maliyeti
  incentivizedTotalEmployerCost: number; // Teşvikli net işveren maliyeti
  monthlyNetSavingsTotal: number; // İşverenin cebinde kalan net aylık kazanç
  annualNetSavingsTotal: number; // Yıllık kümülatif tasarruf
  savingsRatioPercent: number; // Maliyet avantajı oranı (%)
  employeeDeductions: {
    sgkEmployeeDeduction: number;
    unemploymentEmployeeDeduction: number;
  };
  legalWarning: {
    requirements: string[];
    riskIfDelayed: string;
  };
}

export function calculateSgkIncentive(input: SgkIncentiveInput): SgkIncentiveResult {
  const count = Math.max(1, Math.floor(Number(input.employeeCount) || 1));
  const rawGross = Math.max(0, Number(input.grossSalaryPerEmployee) || 0);

  // SGK matrahı taban (asgari ücret) ve tavan (7.5 katı) arasına sınırlandırılır
  let sgkBasePerEmployee = rawGross;
  if (sgkBasePerEmployee > SGK_OFFICIAL_CONSTANTS.MAX_SGK_CEILING_2024) {
    sgkBasePerEmployee = SGK_OFFICIAL_CONSTANTS.MAX_SGK_CEILING_2024;
  }

  const totalGrossPayroll = Math.round(rawGross * count * 100) / 100;
  const totalSgkBasePayroll = Math.round(sgkBasePerEmployee * count * 100) / 100;

  const is5PointsApplied = input.apply5PointsDiscount !== false;
  const isMinWageSupportApplied = input.applyMinimumWageSupport !== false;

  const appliedEmployerRate = is5PointsApplied
    ? SGK_OFFICIAL_CONSTANTS.DISCOUNTED_EMPLOYER_SGK_RATE
    : SGK_OFFICIAL_CONSTANTS.STANDARD_EMPLOYER_SGK_RATE;

  // Standart ve teşvikli SGK primleri
  const standardEmployerSgkCost = Math.round(totalSgkBasePayroll * (SGK_OFFICIAL_CONSTANTS.STANDARD_EMPLOYER_SGK_RATE / 100) * 100) / 100;
  const appliedEmployerSgkCost = Math.round(totalSgkBasePayroll * (appliedEmployerRate / 100) * 100) / 100;
  const fivePointsSavingsPerMonth = Math.round((standardEmployerSgkCost - appliedEmployerSgkCost) * 100) / 100;

  // İşsizlik sigortası (%2)
  const employerUnemploymentCost = Math.round(totalSgkBasePayroll * (SGK_OFFICIAL_CONSTANTS.EMPLOYER_UNEMPLOYMENT_RATE / 100) * 100) / 100;

  // Asgari Ücret Desteği (700 TL/çalışan)
  const supportPerEmp = input.customMonthlySupportPerEmployee !== undefined
    ? input.customMonthlySupportPerEmployee
    : SGK_OFFICIAL_CONSTANTS.MINIMUM_WAGE_SUPPORT_PER_EMPLOYEE;
  const minimumWageSupportTotal = isMinWageSupportApplied ? Math.round(supportPerEmp * count * 100) / 100 : 0;

  // Toplam Maliyetler
  // Teşviksiz = Brüt Ücretler + Standart SGK (%20.5) + İşsizlik (%2)
  const standardTotalEmployerCost = Math.round((totalGrossPayroll + standardEmployerSgkCost + employerUnemploymentCost) * 100) / 100;

  // Teşvikli = Brüt Ücretler + Uygulanan SGK (%15.5) + İşsizlik (%2) - Asgari Ücret Desteği
  const incentivizedTotalEmployerCost = Math.round((totalGrossPayroll + appliedEmployerSgkCost + employerUnemploymentCost - minimumWageSupportTotal) * 100) / 100;

  // Net Tasarruf
  const monthlyNetSavingsTotal = Math.round((standardTotalEmployerCost - incentivizedTotalEmployerCost) * 100) / 100;
  const annualNetSavingsTotal = Math.round(monthlyNetSavingsTotal * 12 * 100) / 100;

  const savingsRatioPercent = standardTotalEmployerCost > 0
    ? Math.round((monthlyNetSavingsTotal / standardTotalEmployerCost) * 1000) / 10
    : 0;

  // Çalışan kesintileri (bilgi amaçlı)
  const sgkEmployeeDeduction = Math.round(sgkBasePerEmployee * (SGK_OFFICIAL_CONSTANTS.EMPLOYEE_SGK_RATE / 100) * 100) / 100;
  const unemploymentEmployeeDeduction = Math.round(sgkBasePerEmployee * (SGK_OFFICIAL_CONSTANTS.EMPLOYEE_UNEMPLOYMENT_RATE / 100) * 100) / 100;

  return {
    employeeCount: count,
    grossSalaryPerEmployee: rawGross,
    totalGrossPayroll,
    sgkBaseAmountPerEmployee: sgkBasePerEmployee,
    totalSgkBasePayroll,
    standardEmployerSgkRatePercent: SGK_OFFICIAL_CONSTANTS.STANDARD_EMPLOYER_SGK_RATE,
    appliedEmployerSgkRatePercent: appliedEmployerRate,
    standardEmployerSgkCost,
    appliedEmployerSgkCost,
    fivePointsSavingsPerMonth,
    employerUnemploymentCost,
    minimumWageSupportTotal,
    standardTotalEmployerCost,
    incentivizedTotalEmployerCost,
    monthlyNetSavingsTotal,
    annualNetSavingsTotal,
    savingsRatioPercent,
    employeeDeductions: {
      sgkEmployeeDeduction,
      unemploymentEmployeeDeduction,
    },
    legalWarning: {
      requirements: [
        'Aylık prim ve hizmet belgesi (Muhtasar ve Prim Hizmet Beyannamesi) yasal süresinde verilmelidir.',
        'Tahakkuk eden primler yasal süresinde (izleyen ayın sonuna kadar) eksiksiz ödenmelidir.',
        'İşverenin SGK’ya muaccel prim, idari para cezası ve gecikme zammı borcu bulunmamalıdır (veya tecil/taksitlendirilmiş olmalıdır).',
        'Kayıt dışı (sigortasız) işçi çalıştırılmamalı ve sahte sigortalı bildirilmemelidir.',
      ],
      riskIfDelayed: 'Prim ödemesi 1 gün dahi gecikirse 5 puanlık indirim hakkı o ay için tamamen yanar ve gecikme cezası uygulanır.',
    },
  };
}
