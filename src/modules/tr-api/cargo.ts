/**
 * Türkiye Kargo & Lojistik Takip Modülü (Unified Turkish Cargo Suite)
 *
 * - Türkiye'deki 9 büyük kargo firması için otomatik takip no tespiti
 * - Doğrulanmış müşteri takip URL üretimi
 * - Türkiye standartlarında (bölücü 3000) Desi ve ücrete esas ağırlık hesaplayıcı
 */

export interface CargoCarrierInfo {
  code: string;
  name: string;
  shortName: string;
  website: string;
  trackingUrlTemplate: string;
  phone: string;
  patterns: {
    prefix?: string[];
    length?: number[];
    regex?: RegExp;
    description: string;
  };
}

export const TURKISH_CARRIERS: Record<string, CargoCarrierInfo> = {
  trendyol_express: {
    code: 'trendyol_express',
    name: 'Trendyol Express',
    shortName: 'TEX',
    website: 'https://trendyolexpress.com',
    trackingUrlTemplate: 'https://kargotakip.trendyol.com/?trackingNumber={code}',
    phone: '0850 758 75 75',
    patterns: {
      prefix: ['TEX', 'TY'],
      regex: /^(TEX|TY)[0-9A-Z]{8,14}$/i,
      description: 'TEX veya TY ile başlayan 10-16 karakterli kod',
    },
  },
  hepsijet: {
    code: 'hepsijet',
    name: 'HepsiJET',
    shortName: 'HepsiJET',
    website: 'https://hepsijet.com',
    trackingUrlTemplate: 'https://hepsijet.com/gonderi-takibi/{code}',
    phone: '0850 558 03 33',
    patterns: {
      prefix: ['HJ'],
      regex: /^(HJ[0-9A-Z]{8,14}|6\d{11,13})$/i,
      description: 'HJ ile başlayan veya 6 ile başlayan 12-14 haneli kod',
    },
  },
  ptt: {
    code: 'ptt',
    name: 'PTT Kargo',
    shortName: 'PTT',
    website: 'https://ptt.gov.tr',
    trackingUrlTemplate: 'https://gonderitakip.ptt.gov.tr/Track/Verify?q={code}',
    phone: '444 1 788',
    patterns: {
      prefix: ['KP', 'AP'],
      regex: /^(KP|AP)\d{11}$/i,
      length: [13],
      description: 'KP veya AP ile başlayan 13 haneli barkod',
    },
  },
  yurtici: {
    code: 'yurtici',
    name: 'Yurtiçi Kargo',
    shortName: 'Yurtiçi',
    website: 'https://www.yurticikargo.com',
    trackingUrlTemplate: 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code={code}',
    phone: '444 99 99',
    patterns: {
      length: [12],
      regex: /^\d{12}$/,
      description: '12 haneli sayısal gönderi kodu',
    },
  },
  aras: {
    code: 'aras',
    name: 'Aras Kargo',
    shortName: 'Aras',
    website: 'https://www.araskargo.com.tr',
    trackingUrlTemplate: 'https://kargotakip.araskargo.com.tr/mainpage.aspx?code={code}',
    phone: '444 25 52',
    patterns: {
      length: [12, 13],
      regex: /^\d{12,13}$/,
      description: '12 veya 13 haneli takip numarası',
    },
  },
  mng: {
    code: 'mng',
    name: 'MNG Kargo',
    shortName: 'MNG',
    website: 'https://www.mngkargo.com.tr',
    trackingUrlTemplate: 'https://kargotakip.mngkargo.com.tr/?takipNo={code}',
    phone: '0850 222 06 06',
    patterns: {
      length: [9, 10, 11, 12],
      regex: /^\d{9,12}$/,
      description: '9-12 haneli gönderi numarası',
    },
  },
  surat: {
    code: 'surat',
    name: 'Sürat Kargo',
    shortName: 'Sürat',
    website: 'https://suratkargo.com.tr',
    trackingUrlTemplate: 'https://suratkargo.com.tr/KargoTakip/?kargotakipno={code}',
    phone: '0850 202 02 02',
    patterns: {
      length: [10, 11, 12],
      regex: /^\d{10,12}$/,
      description: '10-12 haneli takip numarası',
    },
  },
  sendeo: {
    code: 'sendeo',
    name: 'Sendeo Kargo',
    shortName: 'Sendeo',
    website: 'https://sendeo.com.tr',
    trackingUrlTemplate: 'https://takip.sendeo.com.tr/?trackingNumber={code}',
    phone: '0850 755 07 55',
    patterns: {
      regex: /^2\d{10,12}$/,
      description: '2 ile başlayan 11-13 haneli gönderi kodu',
    },
  },
  kolay_gelsin: {
    code: 'kolay_gelsin',
    name: 'Kolay Gelsin',
    shortName: 'Kolay Gelsin',
    website: 'https://www.kolaygelsin.com',
    trackingUrlTemplate: 'https://www.kolaygelsin.com/kargo-takip?trackingCode={code}',
    phone: '0850 955 09 55',
    patterns: {
      regex: /^[A-Z0-9]{10,14}$/i,
      description: '10-14 haneli takip kodu',
    },
  },
};

export interface CarrierDetectionResult {
  detected: boolean;
  trackingNumber: string;
  normalized: string;
  primaryCarrier: {
    code: string;
    name: string;
    shortName: string;
    trackingUrl: string;
    confidence: 'high' | 'medium' | 'possible';
  } | null;
  candidates: Array<{
    code: string;
    name: string;
    trackingUrl: string;
    confidence: 'high' | 'medium' | 'possible';
  }>;
}

/**
 * Takip numarasından Türk kargo firmasını otomatik tespit eder
 */
export function detectCargoCarrier(trackingNumber: string): CarrierDetectionResult {
  const clean = trackingNumber.trim().replace(/[\s\-_]/g, '').toUpperCase();
  if (!clean) {
    return {
      detected: false,
      trackingNumber,
      normalized: '',
      primaryCarrier: null,
      candidates: [],
    };
  }

  const candidates: CarrierDetectionResult['candidates'] = [];

  // 1. Kesin ön ekler (TEX, TY, HJ, KP, AP) -> HIGH confidence
  if (/^(TEX|TY)/i.test(clean)) {
    candidates.push({
      code: 'trendyol_express',
      name: TURKISH_CARRIERS.trendyol_express.name,
      trackingUrl: TURKISH_CARRIERS.trendyol_express.trackingUrlTemplate.replace('{code}', clean),
      confidence: 'high',
    });
  } else if (/^HJ/i.test(clean)) {
    candidates.push({
      code: 'hepsijet',
      name: TURKISH_CARRIERS.hepsijet.name,
      trackingUrl: TURKISH_CARRIERS.hepsijet.trackingUrlTemplate.replace('{code}', clean),
      confidence: 'high',
    });
  } else if (/^(KP|AP)/i.test(clean) && clean.length === 13) {
    candidates.push({
      code: 'ptt',
      name: TURKISH_CARRIERS.ptt.name,
      trackingUrl: TURKISH_CARRIERS.ptt.trackingUrlTemplate.replace('{code}', clean),
      confidence: 'high',
    });
  } else if (/^2\d{10,12}$/.test(clean)) {
    candidates.push({
      code: 'sendeo',
      name: TURKISH_CARRIERS.sendeo.name,
      trackingUrl: TURKISH_CARRIERS.sendeo.trackingUrlTemplate.replace('{code}', clean),
      confidence: 'high',
    });
  }

  // 2. Sayısal takip numarası eşleştirmeleri
  if (/^\d+$/.test(clean)) {
    const len = clean.length;

    // 12 haneli -> Yurtiçi (çok yaygın), Aras, MNG, Sürat
    if (len === 12) {
      candidates.push({
        code: 'yurtici',
        name: TURKISH_CARRIERS.yurtici.name,
        trackingUrl: TURKISH_CARRIERS.yurtici.trackingUrlTemplate.replace('{code}', clean),
        confidence: 'high',
      });
      candidates.push({
        code: 'aras',
        name: TURKISH_CARRIERS.aras.name,
        trackingUrl: TURKISH_CARRIERS.aras.trackingUrlTemplate.replace('{code}', clean),
        confidence: 'medium',
      });
      candidates.push({
        code: 'mng',
        name: TURKISH_CARRIERS.mng.name,
        trackingUrl: TURKISH_CARRIERS.mng.trackingUrlTemplate.replace('{code}', clean),
        confidence: 'possible',
      });
      candidates.push({
        code: 'surat',
        name: TURKISH_CARRIERS.surat.name,
        trackingUrl: TURKISH_CARRIERS.surat.trackingUrlTemplate.replace('{code}', clean),
        confidence: 'possible',
      });
    } else if (len === 13) {
      candidates.push({
        code: 'aras',
        name: TURKISH_CARRIERS.aras.name,
        trackingUrl: TURKISH_CARRIERS.aras.trackingUrlTemplate.replace('{code}', clean),
        confidence: 'high',
      });
      candidates.push({
        code: 'ptt',
        name: TURKISH_CARRIERS.ptt.name,
        trackingUrl: TURKISH_CARRIERS.ptt.trackingUrlTemplate.replace('{code}', clean),
        confidence: 'medium',
      });
    } else if (len === 9 || len === 10 || len === 11) {
      candidates.push({
        code: 'mng',
        name: TURKISH_CARRIERS.mng.name,
        trackingUrl: TURKISH_CARRIERS.mng.trackingUrlTemplate.replace('{code}', clean),
        confidence: 'high',
      });
      candidates.push({
        code: 'surat',
        name: TURKISH_CARRIERS.surat.name,
        trackingUrl: TURKISH_CARRIERS.surat.trackingUrlTemplate.replace('{code}', clean),
        confidence: 'medium',
      });
    }
  }

  // Primary belirleme
  const primary = candidates[0] || null;
  const primaryCarrier = primary
    ? {
        ...primary,
        shortName: TURKISH_CARRIERS[primary.code]?.shortName || primary.name,
      }
    : null;

  return {
    detected: candidates.length > 0,
    trackingNumber,
    normalized: clean,
    primaryCarrier,
    candidates,
  };
}

export interface CargoDesiInput {
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  weightKg?: number;
  divisor?: 3000 | 5000;
}

export interface CargoDesiResult {
  volumeCm3: number;
  desi: number;
  divisorUsed: number;
  weightKg: number | null;
  chargeableWeightKg: number;
  pricingBasis: 'desi' | 'actual_weight';
  sizeCategory: string;
  sizeCategoryKey: 'dosya' | 'mico' | 'kucuk_koli' | 'orta_koli' | 'buyuk_koli' | 'palet';
}

/**
 * Türkiye standartlarında kargo Desi ve ücrete esas ağırlık hesaplayıcı
 * Standart Türkiye içi kargo bölücüsü: 3000 (IATA uluslararası: 5000)
 */
export function calculateCargoDesi(input: CargoDesiInput): CargoDesiResult {
  const w = Math.max(0, input.widthCm);
  const l = Math.max(0, input.lengthCm);
  const h = Math.max(0, input.heightCm);
  const weight = input.weightKg !== undefined && input.weightKg >= 0 ? input.weightKg : null;
  const divisor = input.divisor === 5000 ? 5000 : 3000;

  const volume = w * l * h;
  const rawDesi = volume / divisor;
  const desi = Math.round(rawDesi * 100) / 100;

  let chargeableWeightKg = desi;
  let pricingBasis: 'desi' | 'actual_weight' = 'desi';

  if (weight !== null) {
    if (weight > desi) {
      chargeableWeightKg = weight;
      pricingBasis = 'actual_weight';
    }
  }

  let sizeCategory = 'Küçük Koli';
  let sizeCategoryKey: CargoDesiResult['sizeCategoryKey'] = 'kucuk_koli';

  if (desi <= 1) {
    sizeCategory = 'Dosya / Zarf';
    sizeCategoryKey = 'dosya';
  } else if (desi <= 3) {
    sizeCategory = 'Miço (Küçük Paket)';
    sizeCategoryKey = 'mico';
  } else if (desi <= 10) {
    sizeCategory = 'Küçük Koli';
    sizeCategoryKey = 'kucuk_koli';
  } else if (desi <= 30) {
    sizeCategory = 'Orta Koli';
    sizeCategoryKey = 'orta_koli';
  } else if (desi <= 70) {
    sizeCategory = 'Büyük Koli';
    sizeCategoryKey = 'buyuk_koli';
  } else {
    sizeCategory = 'Palet / Ağır Kargo';
    sizeCategoryKey = 'palet';
  }

  return {
    volumeCm3: Math.round(volume),
    desi,
    divisorUsed: divisor,
    weightKg: weight !== null ? Math.round(weight * 100) / 100 : null,
    chargeableWeightKg: Math.round(chargeableWeightKg * 100) / 100,
    pricingBasis,
    sizeCategory,
    sizeCategoryKey,
  };
}

/**
 * Kargo firması için takip URL'i oluşturur
 */
export function buildCargoTrackingUrl(carrierCode: string, trackingNumber: string): string | null {
  const carrier = TURKISH_CARRIERS[carrierCode];
  if (!carrier) return null;
  const clean = trackingNumber.trim().replace(/[\s\-_]/g, '');
  return carrier.trackingUrlTemplate.replace('{code}', encodeURIComponent(clean));
}
