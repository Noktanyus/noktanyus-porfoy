/**
 * @file checkDiscount.ts
 * @description Türkiye Çek & Senet Reeskont Faiz Hesaplama ve Ortalama Vade Motoru.
 *
 * Yasal Dayanaklar:
 * 1. 213 sayılı Vergi Usul Kanunu (VUK) m.281 & m.285:
 *    - Vadesi gelmemiş olan senede bağlı alacaklar ve borçlar değerleme gününün kıymetine irca olunabilir (reeskont).
 * 2. VUK 238 Sıra No'lu Genel Tebliği:
 *    - Reeskont uygulamasında "İç İskonto" yöntemi kullanılması zorunludur.
 *    - İç İskonto Formülü: F = (A * n * t) / (36000 + (n * t))
 *      A: Senedin nominal tutarı
 *      n: Değerleme günü ile vade tarihi arasındaki gün sayısı
 *      t: TCMB tarafından yayımlanan yıllık reeskont faiz oranı
 * 3. TCMB Reeskont ve Avans Faiz Oranları (Resmi Gazete):
 *    - Reeskont İskonto Oranı: %48,75
 *    - Avans Faiz Oranı: %49,75
 * 4. Tekdüzen Hesap Planı (THP):
 *    - 122 Alacak Senetleri Reeskontu / 652 Reeskont Faiz Giderleri
 *    - 322 Borç Senetleri Reeskontu / 642 Reeskont Faiz Gelirleri
 */

export interface TcmbReeskontRateInfo {
  code: string;
  label: string;
  discountRate: number; // Reeskont İskonto Faizi (%)
  advanceRate: number; // Avans Faizi (%)
  officialGazetteDate: string;
}

export const TCMB_REESKONT_RATES: TcmbReeskontRateInfo[] = [
  {
    code: '2024_CURRENT',
    label: 'TCMB 2024 Güncel (R.G. 2024)',
    discountRate: 48.75,
    advanceRate: 49.75,
    officialGazetteDate: '2024-04-01',
  },
  {
    code: '2023_DECEMBER',
    label: 'TCMB Aralık 2023',
    discountRate: 40.75,
    advanceRate: 41.75,
    officialGazetteDate: '2023-12-23',
  },
  {
    code: '2023_SEPTEMBER',
    label: 'TCMB Eylül 2023',
    discountRate: 34.25,
    advanceRate: 35.25,
    officialGazetteDate: '2023-09-28',
  },
];

export interface CheckItemInput {
  id?: string;
  description?: string;
  nominalAmount: number;
  dueDate: string; // YYYY-MM-DD
  itemType?: 'receivable' | 'payable'; // alacak senedi veya borç senedi
}

export interface CheckDiscountInput {
  valuationDate?: string; // YYYY-MM-DD (varsayılan bugün)
  rateOption?: 'discount' | 'advance' | 'custom';
  customAnnualRate?: number;
  selectedPresetCode?: string;
  method?: 'internal' | 'external'; // internal: VUK zorunlu iç iskonto, external: ticari dış iskonto
  items: CheckItemInput[];
}

export interface CalculatedCheckItem {
  id: string;
  description: string;
  nominalAmount: number;
  dueDate: string;
  daysToMaturity: number;
  discountAmount: number;
  netPresentValue: number;
  itemType: 'receivable' | 'payable';
}

export interface AccountingEntry {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface CheckDiscountResult {
  valuationDate: string;
  appliedAnnualRate: number;
  rateTypeDescription: string;
  method: 'internal' | 'external';
  methodName: string;
  totalNominalAmount: number;
  totalDiscountAmount: number;
  totalNetPresentValue: number;
  weightedAverageDays: number;
  weightedAverageDueDate: string;
  itemCount: number;
  items: CalculatedCheckItem[];
  accountingEntries: AccountingEntry[];
}

function parseIsoDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDaysBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function calculateCheckDiscount(input: CheckDiscountInput): CheckDiscountResult {
  const todayIso = formatIsoDate(new Date());
  const valuationDateStr = input.valuationDate || todayIso;
  const valuationDate = parseIsoDate(valuationDateStr);

  const preset = TCMB_REESKONT_RATES.find((r) => r.code === input.selectedPresetCode) || TCMB_REESKONT_RATES[0];
  const rateOption = input.rateOption || 'discount';

  let appliedRate = preset.discountRate;
  let rateTypeDesc = `${preset.label} - Reeskont İskonto Oranı (%${preset.discountRate})`;

  if (rateOption === 'advance') {
    appliedRate = preset.advanceRate;
    rateTypeDesc = `${preset.label} - Avans Faiz Oranı (%${preset.advanceRate})`;
  } else if (rateOption === 'custom' && typeof input.customAnnualRate === 'number' && input.customAnnualRate >= 0) {
    appliedRate = input.customAnnualRate;
    rateTypeDesc = `Özel Faiz Oranı (%${appliedRate})`;
  }

  const method = input.method || 'internal';
  const methodName = method === 'internal' ? 'İç İskonto (213 s. VUK Zorunlu Yöntem)' : 'Dış İskonto (Ticari Yöntem)';

  const calculatedItems: CalculatedCheckItem[] = [];
  let totalNominal = 0;
  let totalDiscount = 0;
  let totalNetPresent = 0;
  let weightedDaysSum = 0;

  let totalReceivableDiscount = 0;
  let totalPayableDiscount = 0;

  const rawItems = input.items && input.items.length > 0 ? input.items : [];

  rawItems.forEach((item, index) => {
    const nominal = Math.max(0, Number(item.nominalAmount) || 0);
    const dueDateStr = item.dueDate || valuationDateStr;
    const dueDate = parseIsoDate(dueDateStr);
    const days = Math.max(0, getDaysBetween(valuationDate, dueDate));
    const itemType = item.itemType || 'receivable';

    let discount = 0;
    if (days > 0 && appliedRate > 0 && nominal > 0) {
      if (method === 'internal') {
        // VUK İç İskonto: F = (A * n * t) / (36000 + (n * t))
        discount = (nominal * days * appliedRate) / (36000 + days * appliedRate);
      } else {
        // Dış İskonto: F = (A * n * t) / 36000
        discount = (nominal * days * appliedRate) / 36000;
      }
    }

    discount = Math.round(discount * 100) / 100;
    const npv = Math.round((nominal - discount) * 100) / 100;

    totalNominal += nominal;
    totalDiscount += discount;
    totalNetPresent += npv;
    weightedDaysSum += nominal * days;

    if (itemType === 'receivable') {
      totalReceivableDiscount += discount;
    } else {
      totalPayableDiscount += discount;
    }

    calculatedItems.push({
      id: item.id || `item_${index + 1}`,
      description: item.description || `Senet / Çek #${index + 1}`,
      nominalAmount: nominal,
      dueDate: dueDateStr,
      daysToMaturity: days,
      discountAmount: discount,
      netPresentValue: npv,
      itemType,
    });
  });

  const weightedDays = totalNominal > 0 ? Math.round((weightedDaysSum / totalNominal) * 10) / 10 : 0;
  const avgDueDate = new Date(valuationDate.getTime() + Math.round(weightedDays) * 24 * 60 * 60 * 1000);
  const weightedAverageDueDate = formatIsoDate(avgDueDate);

  totalNominal = Math.round(totalNominal * 100) / 100;
  totalDiscount = Math.round(totalDiscount * 100) / 100;
  totalNetPresent = Math.round(totalNetPresent * 100) / 100;

  // Generate standard THP (Tekdüzen Hesap Planı) Accounting Entries
  const accountingEntries: AccountingEntry[] = [];
  if (totalReceivableDiscount > 0) {
    accountingEntries.push({
      accountCode: '652',
      accountName: 'Reeskont Faiz Giderleri',
      debit: Math.round(totalReceivableDiscount * 100) / 100,
      credit: 0,
    });
    accountingEntries.push({
      accountCode: '122',
      accountName: 'Alacak Senetleri Reeskontu (-)',
      debit: 0,
      credit: Math.round(totalReceivableDiscount * 100) / 100,
    });
  }

  if (totalPayableDiscount > 0) {
    accountingEntries.push({
      accountCode: '322',
      accountName: 'Borç Senetleri Reeskontu (-)',
      debit: Math.round(totalPayableDiscount * 100) / 100,
      credit: 0,
    });
    accountingEntries.push({
      accountCode: '642',
      accountName: 'Reeskont Faiz Gelirleri',
      debit: 0,
      credit: Math.round(totalPayableDiscount * 100) / 100,
    });
  }

  return {
    valuationDate: valuationDateStr,
    appliedAnnualRate: appliedRate,
    rateTypeDescription: rateTypeDesc,
    method,
    methodName,
    totalNominalAmount: totalNominal,
    totalDiscountAmount: totalDiscount,
    totalNetPresentValue: totalNetPresent,
    weightedAverageDays: weightedDays,
    weightedAverageDueDate,
    itemCount: calculatedItems.length,
    items: calculatedItems,
    accountingEntries,
  };
}
