/**
 * @file Türkiye Yasal Kira Artış Oranı & TÜFE Tavanı Hesaplama Motoru (TBK m.344)
 * @description 6098 Sayılı Türk Borçlar Kanunu Madde 344 uyarınca konut ve çatılı işyerleri
 *              için TÜİK 12 aylık ortalama TÜFE tavan artış oranı ve işyeri stopaj/KDV dökümü.
 *              1 Temmuz 2024 itibarıyla %25 konut tavanı sona ermiş ve TÜFE ortalamasına dönülmüştür.
 */

export interface MonthlyTufeRate {
  year: number;
  month: number;
  monthName: string;
  twelveMonthAverageRate: number; // TÜİK 12 aylık ortalamalara göre değişim oranı (%)
}

/**
 * Resmi TÜİK 12 Aylık Ortalama TÜFE Oranları Arşivi (Kira Artış Tavanı)
 */
export const OFFICIAL_TUFE_RATES: MonthlyTufeRate[] = [
  { year: 2024, month: 1, monthName: 'Ocak 2024', twelveMonthAverageRate: 53.86 },
  { year: 2024, month: 2, monthName: 'Şubat 2024', twelveMonthAverageRate: 54.72 },
  { year: 2024, month: 3, monthName: 'Mart 2024', twelveMonthAverageRate: 55.91 },
  { year: 2024, month: 4, monthName: 'Nisan 2024', twelveMonthAverageRate: 59.64 },
  { year: 2024, month: 5, monthName: 'Mayıs 2024', twelveMonthAverageRate: 62.51 },
  { year: 2024, month: 6, monthName: 'Haziran 2024', twelveMonthAverageRate: 65.07 },
  { year: 2024, month: 7, monthName: 'Temmuz 2024', twelveMonthAverageRate: 65.93 },
  { year: 2024, month: 8, monthName: 'Ağustos 2024', twelveMonthAverageRate: 64.91 },
  { year: 2024, month: 9, monthName: 'Eylül 2024', twelveMonthAverageRate: 63.47 },
  { year: 2024, month: 10, monthName: 'Ekim 2024', twelveMonthAverageRate: 62.02 },
  { year: 2024, month: 11, monthName: 'Kasım 2024', twelveMonthAverageRate: 60.45 },
  { year: 2024, month: 12, monthName: 'Aralık 2024', twelveMonthAverageRate: 58.50 },
  { year: 2025, month: 1, monthName: 'Ocak 2025', twelveMonthAverageRate: 56.30 },
  { year: 2025, month: 2, monthName: 'Şubat 2025', twelveMonthAverageRate: 54.10 },
  { year: 2025, month: 3, monthName: 'Mart 2025', twelveMonthAverageRate: 52.40 },
];

export interface RentIncreaseInput {
  /** Mevcut Kira Tutarı (TL) */
  currentRent: number;
  /** Gayrimenkul Türü: 'residential' (Konut) | 'commercial' (İşyeri) */
  propertyType?: 'residential' | 'commercial';
  /** Yenileme Yılı (örn: 2024 veya 2025) */
  year?: number;
  /** Yenileme Ayı (1-12) */
  month?: number;
  /** Özel TÜFE Oranı (%) - Girilirse tablodaki oran yerine bu oran kullanılır */
  customTufeRate?: number;
  /** İşyeri ise vergi modu: 'none' | 'stopaj' (Stopaj %20) | 'vat' (KDV %20) */
  commercialTaxMode?: 'none' | 'stopaj' | 'vat';
}

export interface RentIncreaseResult {
  /** Mevcut Kira (TL) */
  currentRent: number;
  /** Uygulanan Yasal Tavan Artış Oranı (%) */
  appliedRatePercent: number;
  /** Kira Artış Tutarı (TL) */
  increaseAmount: number;
  /** Yeni Yasal Tavan Kira Bedeli (TL) */
  newRent: number;
  /** Gayrimenkul Türü */
  propertyType: 'residential' | 'commercial';
  /** İlgili Dönem / Ay Adı */
  periodName: string;
  /** Yasal Dayanak */
  legalBasis: string;

  /** İşyeri Vergi Dökümü (varsa) */
  commercialTaxBreakdown?: {
    mode: 'stopaj' | 'vat';
    netRent: number;
    taxAmount: number;
    grossTotal: number;
    explanation: string;
  };

  /** Yıllık Toplam Kira Yükü Karşılaştırması */
  annualComparison: {
    previousAnnualTotal: number;
    newAnnualTotal: number;
    annualIncreaseDifference: number;
  };
}

function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Belirtilen yıl ve aya ait TÜİK 12 aylık ortalama TÜFE oranını bulur
 */
export function getTufeRateForPeriod(year: number, month: number): MonthlyTufeRate | undefined {
  return OFFICIAL_TUFE_RATES.find((r) => r.year === year && r.month === month);
}

/**
 * TBK m.344 uyarınca yasal azami kira artışını hesaplar
 */
export function calculateRentIncrease(input: RentIncreaseInput): RentIncreaseResult {
  const currentRent = Math.max(0, input.currentRent);
  const propertyType = input.propertyType || 'residential';
  const year = input.year || 2024;
  const month = input.month || 10;
  const taxMode = input.commercialTaxMode || 'none';

  // Oranı belirle
  let appliedRatePercent = 0;
  let periodName = `${month}/${year}`;

  if (input.customTufeRate !== undefined && input.customTufeRate >= 0) {
    appliedRatePercent = roundTo2(input.customTufeRate);
    periodName = `Özel Belirlenen Oran (%${appliedRatePercent})`;
  } else {
    const periodData = getTufeRateForPeriod(year, month);
    if (periodData) {
      appliedRatePercent = periodData.twelveMonthAverageRate;
      periodName = periodData.monthName;
    } else {
      // Bulunamadıysa en son mevcut veriyi al
      const latest = OFFICIAL_TUFE_RATES[OFFICIAL_TUFE_RATES.length - 1];
      appliedRatePercent = latest.twelveMonthAverageRate;
      periodName = `${latest.monthName} (En Güncel)`;
    }
  }

  // Artış tutarı ve yeni kira hesabı
  const increaseAmount = roundTo2(currentRent * (appliedRatePercent / 100));
  const newRent = roundTo2(currentRent + increaseAmount);

  // Yıllık karşılaştırma
  const previousAnnualTotal = roundTo2(currentRent * 12);
  const newAnnualTotal = roundTo2(newRent * 12);
  const annualIncreaseDifference = roundTo2(newAnnualTotal - previousAnnualTotal);

  // İşyeri vergi dökümü
  let commercialTaxBreakdown: RentIncreaseResult['commercialTaxBreakdown'] = undefined;
  if (propertyType === 'commercial' && taxMode !== 'none') {
    if (taxMode === 'stopaj') {
      // Kiracı mülk sahibi adına %20 stopaj öder.
      // Net Kira = Brüt * 0.80 => Brüt Kira = Net Kira / 0.80
      const grossRent = roundTo2(newRent / 0.80);
      const stopajTax = roundTo2(grossRent - newRent);
      commercialTaxBreakdown = {
        mode: 'stopaj',
        netRent: newRent,
        taxAmount: stopajTax,
        grossTotal: grossRent,
        explanation: `İşyeri net kirası ${newRent.toLocaleString('tr-TR')} TL olup %20 stopaj kesintisi ile brüt tutar ${grossRent.toLocaleString('tr-TR')} TL'dir (Kiracının vergi dairesine ödeyeceği stopaj: ${stopajTax.toLocaleString('tr-TR')} TL).`,
      };
    } else if (taxMode === 'vat') {
      // Mülk sahibi tüzel kişi veya KDV mükellefi ise kiraya %20 KDV eklenir
      const vatAmount = roundTo2(newRent * 0.20);
      const grossTotal = roundTo2(newRent + vatAmount);
      commercialTaxBreakdown = {
        mode: 'vat',
        netRent: newRent,
        taxAmount: vatAmount,
        grossTotal: grossTotal,
        explanation: `Kira tutarına %20 KDV (${vatAmount.toLocaleString('tr-TR')} TL) eklenerek toplam fatura tutarı ${grossTotal.toLocaleString('tr-TR')} TL olmaktadır.`,
      };
    }
  }

  const legalBasis =
    '6098 sayılı Türk Borçlar Kanunu Madde 344 uyarınca kira artış tavanı, bir önceki kira yılının tüketici fiyat endeksindeki (TÜFE) on iki aylık ortalamalara göre değişim oranını geçemez. 01.07.2024 tarihi itibarıyla konutlardaki %25 sabit tavan kalkmıştır.';

  return {
    currentRent,
    appliedRatePercent,
    increaseAmount,
    newRent,
    propertyType,
    periodName,
    legalBasis,
    commercialTaxBreakdown,
    annualComparison: {
      previousAnnualTotal,
      newAnnualTotal,
      annualIncreaseDifference,
    },
  };
}
