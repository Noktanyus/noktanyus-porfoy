/**
 * @file Türkiye Genç Girişimci İstisnası & Bağkur Desteği Hesaplama Motoru
 * @description 193 Sayılı Gelir Vergisi Kanunu Mükerrer Madde 20/A ve
 *              5510 Sayılı Kanun Madde 81/k uyarınca 18-29 yaş arası girişimciler için
 *              3 yıllık gelir vergisi istisnası ve 1 yıllık SGK Bağkur prim desteği simülasyonu.
 */

export interface YoungEntrepreneurInput {
  /** Yıllık Toplam Hasılat / Gelir (TL, KDV Hariç) */
  annualRevenue: number;
  /** Yıllık Toplam İşletme Giderleri (TL, KDV Hariç) */
  annualExpenses: number;
  /** Vergilendirme Yılı (2024 veya 2025) - İlgili yılın istisna tavanı ve vergi dilimlerini belirler */
  year?: 2024 | 2025;
  /** Özel Gelir Vergisi İstisna Tutarı (TL) - Girilmezse seçilen yılın yasal tavanı kullanılır */
  customExemptionLimit?: number;
  /** Aylık Bağkur Prim Tutarı (TL) - Girilmezse güncel Hazine destek tutarı kullanılır */
  customMonthlyBagkur?: number;
  /** 1 Yıllık Bağkur prim desteği dahil edilsin mi? (Girişimci ilk yılındaysa true) */
  includeBagkurSupport?: boolean;
}

export interface TaxBracket {
  limit: number;
  rate: number;
}

/**
 * Gelir Vergisi Dilimleri (193 s. GVK Madde 103 - Ücret Dışı Gelirler)
 */
export const TAX_BRACKETS_2024: TaxBracket[] = [
  { limit: 110_000, rate: 0.15 },
  { limit: 230_000, rate: 0.20 },
  { limit: 580_000, rate: 0.27 }, // (veya 870.000 genel)
  { limit: 3_000_000, rate: 0.35 },
  { limit: Infinity, rate: 0.40 },
];

export const TAX_BRACKETS_2025: TaxBracket[] = [
  { limit: 158_000, rate: 0.15 },
  { limit: 330_000, rate: 0.20 },
  { limit: 800_000, rate: 0.27 },
  { limit: 4_300_000, rate: 0.35 },
  { limit: Infinity, rate: 0.40 },
];

/** Yıllara Göre Resmi Yasal Genç Girişimci İstisna Tavanları */
export const OFFICIAL_EXEMPTIONS = {
  2024: 230_000, // 2024 yılı Gelir Vergisi 2. Dilim Tutarı
  2025: 330_000, // 2025 yılı Gelir Vergisi 2. Dilim Tutarı
} as const;

/** 1 Aylık Asgari Bağkur Primi (Hazinece karşılanan tutar) */
export const DEFAULT_MONTHLY_BAGKUR_2024 = 6900.86;
export const DEFAULT_MONTHLY_BAGKUR_2025 = 8500.00;

export interface YoungEntrepreneurResult {
  /** Yıllık Brüt Kâr (Gelir - Gider) (TL) */
  annualGrossProfit: number;
  /** Uygulanan Yıllık İstisna Tutarı (TL) */
  appliedExemptionAmount: number;
  /** İstisna Sonrası Kalan Vergi Matrahı (TL) */
  taxableIncomeWithIncentive: number;

  /** Normal (Teşviksiz) Ödenecek Gelir Vergisi (TL) */
  standardIncomeTax: number;
  /** Teşvikli Ödenecek Gelir Vergisi (TL) */
  incentivizedIncomeTax: number;
  /** Sağlanan Gelir Vergisi Tasarrufu (TL) */
  taxSavings: number;

  /** 1 Yıllık SGK Bağkur Prim Teşviki (Hazinece ödenen) (TL) */
  bagkurSavings: number;
  /** Toplam Sağlanan Finansal Fayda (Vergi + Bağkur) (TL) */
  totalAnnualBenefit: number;

  /** Teşviksiz Net Ele Geçen Yıllık Kazanç (TL) */
  standardNetIncome: number;
  /** Teşvikli Net Ele Geçen Yıllık Kazanç (TL) */
  incentivizedNetIncome: number;

  /** Teşvikli Efektif Vergi Oranı (%) */
  effectiveTaxRateWithIncentive: number;
  /** Teşviksiz Efektif Vergi Oranı (%) */
  effectiveTaxRateStandard: number;

  /** Aylık Ortalama Net Kazanç (TL) */
  monthlyAverageNetIncome: number;
  /** Aylık Ortalama Tasarruf (TL) */
  monthlyAverageSavings: number;

  /** Bilgilendirme ve Tavsiyeler */
  evaluation: {
    title: string;
    description: string;
    exemptionUsagePercent: number;
  };
}

function roundTo2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Vergi matrahına göre kademeli gelir vergisi hesaplar
 */
export function calculateProgressiveTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0;

  let remaining = taxableIncome;
  let prevLimit = 0;
  let totalTax = 0;

  for (const bracket of brackets) {
    const bracketSpan = bracket.limit - prevLimit;
    const taxableInBracket = Math.min(remaining, bracketSpan);

    if (taxableInBracket > 0) {
      totalTax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
    }

    prevLimit = bracket.limit;
    if (remaining <= 0) break;
  }

  return roundTo2(totalTax);
}

/**
 * Genç Girişimci İstisnası ve Bağkur Prim Desteğini hesaplar
 */
export function calculateYoungEntrepreneurBenefit(input: YoungEntrepreneurInput): YoungEntrepreneurResult {
  const annualRevenue = Math.max(0, input.annualRevenue);
  const annualExpenses = Math.max(0, input.annualExpenses);
  const year = input.year || 2024;
  const brackets = year === 2025 ? TAX_BRACKETS_2025 : TAX_BRACKETS_2024;

  const defaultExemption = OFFICIAL_EXEMPTIONS[year] || 230_000;
  const exemptionLimit = input.customExemptionLimit !== undefined && input.customExemptionLimit >= 0
    ? input.customExemptionLimit
    : defaultExemption;

  const defaultBagkur = year === 2025 ? DEFAULT_MONTHLY_BAGKUR_2025 : DEFAULT_MONTHLY_BAGKUR_2024;
  const monthlyBagkur = input.customMonthlyBagkur !== undefined && input.customMonthlyBagkur >= 0
    ? input.customMonthlyBagkur
    : defaultBagkur;

  const includeBagkur = input.includeBagkurSupport !== false;

  // 1. Brüt Ticari Kazanç / Kâr
  const annualGrossProfit = Math.max(0, roundTo2(annualRevenue - annualExpenses));

  // 2. Normal (Teşviksiz) Vergi
  const standardIncomeTax = calculateProgressiveTax(annualGrossProfit, brackets);

  // 3. Teşvikli Vergi: Kârdan istisna tutarı düşülür
  const appliedExemptionAmount = Math.min(annualGrossProfit, exemptionLimit);
  const taxableIncomeWithIncentive = Math.max(0, roundTo2(annualGrossProfit - appliedExemptionAmount));
  const incentivizedIncomeTax = calculateProgressiveTax(taxableIncomeWithIncentive, brackets);

  // 4. Tasarruflar
  const taxSavings = roundTo2(standardIncomeTax - incentivizedIncomeTax);
  const bagkurSavings = includeBagkur ? roundTo2(monthlyBagkur * 12) : 0;
  const totalAnnualBenefit = roundTo2(taxSavings + bagkurSavings);

  // 5. Net Gelirler
  // Teşviksiz: Kâr - Vergi - (Normalde ödenecek Bağkur)
  const annualBagkurCost = roundTo2(monthlyBagkur * 12);
  const standardNetIncome = roundTo2(annualGrossProfit - standardIncomeTax - annualBagkurCost);
  // Teşvikli: Kâr - Teşvikli Vergi - (Bağkur Hazinece ödeniyorsa 0, ödenmiyorsa Bağkur)
  const paidBagkurWithIncentive = includeBagkur ? 0 : annualBagkurCost;
  const incentivizedNetIncome = roundTo2(annualGrossProfit - incentivizedIncomeTax - paidBagkurWithIncentive);

  // 6. Efektif Vergi Oranları
  const effectiveTaxRateStandard = annualGrossProfit > 0
    ? roundTo2((standardIncomeTax / annualGrossProfit) * 100)
    : 0;
  const effectiveTaxRateWithIncentive = annualGrossProfit > 0
    ? roundTo2((incentivizedIncomeTax / annualGrossProfit) * 100)
    : 0;

  // 7. Aylık Ortalamalar
  const monthlyAverageNetIncome = roundTo2(incentivizedNetIncome / 12);
  const monthlyAverageSavings = roundTo2(totalAnnualBenefit / 12);

  // 8. İstisna Kullanım Oranı ve Değerlendirme
  const exemptionUsagePercent = exemptionLimit > 0
    ? roundTo2((appliedExemptionAmount / exemptionLimit) * 100)
    : 0;

  let evalTitle = '';
  let evalDesc = '';

  if (annualGrossProfit === 0) {
    evalTitle = 'Kazanç / Kâr Bulunmuyor';
    evalDesc = 'İşletmenizin bu dönem vergilendirilebilir kârı oluşmadığı için gelir vergisi doğmamıştır.';
  } else if (annualGrossProfit <= exemptionLimit) {
    evalTitle = 'Sıfır Gelir Vergisi: Kazancınızın Tamamı İstisna Kapsamında!';
    evalDesc = `${annualGrossProfit.toLocaleString('tr-TR')} TL yıllık kârınızın tamamı ${exemptionLimit.toLocaleString('tr-TR')} TL yasal istisna tavanı içinde kaldığından hiç gelir vergisi ödemeyeceksiniz.`;
  } else {
    evalTitle = `Maksimum İstisna Kullanıldı: ${appliedExemptionAmount.toLocaleString('tr-TR')} TL İndirim`;
    evalDesc = `İstisna tavanının (%100) tamamı kullanıldı. Tavanı aşan ${taxableIncomeWithIncentive.toLocaleString('tr-TR')} TL matrah üzerinden indirimli vergi hesaplanmıştır.`;
  }

  return {
    annualGrossProfit,
    appliedExemptionAmount,
    taxableIncomeWithIncentive,
    standardIncomeTax,
    incentivizedIncomeTax,
    taxSavings,
    bagkurSavings,
    totalAnnualBenefit,
    standardNetIncome,
    incentivizedNetIncome,
    effectiveTaxRateWithIncentive,
    effectiveTaxRateStandard,
    monthlyAverageNetIncome,
    monthlyAverageSavings,
    evaluation: {
      title: evalTitle,
      description: evalDesc,
      exemptionUsagePercent,
    },
  };
}
