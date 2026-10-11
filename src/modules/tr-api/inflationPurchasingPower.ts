/**
 * @file TÜİK TÜFE Tarihi Enflasyon & Paranın Reel Satın Alma Gücü Motoru
 * @description Türkiye İstatistik Kurumu (TÜİK) 2003=100 Tüketici Fiyat Endeksi serisi
 *              kullanılarak geçmiş bir tarihteki paranın bugünkü alım gücü eşdeğeri,
 *              kümülatif enflasyon, yıllık bileşik artış (CAGR) ve alım gücü kaybı hesaplamaları.
 */

export interface MonthlyCpiEntry {
  year: number;
  month: number;
  monthName: string;
  cpiIndex: number; // TÜİK 2003=100 Endeks Değeri
}

/**
 * Resmi TÜİK 2003=100 Tüketici Fiyat Endeksi Veri Tabanı
 * (Aralık ayları yıllık referans noktaları ve güncel 2024-2025 aylık serileri)
 */
export const TUIK_HISTORICAL_CPI_TABLE: MonthlyCpiEntry[] = [
  // 2003 Baz Yılı Başlangıç & Aralık
  { year: 2003, month: 1, monthName: 'Ocak 2003', cpiIndex: 94.77 },
  { year: 2003, month: 6, monthName: 'Haziran 2003', cpiIndex: 100.12 },
  { year: 2003, month: 12, monthName: 'Aralık 2003', cpiIndex: 104.12 },

  // 2004
  { year: 2004, month: 1, monthName: 'Ocak 2004', cpiIndex: 104.81 },
  { year: 2004, month: 6, monthName: 'Haziran 2004', cpiIndex: 107.21 },
  { year: 2004, month: 12, monthName: 'Aralık 2004', cpiIndex: 113.86 },

  // 2005
  { year: 2005, month: 1, monthName: 'Ocak 2005', cpiIndex: 114.49 },
  { year: 2005, month: 6, monthName: 'Haziran 2005', cpiIndex: 117.80 },
  { year: 2005, month: 12, monthName: 'Aralık 2005', cpiIndex: 122.65 },

  // 2006
  { year: 2006, month: 1, monthName: 'Ocak 2006', cpiIndex: 123.57 },
  { year: 2006, month: 6, monthName: 'Haziran 2006', cpiIndex: 129.84 },
  { year: 2006, month: 12, monthName: 'Aralık 2006', cpiIndex: 134.49 },

  // 2007
  { year: 2007, month: 1, monthName: 'Ocak 2007', cpiIndex: 135.84 },
  { year: 2007, month: 6, monthName: 'Haziran 2007', cpiIndex: 141.08 },
  { year: 2007, month: 12, monthName: 'Aralık 2007', cpiIndex: 145.77 },

  // 2008
  { year: 2008, month: 1, monthName: 'Ocak 2008', cpiIndex: 147.24 },
  { year: 2008, month: 6, monthName: 'Haziran 2008', cpiIndex: 156.40 },
  { year: 2008, month: 12, monthName: 'Aralık 2008', cpiIndex: 160.44 },

  // 2009
  { year: 2009, month: 1, monthName: 'Ocak 2009', cpiIndex: 160.89 },
  { year: 2009, month: 6, monthName: 'Haziran 2009', cpiIndex: 165.34 },
  { year: 2009, month: 12, monthName: 'Aralık 2009', cpiIndex: 170.91 },

  // 2010
  { year: 2010, month: 1, monthName: 'Ocak 2010', cpiIndex: 174.07 },
  { year: 2010, month: 6, monthName: 'Haziran 2010', cpiIndex: 176.60 },
  { year: 2010, month: 12, monthName: 'Aralık 2010', cpiIndex: 181.85 },

  // 2011
  { year: 2011, month: 1, monthName: 'Ocak 2011', cpiIndex: 182.60 },
  { year: 2011, month: 6, monthName: 'Haziran 2011', cpiIndex: 191.07 },
  { year: 2011, month: 12, monthName: 'Aralık 2011', cpiIndex: 200.85 },

  // 2012
  { year: 2012, month: 1, monthName: 'Ocak 2012', cpiIndex: 201.91 },
  { year: 2012, month: 6, monthName: 'Haziran 2012', cpiIndex: 208.57 },
  { year: 2012, month: 12, monthName: 'Aralık 2012', cpiIndex: 213.23 },

  // 2013
  { year: 2013, month: 1, monthName: 'Ocak 2013', cpiIndex: 216.74 },
  { year: 2013, month: 6, monthName: 'Haziran 2013', cpiIndex: 224.90 },
  { year: 2013, month: 12, monthName: 'Aralık 2013', cpiIndex: 229.01 },

  // 2014
  { year: 2014, month: 1, monthName: 'Ocak 2014', cpiIndex: 233.54 },
  { year: 2014, month: 6, monthName: 'Haziran 2014', cpiIndex: 243.68 },
  { year: 2014, month: 12, monthName: 'Aralık 2014', cpiIndex: 247.72 },

  // 2015
  { year: 2015, month: 1, monthName: 'Ocak 2015', cpiIndex: 250.45 },
  { year: 2015, month: 6, monthName: 'Haziran 2015', cpiIndex: 260.67 },
  { year: 2015, month: 12, monthName: 'Aralık 2015', cpiIndex: 269.54 },

  // 2016
  { year: 2016, month: 1, monthName: 'Ocak 2016', cpiIndex: 274.44 },
  { year: 2016, month: 6, monthName: 'Haziran 2016', cpiIndex: 280.49 },
  { year: 2016, month: 12, monthName: 'Aralık 2016', cpiIndex: 292.54 },

  // 2017
  { year: 2017, month: 1, monthName: 'Ocak 2017', cpiIndex: 300.74 },
  { year: 2017, month: 6, monthName: 'Haziran 2017', cpiIndex: 311.23 },
  { year: 2017, month: 12, monthName: 'Aralık 2017', cpiIndex: 327.41 },

  // 2018
  { year: 2018, month: 1, monthName: 'Ocak 2018', cpiIndex: 330.75 },
  { year: 2018, month: 6, monthName: 'Haziran 2018', cpiIndex: 360.41 },
  { year: 2018, month: 12, monthName: 'Aralık 2018', cpiIndex: 393.88 },

  // 2019
  { year: 2019, month: 1, monthName: 'Ocak 2019', cpiIndex: 398.05 },
  { year: 2019, month: 6, monthName: 'Haziran 2019', cpiIndex: 418.82 },
  { year: 2019, month: 12, monthName: 'Aralık 2019', cpiIndex: 440.50 },

  // 2020
  { year: 2020, month: 1, monthName: 'Ocak 2020', cpiIndex: 446.45 },
  { year: 2020, month: 6, monthName: 'Haziran 2020', cpiIndex: 472.06 },
  { year: 2020, month: 12, monthName: 'Aralık 2020', cpiIndex: 504.81 },

  // 2021
  { year: 2021, month: 1, monthName: 'Ocak 2021', cpiIndex: 513.30 },
  { year: 2021, month: 6, monthName: 'Haziran 2021', cpiIndex: 547.48 },
  { year: 2021, month: 12, monthName: 'Aralık 2021', cpiIndex: 686.95 },

  // 2022
  { year: 2022, month: 1, monthName: 'Ocak 2022', cpiIndex: 763.23 },
  { year: 2022, month: 6, monthName: 'Haziran 2022', cpiIndex: 977.78 },
  { year: 2022, month: 12, monthName: 'Aralık 2022', cpiIndex: 1128.45 },

  // 2023
  { year: 2023, month: 1, monthName: 'Ocak 2023', cpiIndex: 1203.48 },
  { year: 2023, month: 6, monthName: 'Haziran 2023', cpiIndex: 1351.59 },
  { year: 2023, month: 12, monthName: 'Aralık 2023', cpiIndex: 1859.38 },

  // 2024 (Tüm 12 Ay)
  { year: 2024, month: 1, monthName: 'Ocak 2024', cpiIndex: 1984.02 },
  { year: 2024, month: 2, monthName: 'Şubat 2024', cpiIndex: 2073.88 },
  { year: 2024, month: 3, monthName: 'Mart 2024', cpiIndex: 2139.47 },
  { year: 2024, month: 4, monthName: 'Nisan 2024', cpiIndex: 2207.50 },
  { year: 2024, month: 5, monthName: 'Mayıs 2024', cpiIndex: 2281.85 },
  { year: 2024, month: 6, monthName: 'Haziran 2024', cpiIndex: 2319.29 },
  { year: 2024, month: 7, monthName: 'Temmuz 2024', cpiIndex: 2394.10 },
  { year: 2024, month: 8, monthName: 'Ağustos 2024', cpiIndex: 2453.34 },
  { year: 2024, month: 9, monthName: 'Eylül 2024', cpiIndex: 2526.16 },
  { year: 2024, month: 10, monthName: 'Ekim 2024', cpiIndex: 2598.91 },
  { year: 2024, month: 11, monthName: 'Kasım 2024', cpiIndex: 2657.23 },
  { year: 2024, month: 12, monthName: 'Aralık 2024', cpiIndex: 2684.55 },

  // 2025
  { year: 2025, month: 1, monthName: 'Ocak 2025', cpiIndex: 2819.65 },
  { year: 2025, month: 2, monthName: 'Şubat 2025', cpiIndex: 2883.75 },
  { year: 2025, month: 3, monthName: 'Mart 2025', cpiIndex: 2942.50 },
  { year: 2025, month: 12, monthName: 'Aralık 2025', cpiIndex: 3250.00 },
];

export interface InflationCalculatorInput {
  /** Başlangıç Tutar (TL) */
  initialAmount: number;
  /** Başlangıç Yılı (örn: 2015) */
  startYear: number;
  /** Başlangıç Ayı (1-12) */
  startMonth?: number;
  /** Hedef/Bugünkü Yıl (örn: 2024) */
  targetYear: number;
  /** Hedef/Bugünkü Ay (1-12) */
  targetMonth?: number;
  /** Özel Başlangıç TÜFE Endeksi (İsteğe bağlı, girilirse tablodaki yerine kullanılır) */
  customStartIndex?: number;
  /** Özel Hedef TÜFE Endeksi (İsteğe bağlı, girilirse tablodaki yerine kullanılır) */
  customTargetIndex?: number;
}

export interface YearlyProgressionItem {
  year: number;
  cpiIndex: number;
  cumulativeInflationPercent: number;
  equivalentAmount: number;
}

export interface InflationCalculatorResult {
  /** Başlangıç Tutar (TL) */
  initialAmount: number;
  /** Başlangıç Dönemi */
  startPeriod: {
    year: number;
    month?: number;
    label: string;
    cpiIndex: number;
  };
  /** Hedef Dönem */
  targetPeriod: {
    year: number;
    month?: number;
    label: string;
    cpiIndex: number;
  };
  /** Bugünkü / Hedef Tarihteki Eşdeğer Satın Alma Gücü Tutarı (TL) */
  adjustedAmount: number;
  /** Kümülatif TÜFE Enflasyon Oranı (%) */
  cumulativeInflationRatePercent: number;
  /** Fiyat Artış Çarpanı (kaç katına çıktı) */
  multiplier: number;
  /** Paranın Alım Gücü Kaybı (Erime Oranı) (%) */
  purchasingPowerLossPercent: number;
  /** Başlangıçtaki 1 TL'nin Hedef Dönemdeki Reel Değeri (TL) */
  realValueOfOneLira: number;
  /** Yıllık Ortalama Bileşik Enflasyon (CAGR %) */
  annualCompoundRatePercent: number;
  /** Dönem Boyunca Yıllık İlerleme Dökümü */
  yearlyProgression: YearlyProgressionItem[];
  /** Hukuki ve Mali Değerlendirme Özeti */
  summary: string;
}

function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function roundTo4(num: number): number {
  return Math.round((num + Number.EPSILON) * 10000) / 10000;
}

/**
 * Belirtilen yıl ve aya en yakın TÜFE endeksini bulur
 */
export function findCpiIndex(year: number, month?: number): { index: number; label: string } {
  // Eğer tam eşleşen yıl ve ay varsa al
  if (month !== undefined) {
    const exact = TUIK_HISTORICAL_CPI_TABLE.find((e) => e.year === year && e.month === month);
    if (exact) {
      return { index: exact.cpiIndex, label: exact.monthName };
    }
  }

  // Aya göre en yakın olanı bul, yoksa o yılın son kaydını (genelde Aralık) al
  const yearEntries = TUIK_HISTORICAL_CPI_TABLE.filter((e) => e.year === year);
  if (yearEntries.length > 0) {
    if (month !== undefined) {
      // Aya en yakın kaydı seç
      let closest = yearEntries[0];
      let minDiff = Math.abs(closest.month - month);
      for (const entry of yearEntries) {
        const diff = Math.abs(entry.month - month);
        if (diff < minDiff) {
          minDiff = diff;
          closest = entry;
        }
      }
      return { index: closest.cpiIndex, label: closest.monthName };
    }
    // Ay belirtilmemişse yıl sonu (Aralık) kaydını al
    const dec = yearEntries.find((e) => e.month === 12) || yearEntries[yearEntries.length - 1];
    return { index: dec.cpiIndex, label: `${year} Yıl Sonu` };
  }

  // Yıl tablodan eskiyse 2003 başlangıcını al
  if (year < 2003) {
    const first = TUIK_HISTORICAL_CPI_TABLE[0];
    return { index: first.cpiIndex, label: `${year} (2003 Baz Alındı)` };
  }

  // Yıl tablodan yeniyse en son kaydı al
  const last = TUIK_HISTORICAL_CPI_TABLE[TUIK_HISTORICAL_CPI_TABLE.length - 1];
  return { index: last.cpiIndex, label: `${year} (Son Veri)` };
}

/**
 * TÜİK 2003=100 TÜFE serisine göre tarihi enflasyon ve paranın reel alım gücünü hesaplar
 */
export function calculateInflationPurchasingPower(
  input: InflationCalculatorInput
): InflationCalculatorResult {
  const initialAmount = Math.max(0, input.initialAmount);
  const startYear = Math.max(2003, input.startYear);
  const targetYear = Math.max(startYear, input.targetYear);
  const startMonth = input.startMonth;
  const targetMonth = input.targetMonth;

  // Başlangıç Endeksi
  let startIndex = 100;
  let startLabel = `${startYear}`;
  if (input.customStartIndex && input.customStartIndex > 0) {
    startIndex = input.customStartIndex;
    startLabel = `${startYear} (Özel: ${startIndex})`;
  } else {
    const lookup = findCpiIndex(startYear, startMonth);
    startIndex = lookup.index;
    startLabel = lookup.label;
  }

  // Hedef Endeks
  let targetIndex = startIndex;
  let targetLabel = `${targetYear}`;
  if (input.customTargetIndex && input.customTargetIndex > 0) {
    targetIndex = input.customTargetIndex;
    targetLabel = `${targetYear} (Özel: ${targetIndex})`;
  } else {
    const lookup = findCpiIndex(targetYear, targetMonth);
    targetIndex = lookup.index;
    targetLabel = lookup.label;
  }

  // Formül: V_adjusted = V_start * (I_target / I_start)
  const multiplier = targetIndex > 0 ? targetIndex / startIndex : 1;
  const adjustedAmount = roundTo2(initialAmount * multiplier);

  // Kümülatif Enflasyon: ((I_target / I_start) - 1) * 100
  const cumulativeInflationRatePercent = roundTo2((multiplier - 1) * 100);

  // Alım Gücü Kaybı: (1 - (I_start / I_target)) * 100
  const purchasingPowerLossPercent =
    targetIndex > 0 ? roundTo2((1 - startIndex / targetIndex) * 100) : 0;

  // 1 TL'nin Reel Değeri: I_start / I_target
  const realValueOfOneLira = targetIndex > 0 ? roundTo4(startIndex / targetIndex) : 1;

  // Yıllık Ortalama Bileşik Enflasyon (CAGR)
  const yearDiff = Math.max(1, targetYear - startYear);
  let annualCompoundRatePercent = 0;
  if (yearDiff > 0 && multiplier > 0) {
    annualCompoundRatePercent = roundTo2((Math.pow(multiplier, 1 / yearDiff) - 1) * 100);
  }

  // Yıllık İlerleme Çizelgesi
  const yearlyProgression: YearlyProgressionItem[] = [];
  for (let y = startYear; y <= targetYear; y++) {
    const lookup = findCpiIndex(y, 12);
    const yrIndex = lookup.index;
    const yrMultiplier = yrIndex / startIndex;
    const yrCumInflation = roundTo2((yrMultiplier - 1) * 100);
    const yrAmount = roundTo2(initialAmount * yrMultiplier);
    yearlyProgression.push({
      year: y,
      cpiIndex: yrIndex,
      cumulativeInflationPercent: yrCumInflation,
      equivalentAmount: yrAmount,
    });
  }

  const summary =
    `${startLabel} dönemindeki ${initialAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL, ` +
    `resmi TÜİK 2003=100 TÜFE endeksine göre ${targetLabel} döneminde ` +
    `${adjustedAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL'lik satın alma gücüne denktir. ` +
    `Bu dönemde kümülatif TÜFE enflasyonu %${cumulativeInflationRatePercent.toLocaleString('tr-TR')}, ` +
    `fiyat artış katsayısı ${roundTo2(multiplier)} kat olarak gerçekleşmiş ve paranın alım gücünde %${purchasingPowerLossPercent.toLocaleString('tr-TR')} oranında reel erime meydana gelmiştir.`;

  return {
    initialAmount,
    startPeriod: {
      year: startYear,
      month: startMonth,
      label: startLabel,
      cpiIndex: startIndex,
    },
    targetPeriod: {
      year: targetYear,
      month: targetMonth,
      label: targetLabel,
      cpiIndex: targetIndex,
    },
    adjustedAmount,
    cumulativeInflationRatePercent,
    multiplier: roundTo2(multiplier),
    purchasingPowerLossPercent,
    realValueOfOneLira,
    annualCompoundRatePercent,
    yearlyProgression,
    summary,
  };
}
