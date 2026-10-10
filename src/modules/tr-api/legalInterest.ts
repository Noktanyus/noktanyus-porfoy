/**
 * TCMB & Yasal Mevzuat Faiz Hesaplama Motoru
 *
 * 3095 Sayılı Kanuni Faiz ve Temerrüt Faizi Kanunu ile 6102 Sayılı Türk Ticaret Kanunu (TTK m.1530) uyarınca:
 * - Yasal Faiz (Kanuni Faiz - 3095 s.K. m.1)
 * - Ticari Temerrüt Faizi (TTK m.1530 uyarınca TCMB tarafından belirlenen oranlar)
 * - Tarihsel oran değişimlerine göre kademeli (dilimli) gün hesabı
 * - Kuruş hassasiyetinde toplam faiz ve bakiye dökümü
 */

export type InterestType = 'legal' | 'commercial_default' | 'custom';

export interface InterestRatePeriod {
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // null = günümüze kadar geçerli
  rate: number; // Yıllık oran (%)
  legalBasis: string; // Mevzuat dayanağı / Resmi Gazete
}

/**
 * 3095 Sayılı Kanun m.1 uyarınca Yasal (Kanuni) Faiz Oranları
 */
export const LEGAL_INTEREST_RATES: InterestRatePeriod[] = [
  {
    startDate: '2024-06-01',
    endDate: null,
    rate: 24.0,
    legalBasis: 'Cumhurbaşkanı Kararı (R.G. 21.05.2024 - 32552)',
  },
  {
    startDate: '2006-01-01',
    endDate: '2024-05-31',
    rate: 9.0,
    legalBasis: 'BKK 2005/9831 (R.G. 30.12.2005 - 26039)',
  },
  {
    startDate: '2005-05-01',
    endDate: '2005-12-31',
    rate: 12.0,
    legalBasis: 'BKK 2005/8762',
  },
  {
    startDate: '2004-07-01',
    endDate: '2005-04-30',
    rate: 38.0,
    legalBasis: 'BKK 2004/7508',
  },
];

/**
 * TTK m.1530 uyarınca Mal ve Hizmet Tedarikinde Uygulanan Ticari Temerrüt Faiz Oranları (TCMB)
 */
export const COMMERCIAL_DEFAULT_RATES: InterestRatePeriod[] = [
  {
    startDate: '2024-01-01',
    endDate: null,
    rate: 48.0,
    legalBasis: 'TCMB Tebliği (R.G. 02.01.2024 - 32417)',
  },
  {
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    rate: 15.75,
    legalBasis: 'TCMB Tebliği (R.G. 02.01.2023 - 32061)',
  },
  {
    startDate: '2022-01-01',
    endDate: '2022-12-31',
    rate: 9.75,
    legalBasis: 'TCMB Tebliği (R.G. 02.01.2022 - 31707)',
  },
  {
    startDate: '2021-01-01',
    endDate: '2021-12-31',
    rate: 18.25,
    legalBasis: 'TCMB Tebliği (R.G. 02.01.2021 - 31352)',
  },
  {
    startDate: '2020-01-01',
    endDate: '2020-12-31',
    rate: 13.75,
    legalBasis: 'TCMB Tebliği (R.G. 02.01.2020 - 30996)',
  },
  {
    startDate: '2019-01-01',
    endDate: '2019-12-31',
    rate: 21.25,
    legalBasis: 'TCMB Tebliği (R.G. 02.01.2019 - 30643)',
  },
];

export interface InterestPeriodBreakdown {
  periodStartDate: string;
  periodEndDate: string;
  days: number;
  annualRate: number;
  periodInterest: number;
  legalBasis: string;
}

export interface CalculateInterestInput {
  principal: number; // Anapara tutarı (TL)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  interestType?: InterestType; // varsayılan: 'commercial_default'
  customRate?: number; // interestType === 'custom' ise yıllık faiz oranı (%)
}

export interface CalculateInterestResult {
  principal: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  interestType: InterestType;
  interestTypeName: string;
  totalInterest: number;
  totalPayable: number;
  periods: InterestPeriodBreakdown[];
  summaryText: string;
}

/**
 * İki YYYY-MM-DD tarihi arasındaki gün sayısını hesaplar (ms farkından)
 */
function diffDays(startStr: string, endStr: string): number {
  const d1 = new Date(startStr + 'T00:00:00Z');
  const d2 = new Date(endStr + 'T00:00:00Z');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Tarihe göre gün ekleme (YYYY-MM-DD formatında)
 */
function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Kademeli yasal ve ticari faiz hesaplar
 */
export function calculateLegalInterest(input: CalculateInterestInput): CalculateInterestResult {
  const principal = Math.max(0, input.principal);
  const startDate = input.startDate;
  const endDate = input.endDate;
  const interestType = input.interestType ?? 'commercial_default';

  const totalDays = diffDays(startDate, endDate);

  const interestTypeName =
    interestType === 'commercial_default'
      ? 'Ticari Temerrüt Faizi (TTK m.1530 / TCMB)'
      : interestType === 'legal'
      ? 'Yasal Kanuni Faiz (3095 s.K. m.1)'
      : 'Özel Belirlenen Yıllık Faiz';

  if (totalDays <= 0 || principal <= 0) {
    return {
      principal,
      startDate,
      endDate,
      totalDays: 0,
      interestType,
      interestTypeName,
      totalInterest: 0,
      totalPayable: principal,
      periods: [],
      summaryText: `₺${principal.toFixed(2)} anapara için 0 gün faiz hesaplandı. Toplam: ₺${principal.toFixed(2)}`,
    };
  }

  const periods: InterestPeriodBreakdown[] = [];

  if (interestType === 'custom') {
    const rate = Math.max(0, input.customRate ?? 24);
    // Faiz = Anapara * Oran * Gün / 36500
    const rawInterest = (principal * rate * totalDays) / 36500;
    const periodInterest = Math.round(rawInterest * 100) / 100;

    periods.push({
      periodStartDate: startDate,
      periodEndDate: endDate,
      days: totalDays,
      annualRate: rate,
      periodInterest,
      legalBasis: `Özel Oran (%${rate})`,
    });
  } else {
    // Kademeli faiz oranları tablosu
    const rateTable = interestType === 'legal' ? LEGAL_INTEREST_RATES : COMMERCIAL_DEFAULT_RATES;

    // Tarih aralığını kesişen dilimlere böl
    for (const rule of rateTable) {
      const ruleStart = rule.startDate;
      const ruleEnd = rule.endDate ?? '2099-12-31';

      // Kesişim aralığı: max(startDate, ruleStart) - min(endDate, ruleEnd)
      const pStart = startDate > ruleStart ? startDate : ruleStart;
      const pEnd = endDate < ruleEnd ? endDate : ruleEnd;

      if (pStart < pEnd) {
        const days = diffDays(pStart, pEnd);
        if (days > 0) {
          const rawInt = (principal * rule.rate * days) / 36500;
          const periodInterest = Math.round(rawInt * 100) / 100;

          periods.push({
            periodStartDate: pStart,
            periodEndDate: pEnd,
            days,
            annualRate: rule.rate,
            periodInterest,
            legalBasis: rule.legalBasis,
          });
        }
      }
    }

    // Tarihe göre sırala
    periods.sort((a, b) => a.periodStartDate.localeCompare(b.periodStartDate));
  }

  // Toplam faiz tutarı
  const totalInterest = Math.round(periods.reduce((acc, p) => acc + p.periodInterest, 0) * 100) / 100;
  const totalPayable = Math.round((principal + totalInterest) * 100) / 100;

  const summaryText = `${startDate} - ${endDate} tarihleri arasında (${totalDays} gün), ₺${principal.toFixed(2)} anapara için toplam ₺${totalInterest.toFixed(2)} ${interestTypeName} tahakkuk etmiştir. Toplam Ödenecek: ₺${totalPayable.toFixed(2)}`;

  return {
    principal,
    startDate,
    endDate,
    totalDays,
    interestType,
    interestTypeName,
    totalInterest,
    totalPayable,
    periods,
    summaryText,
  };
}
