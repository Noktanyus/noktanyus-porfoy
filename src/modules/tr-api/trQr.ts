/**
 * TCMB TR Karekod (TR-QR / FAST) EMVCo Standart Motoru
 *
 * TCMB "Ödeme Hizmetlerinde TR Karekodun Üretilmesi ve Kullanılması Hakkında Yönetmelik"
 * ve BKM TR Karekod Teknik Standartları (EMVCo Merchant-Presented Mode) ile tam uyumludur.
 *
 * Fonksiyonlar:
 * - buildTrQrString: FAST IBAN, Alıcı, Tutar ve Referans içeren standart EMVCo TLV string üretir
 * - parseTrQrString: Herhangi bir TR Karekod string'ini parçalayıp doğrular ve içeriğini ayıklar
 * - generateTrQrSvg: Doğrudan web/mobil ve baskı için vektörel SVG karekod üretir
 * - generateTrQrDataUrl: <img> etiketleri için base64 PNG data URL üretir
 */

import QRCode from 'qrcode';
import { validateIban } from './validators';

export interface TrQrInput {
  /** TR ile başlayan 26 haneli IBAN numarası */
  iban: string;
  /** Alıcı Adı Soyadı veya Ticari Ünvan (Maks 25 karakter) */
  payeeName: string;
  /** Tutar (TL cinsinden, örn: 150.50). Belirtilmezse kullanıcı bankasında tutarı elle girer */
  amount?: number | string;
  /** Sipariş No, Fatura No veya Açıklama (Maks 25 karakter) */
  reference?: string;
  /** Şehir adı (Varsayılan: ISTANBUL, Maks 15 karakter) */
  city?: string;
  /** Karekod tipi: 'dynamic' (sabit tutarlı) veya 'static' (tutarsız/kullanıcı girişli) */
  type?: 'dynamic' | 'static';
}

export interface TrQrBuildResult {
  valid: boolean;
  payload: string;
  crc: string;
  type: 'dynamic' | 'static';
  normalizedIban: string;
  amount: string | null;
  payeeName: string;
  reference: string | null;
  city: string;
  warnings?: string[];
}

export interface TrQrParseResult {
  valid: boolean;
  version: string | null;
  type: 'dynamic' | 'static' | 'unknown';
  iban: string | null;
  ibanValid: boolean;
  payeeName: string | null;
  city: string | null;
  currency: string | null;
  currencyCode: string | null;
  amount: number | null;
  reference: string | null;
  crc: string | null;
  crcValid: boolean;
  rawTags: Record<string, string>;
  error?: string;
}

/**
 * EMVCo ve TCMB standartlarına uygun ISO/IEC 13239 CRC-16 (CCITT-FALSE) hesaplar.
 * Polinom: 0x1021, Başlangıç: 0xFFFF
 */
export function calculateCrc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    crc ^= (code << 8) & 0xffff;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * TLV (Tag-Length-Value) bloğu oluşturur
 */
function createTlv(tag: string, value: string): string {
  const len = Buffer.byteLength(value, 'utf8').toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Türkçe karakterleri bankacılık sistemleriyle maksimum uyumluluk için güvenli formata çevirir
 */
function sanitizeBankText(text: string, maxLength: number): string {
  const map: Record<string, string> = {
    ç: 'C',
    Ç: 'C',
    ğ: 'G',
    Ğ: 'G',
    ı: 'I',
    İ: 'I',
    ö: 'O',
    Ö: 'O',
    ş: 'S',
    Ş: 'S',
    ü: 'U',
    Ü: 'U',
  };
  const sanitized = text
    .split('')
    .map((c) => map[c] || c)
    .join('')
    .toUpperCase()
    .replace(/[^A-Z0-9\s.\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized.slice(0, maxLength);
}

/**
 * TCMB TR Karekod (FAST / Havale) string payload'ını üretir
 */
export function buildTrQrString(input: TrQrInput): TrQrBuildResult {
  const warnings: string[] = [];
  const cleanIban = (input.iban || '').trim().replace(/[\s\-_]/g, '').toUpperCase();

  const ibanValidation = validateIban(cleanIban);
  if (!ibanValidation.valid) {
    warnings.push(`IBAN doğrulama uyarısı: ${ibanValidation.reason || 'Geçersiz TR IBAN formatı'}`);
  }

  // Tutar kontrolü
  let amountStr: string | null = null;
  let qrType = input.type || 'static';

  if (input.amount !== undefined && input.amount !== null && input.amount !== '') {
    const num = typeof input.amount === 'number' ? input.amount : parseFloat(String(input.amount).replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      amountStr = num.toFixed(2);
      qrType = 'dynamic';
    }
  }

  const payee = sanitizeBankText(input.payeeName || 'ALICI', 25);
  const city = sanitizeBankText(input.city || 'ISTANBUL', 15);
  const reference = input.reference ? sanitizeBankText(input.reference, 25) : null;

  // 1. Tag 00: Payload Format Indicator (01)
  let payload = createTlv('00', '01');

  // 2. Tag 01: Point of Initiation Method (11: Static, 12: Dynamic)
  payload += createTlv('01', qrType === 'dynamic' ? '12' : '11');

  // 3. Tag 26: Merchant Account Information (FAST IBAN)
  // Sub-tag 00: Globally Unique Identifier (tr.gov.tcmb.fast)
  // Sub-tag 01: IBAN
  const subTag00 = createTlv('00', 'tr.gov.tcmb.fast');
  const subTag01 = createTlv('01', cleanIban);
  const fastData = `${subTag00}${subTag01}`;
  payload += createTlv('26', fastData);

  // 4. Tag 52: Merchant Category Code (0000: Genel)
  payload += createTlv('52', '0000');

  // 5. Tag 53: Transaction Currency (949: TRY)
  payload += createTlv('53', '949');

  // 6. Tag 54: Transaction Amount (Varsa)
  if (amountStr) {
    payload += createTlv('54', amountStr);
  }

  // 7. Tag 58: Country Code (TR)
  payload += createTlv('58', 'TR');

  // 8. Tag 59: Payee Name
  payload += createTlv('59', payee);

  // 9. Tag 60: Merchant City
  payload += createTlv('60', city);

  // 10. Tag 62: Additional Data (Referans / Fatura No)
  if (reference) {
    const subTag05 = createTlv('05', reference);
    payload += createTlv('62', subTag05);
  }

  // 11. Tag 63: CRC hesaplama (6304 eklendikten sonraki kısım)
  const payloadToCrc = `${payload}6304`;
  const crc = calculateCrc16Ccitt(payloadToCrc);
  const finalPayload = `${payloadToCrc}${crc}`;

  return {
    valid: ibanValidation.valid,
    payload: finalPayload,
    crc,
    type: qrType,
    normalizedIban: cleanIban,
    amount: amountStr,
    payeeName: payee,
    reference,
    city,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Herhangi bir TR Karekod / EMVCo metnini çözer ve içindeki bilgileri doğrular
 */
export function parseTrQrString(rawPayload: string): TrQrParseResult {
  const trimmed = (rawPayload || '').trim();
  const rawTags: Record<string, string> = {};

  if (!trimmed || trimmed.length < 10) {
    return {
      valid: false,
      version: null,
      type: 'unknown',
      iban: null,
      ibanValid: false,
      payeeName: null,
      city: null,
      currency: null,
      currencyCode: null,
      amount: null,
      reference: null,
      crc: null,
      crcValid: false,
      rawTags: {},
      error: 'Geçersiz veya çok kısa karekod verisi',
    };
  }

  let index = 0;
  while (index < trimmed.length) {
    if (index + 4 > trimmed.length) break;
    const tag = trimmed.slice(index, index + 2);
    const lengthStr = trimmed.slice(index + 2, index + 4);
    const length = parseInt(lengthStr, 10);
    if (isNaN(length)) break;

    const valueStart = index + 4;
    const valueEnd = valueStart + length;
    if (valueEnd > trimmed.length) break;

    const value = trimmed.slice(valueStart, valueEnd);
    rawTags[tag] = value;
    index = valueEnd;
  }

  // CRC Doğrulaması
  let crcValid = false;
  const crcValue = rawTags['63'] || null;
  if (crcValue && trimmed.includes('6304')) {
    const crcIndex = trimmed.lastIndexOf('6304');
    const toCalculate = trimmed.slice(0, crcIndex + 4);
    const expectedCrc = calculateCrc16Ccitt(toCalculate);
    crcValid = expectedCrc.toUpperCase() === crcValue.toUpperCase();
  }

  // Tag 01: Initiation method
  let type: 'dynamic' | 'static' | 'unknown' = 'unknown';
  if (rawTags['01'] === '11') type = 'static';
  else if (rawTags['01'] === '12') type = 'dynamic';

  // Tag 26: FAST IBAN çözümleme
  let iban: string | null = null;
  const tag26 = rawTags['26'];
  if (tag26) {
    let subIdx = 0;
    while (subIdx < tag26.length) {
      if (subIdx + 4 > tag26.length) break;
      const subTag = tag26.slice(subIdx, subIdx + 2);
      const subLen = parseInt(tag26.slice(subIdx + 2, subIdx + 4), 10);
      if (isNaN(subLen)) break;
      const subVal = tag26.slice(subIdx + 4, subIdx + 4 + subLen);
      if (subTag === '01') {
        iban = subVal;
      }
      subIdx += 4 + subLen;
    }
  }

  // Tag 62: Additional Data (Reference)
  let reference: string | null = null;
  const tag62 = rawTags['62'];
  if (tag62) {
    let subIdx = 0;
    while (subIdx < tag62.length) {
      if (subIdx + 4 > tag62.length) break;
      const subTag = tag62.slice(subIdx, subIdx + 2);
      const subLen = parseInt(tag62.slice(subIdx + 2, subIdx + 4), 10);
      if (isNaN(subLen)) break;
      const subVal = tag62.slice(subIdx + 4, subIdx + 4 + subLen);
      if (subTag === '05' || subTag === '01') {
        reference = subVal;
      }
      subIdx += 4 + subLen;
    }
  }

  const ibanValid = iban ? validateIban(iban).valid : false;
  const amountNum = rawTags['54'] ? parseFloat(rawTags['54']) : null;
  const currencyCode = rawTags['53'] || null;
  const currency = currencyCode === '949' ? 'TRY' : currencyCode;

  const valid = Boolean(rawTags['00'] === '01' && iban && crcValid);

  return {
    valid,
    version: rawTags['00'] || null,
    type,
    iban,
    ibanValid,
    payeeName: rawTags['59'] || null,
    city: rawTags['60'] || null,
    currency,
    currencyCode,
    amount: amountNum,
    reference,
    crc: crcValue,
    crcValid,
    rawTags,
  };
}

/**
 * TR Karekod için SVG formatında vektör görsel üretir
 */
export async function generateTrQrSvg(input: TrQrInput): Promise<string> {
  const result = buildTrQrString(input);
  return QRCode.toString(result.payload, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a', // Slate 900
      light: '#ffffff',
    },
  });
}

/**
 * TR Karekod için HTML <img> etiketinde anında gösterilebilecek PNG Data URL üretir
 */
export async function generateTrQrDataUrl(input: TrQrInput): Promise<string> {
  const result = buildTrQrString(input);
  return QRCode.toDataURL(result.payload, {
    margin: 2,
    width: 320,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}
