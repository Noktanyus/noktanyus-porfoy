/**
 * @file Türkiye İcra Takibi Açılış Harç ve Masraf Motoru (İİK & Harçlar Kanunu)
 * @description 2004 sayılı İcra ve İflas Kanunu ve 492 sayılı Harçlar Kanunu (1) Sayılı Tarife
 *              uyarınca ilamlı ve ilamsız icra takiplerinde başvurma harcı, binde 5 peşin harç,
 *              vekalet harcı, baro pulu, tebligat ve dosya masrafları döküm motoru.
 */

export interface EnforcementFeeConstants {
  year: number;
  applicationFee: number; // Başvurma Harcı (TL)
  advanceFeeRatePercent: number; // Peşin Harç Oranı (%0.5 / Binde 5)
  powerOfAttorneyFee: number; // Vekalet Harcı (TL)
  barAssociationStampFee: number; // Baro Pulu (TL)
  standardPostalNoticeFee: number; // Fiziksel PTT Tebligat Gideri (TL)
  electronicNoticeFee: number; // Elektronik Tebligat (UETS) Gideri (TL)
  fileExpense: number; // Dosya ve Kırtasiye Masrafı (TL)
}

/**
 * Resmi Harçlar Kanunu Genel Tebliği Güncel İcra Harç ve Masraf Tarifesi (2024)
 */
export const OFFICIAL_ENFORCEMENT_FEES_2024: EnforcementFeeConstants = {
  year: 2024,
  applicationFee: 427.60,
  advanceFeeRatePercent: 0.50, // %0.5 (Binde 5)
  powerOfAttorneyFee: 60.80,
  barAssociationStampFee: 96.00,
  standardPostalNoticeFee: 200.00,
  electronicNoticeFee: 15.00,
  fileExpense: 35.00,
};

export type EnforcementType = 'without_judgment' | 'with_judgment'; // İlamsız Takip (Örnek 7) | İlamlı Takip (Örnek 4-5)
export type NoticeType = 'postal' | 'electronic'; // Standart PTT | UETS Elektronik

export interface EnforcementCostInput {
  /** Asıl Alacak Tutarı (TL) */
  claimAmount: number;
  /** Takip Türü: 'without_judgment' (İlamsız - Peşin Harç Alınır) | 'with_judgment' (İlamlı - Peşin Harç Yoktur) */
  enforcementType?: EnforcementType;
  /** Avukat Aracılığıyla mı Açılıyor? (Varsayılan: true - Vekalet harcı ve baro pulu dahil) */
  hasAttorney?: boolean;
  /** Borçlu Sayısı (Tebligat çarpanı, Varsayılan: 1) */
  debtorCount?: number;
  /** Tebligat Türü: 'postal' (Fiziksel PTT) | 'electronic' (UETS) */
  noticeType?: NoticeType;
  /** Özel Başvurma Harcı (İsteğe bağlı) */
  customApplicationFee?: number;
}

export interface FeeItemBreakdown {
  code: string;
  name: string;
  amount: number;
  isExempt: boolean;
  description: string;
}

export interface EnforcementCostResult {
  claimAmount: number;
  enforcementType: EnforcementType;
  enforcementTypeName: string;
  hasAttorney: boolean;
  debtorCount: number;
  noticeType: NoticeType;
  advanceFee: number; // Peşin Harç (TL)
  applicationFee: number; // Başvurma Harcı (TL)
  powerOfAttorneyFee: number; // Vekalet Harcı (TL)
  barStampFee: number; // Baro Pulu (TL)
  noticeTotalFee: number; // Toplam Tebligat Gideri (TL)
  fileExpense: number; // Dosya Masrafı (TL)
  totalOpeningCost: number; // Toplam Açılış Masrafı (TL)
  totalClaimWithCost: number; // Takip Çıkışı Tutarı (Alacak + Masraflar) (TL)
  feeItems: FeeItemBreakdown[];
  legalSummary: string;
}

function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * 2004 s. İİK ve 492 s. Harçlar Kanunu uyarınca icra takip açılış masraflarını hesaplar
 */
export function calculateEnforcementCost(input: EnforcementCostInput): EnforcementCostResult {
  const claimAmount = Math.max(0, input.claimAmount);
  const enforcementType = input.enforcementType ?? 'without_judgment';
  const hasAttorney = input.hasAttorney !== false;
  const debtorCount = Math.max(1, input.debtorCount ?? 1);
  const noticeType = input.noticeType ?? 'postal';

  const cfg = OFFICIAL_ENFORCEMENT_FEES_2024;

  // 1. Başvurma Harcı (Maktu)
  const applicationFee = input.customApplicationFee ?? cfg.applicationFee;

  // 2. Peşin Harç (İlamsız takiplerde binde 5; ilamlı takiplerde harçtan muaftır)
  let advanceFee = 0;
  let isAdvanceFeeExempt = false;
  if (enforcementType === 'with_judgment') {
    advanceFee = 0;
    isAdvanceFeeExempt = true;
  } else {
    advanceFee = roundTo2((claimAmount * cfg.advanceFeeRatePercent) / 100);
  }

  // 3. Vekalet Harcı & Baro Pulu
  const powerOfAttorneyFee = hasAttorney ? cfg.powerOfAttorneyFee : 0;
  const barStampFee = hasAttorney ? cfg.barAssociationStampFee : 0;

  // 4. Tebligat Masrafı (Borçlu sayısı x tebligat birim gideri)
  const noticeUnitPrice = noticeType === 'electronic' ? cfg.electronicNoticeFee : cfg.standardPostalNoticeFee;
  const noticeTotalFee = roundTo2(debtorCount * noticeUnitPrice);

  // 5. Dosya ve Kırtasiye Masrafı
  const fileExpense = cfg.fileExpense;

  const totalOpeningCost = roundTo2(
    applicationFee +
    advanceFee +
    powerOfAttorneyFee +
    barStampFee +
    noticeTotalFee +
    fileExpense
  );

  const totalClaimWithCost = roundTo2(claimAmount + totalOpeningCost);

  const feeItems: FeeItemBreakdown[] = [
    {
      code: 'BASVURMA_HARCI',
      name: 'Başvurma Harcı',
      amount: applicationFee,
      isExempt: false,
      description: '492 sayılı Harçlar Kanunu (1) sayılı Tarife maktu takip açılış harcı.',
    },
    {
      code: 'PESIN_HARC',
      name: 'Peşin Nispi Harç (%0.5)',
      amount: advanceFee,
      isExempt: isAdvanceFeeExempt,
      description: isAdvanceFeeExempt
        ? 'İlamlı takiplerde (mahkeme ilamı) peşin harç alınmaz.'
        : `Asıl alacağın binde 5'i oranında alınan peşin tahsil harcı teminatı.`,
    },
    {
      code: 'VEKALET_HARCI',
      name: 'Vekalet Harcı',
      amount: powerOfAttorneyFee,
      isExempt: !hasAttorney,
      description: hasAttorney ? 'Avukatla takip edilen dosyalarda maktu vekalet harcı.' : 'Avukatsız takipte muaftır.',
    },
    {
      code: 'BARO_PULU',
      name: 'Baro Pulu',
      amount: barStampFee,
      isExempt: !hasAttorney,
      description: hasAttorney ? '1136 s. Avukatlık Kanunu uyarınca zorunlu Türkiye Barolar Birliği pulu.' : 'Uygulanmaz.',
    },
    {
      code: 'TEBLIGAT_GIDERI',
      name: `Tebligat Masrafı (${debtorCount} Borçlu)`,
      amount: noticeTotalFee,
      isExempt: false,
      description: `${debtorCount} borçlu için ${noticeType === 'electronic' ? 'UETS elektronik' : 'fiziksel PTT'} ödeme emri tebligat gideri.`,
    },
    {
      code: 'DOSYA_KIRTASIYE',
      name: 'Dosya ve Masraf Avansı',
      amount: fileExpense,
      isExempt: false,
      description: 'İcra müdürlüğü karton dosya ve UYAP sistem kayıt masrafı.',
    },
  ];

  const enforcementTypeName =
    enforcementType === 'without_judgment'
      ? 'İlamsız İcra Takibi (Örnek No: 7)'
      : 'İlamlı İcra Takibi (Örnek No: 4-5)';

  const legalSummary =
    `${claimAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL tutarındaki alacak için ` +
    `${enforcementTypeName} kapsamında açılışta peşin yatırılması gereken toplam harç ve masraf ` +
    `${totalOpeningCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL olarak hesaplanmıştır. ` +
    `İcra ödeme emri düzenlendiğinde takip çıkışı tutarı (alacak + peşin masraflar) ` +
    `${totalClaimWithCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL olacaktır.`;

  return {
    claimAmount,
    enforcementType,
    enforcementTypeName,
    hasAttorney,
    debtorCount,
    noticeType,
    advanceFee,
    applicationFee,
    powerOfAttorneyFee,
    barStampFee,
    noticeTotalFee,
    fileExpense,
    totalOpeningCost,
    totalClaimWithCost,
    feeItems,
    legalSummary,
  };
}
