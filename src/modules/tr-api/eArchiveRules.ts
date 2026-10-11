/**
 * @file GİB E-Arşiv Fatura Düzenleme Zorunluluk Limiti & KDV İstisna Kodları Rehberi
 * @description 509 Sıra No'lu VUK Genel Tebliği uyarınca e-Arşiv fatura kesme zorunluluk limitleri
 *              (Vergi mükelleflerine 5.000 TL, nihai tüketicilere 3.000 TL güncel sınır)
 *              ve e-Fatura / e-Arşiv UBL-TR KDV istisna/muafiyet kodları kataloğu.
 */

export interface EArchiveThresholdInput {
  /** Toplam Fatura Tutarı (KDV ve diğer vergiler dahil, TL) */
  totalAmountIncludingVat: number;
  /** Alıcı Türü: 'taxpayer' (Vergi Mükellefi / Şirket) | 'consumer' (Nihai Tüketici / Bireysel) */
  recipientType: 'taxpayer' | 'consumer';
  /** Aynı Gün İçinde Aynı Kişiye Kesilen Diğer Faturaların Toplamı (TL) */
  sameDayPreviousInvoicesTotal?: number;
}

export interface EArchiveThresholdResult {
  /** Toplam Değerlendirilen Günlük Tutar (TL) */
  evaluatedTotalAmount: number;
  /** Uygulanan Yasal Limit (TL) (Vergi mükellefine 5.000 TL, tüketiciye 3.000 TL) */
  thresholdLimit: number;
  /** e-Arşiv Portal Üzerinden Düzenleme Zorunlu Mu? */
  isEArchiveMandatory: boolean;
  /** Kalan Güvenli Limit (TL) (Zorunluluk sınırına ne kadar kaldı) */
  remainingLimit: number;
  /** Fatura Kesim Modu Tavsiyesi */
  recommendedInvoiceType: 'e_archive_portal' | 'paper_or_e_archive';
  /** Hukuki Risk ve Yaptırım Açıklaması */
  legalNotice: {
    status: 'mandatory' | 'optional';
    title: string;
    description: string;
    penaltyWarning: string;
  };
}

export interface VatExemptionCode {
  /** GİB Resmi İstisna Kodu (örn: "301") */
  code: string;
  /** İstisna Başlığı */
  title: string;
  /** KDV Kanunu Madde Dayanağı */
  legalArticle: string;
  /** Kategori: 'tam_istisna' | 'kismi_istisna' | 'diger' */
  category: 'tam_istisna' | 'kismi_istisna' | 'diger';
  /** Açıklama ve Uygulama Alanı */
  description: string;
  /** UBL-TR XML TaxExemptionReasonCode etiketi */
  ublCode: string;
}

/**
 * Resmi GİB Güncel Limitleri (VUK 509 Sıra No'lu Tebliğ)
 */
export const OFFICIAL_THRESHOLDS = {
  taxpayerLimit: 5000,  // Vergi mükelleflerine düzenlenen faturalarda sınır
  consumerLimit: 3000,  // Vergi mükellefi olmayanlara düzenlenen faturalarda sınır (Güncellenen sınır)
} as const;

/**
 * En Çok Kullanılan GİB KDV İstisna Kodları Kataloğu
 */
export const VAT_EXEMPTION_CODES: VatExemptionCode[] = [
  {
    code: '301',
    title: 'Mal İhracatı',
    legalArticle: 'KDVK m.11/1-a',
    category: 'tam_istisna',
    description: 'Yurt dışındaki bir müşteriye yapılan fiziki mal ihracatı teslimleri.',
    ublCode: '301',
  },
  {
    code: '302',
    title: 'Hizmet İhracatı',
    legalArticle: 'KDVK m.11/1-a',
    category: 'tam_istisna',
    description: 'Yurt dışındaki müşteriler için yapılan ve yurt dışında faydalanılan yazılım, danışmanlık, tasarım vb. hizmetler.',
    ublCode: '302',
  },
  {
    code: '303',
    title: 'Roaming Hizmetleri',
    legalArticle: 'KDVK m.11/1-a',
    category: 'tam_istisna',
    description: 'Türkiye ile yabancı ülkeler arasında uluslararası roaming çerçevesinde verilen hizmetler.',
    ublCode: '303',
  },
  {
    code: '305',
    title: 'Yolcu Beraberi Eşya İhracatı (Tax Free)',
    legalArticle: 'KDVK m.11/1-b',
    category: 'tam_istisna',
    description: 'Türkiye’de ikamet etmeyen yolcuların satın alarak yurt dışına götürdüğü eşyalar.',
    ublCode: '305',
  },
  {
    code: '308',
    title: 'Serbest Bölgelerdeki Müşteriler İçin Yapılan Fason Hizmetler',
    legalArticle: 'KDVK m.11/1-c',
    category: 'tam_istisna',
    description: 'Serbest bölgelerde faaliyet gösteren alıcılara verilen fason hizmet teslimleri.',
    ublCode: '308',
  },
  {
    code: '311',
    title: 'Deniz, Hava ve Demiryolu Taşıma Araçlarının İmal ve Teslimi',
    legalArticle: 'KDVK m.13/a',
    category: 'tam_istisna',
    description: 'Faaliyetleri kısmen veya tamamen deniz, hava ve demiryolu taşıma araçlarının kiralanması veya işletilmesi olanlara yapılan teslimler.',
    ublCode: '311',
  },
  {
    code: '316',
    title: 'Yatırım Teşvik Belgesi Kapsamında Makine ve Teçhizat Teslimi',
    legalArticle: 'KDVK m.13/d',
    category: 'tam_istisna',
    description: 'Yatırım teşvik belgesine sahip mükelleflere belge kapsamındaki makine ve teçhizat teslimleri.',
    ublCode: '316',
  },
  {
    code: '321',
    title: 'Teknoloji Geliştirme Bölgesinde (Teknokent) Üretilen Yazılım Teslimi',
    legalArticle: 'Geçici m.20/1',
    category: 'tam_istisna',
    description: 'Teknokent ve Ar-Ge bölgelerinde faaliyet gösteren girişimcilerin ürettiği sistem yönetimi, veri yönetimi, iş uygulamaları yazılımları.',
    ublCode: '321',
  },
  {
    code: '202',
    title: 'Hurda ve Atık Teslimleri',
    legalArticle: 'KDVK m.17/4-g',
    category: 'kismi_istisna',
    description: 'Metal, plastik, lastik, kauçuk, kağıt, cam hurda ve atıklarının teslimi.',
    ublCode: '202',
  },
  {
    code: '208',
    title: 'Serbest Bölgelerde İfa Edilen Hizmetler',
    legalArticle: 'KDVK m.17/4-ı',
    category: 'kismi_istisna',
    description: 'Serbest bölgelerde gerçekleştirilen her türlü hizmet teslimi.',
    ublCode: '208',
  },
  {
    code: '223',
    title: 'Geçici 23. Madde Kapsamında Yapılan Teslimler',
    legalArticle: 'Geçici m.23',
    category: 'kismi_istisna',
    description: 'Milli Eğitim Bakanlığına bilgisayar ve donanım bağışları teslimi.',
    ublCode: '223',
  },
  {
    code: '351',
    title: 'İstisna Olmayan Diğer KDV Sıfır İşlemler',
    legalArticle: 'Genel',
    category: 'diger',
    description: 'Özel bir istisna koduna girmeyen ancak mevzuat uyarınca KDV oranı %0 olarak uygulanan diğer işlemler.',
    ublCode: '351',
  },
];

function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * e-Arşiv fatura kesme zorunluluk limitini hesaplar
 */
export function checkEArchiveRequirement(input: EArchiveThresholdInput): EArchiveThresholdResult {
  const currentInvoice = Math.max(0, input.totalAmountIncludingVat);
  const previousSameDay = Math.max(0, input.sameDayPreviousInvoicesTotal || 0);
  const evaluatedTotalAmount = roundTo2(currentInvoice + previousSameDay);

  const limit = input.recipientType === 'taxpayer'
    ? OFFICIAL_THRESHOLDS.taxpayerLimit
    : OFFICIAL_THRESHOLDS.consumerLimit;

  const isEArchiveMandatory = evaluatedTotalAmount >= limit;
  const remainingLimit = isEArchiveMandatory ? 0 : roundTo2(limit - evaluatedTotalAmount);

  const recommendedInvoiceType = isEArchiveMandatory ? 'e_archive_portal' : 'paper_or_e_archive';

  let legalNotice: EArchiveThresholdResult['legalNotice'];

  if (isEArchiveMandatory) {
    legalNotice = {
      status: 'mandatory',
      title: `GİB e-Arşiv Fatura Düzenlenmesi Zorunludur! (${limit.toLocaleString('tr-TR')} TL Limiti Aşıldı)`,
      description: `Vergiler dahil ${evaluatedTotalAmount.toLocaleString('tr-TR')} TL toplam tutar, ${input.recipientType === 'taxpayer' ? 'vergi mükellefleri' : 'nihai tüketiciler'} için belirlenen ${limit.toLocaleString('tr-TR')} TL yasal tavanı aşmıştır. Faturanın kağıt ortamında kesilmesi yasaktır.`,
      penaltyWarning:
        'VUK Madde 353 uyarınca zorunluluğa rağmen kağıt fatura düzenlenmesi halinde, fatura tutarının %10’u oranında özel usulsüzlük cezası kesilir.',
    };
  } else {
    legalNotice = {
      status: 'optional',
      title: `e-Arşiv Zorunlu Değildir (Kalan Limit: ${remainingLimit.toLocaleString('tr-TR')} TL)`,
      description: `Toplam tutar yasal sınır olan ${limit.toLocaleString('tr-TR')} TL'nin altındadır. İsteğe bağlı olarak matbu (kağıt) fatura veya e-Arşiv fatura düzenleyebilirsiniz.`,
      penaltyWarning:
        'Aynı gün içinde aynı alıcıya yapılacak diğer faturalarla birlikte toplam tutar limiti aşarsa, tüm faturaların e-Arşiv düzenlenmesi zorunlu hale gelir.',
    };
  }

  return {
    evaluatedTotalAmount,
    thresholdLimit: limit,
    isEArchiveMandatory,
    remainingLimit,
    recommendedInvoiceType,
    legalNotice,
  };
}

function normalizeText(text: string): string {
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

/**
 * GİB KDV istisna muafiyet kodlarını kelime veya kategoriye göre arar
 */
export function searchVatExemptionCodes(query?: string, category?: string): VatExemptionCode[] {
  let list = VAT_EXEMPTION_CODES;

  if (category && category !== 'all') {
    list = list.filter((item) => item.category === category);
  }

  if (!query || !query.trim()) {
    return list;
  }

  const q = normalizeText(query.trim());
  return list.filter(
    (item) =>
      normalizeText(item.code).includes(q) ||
      normalizeText(item.title).includes(q) ||
      normalizeText(item.legalArticle).includes(q) ||
      normalizeText(item.description).includes(q)
  );
}

