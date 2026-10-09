/**
 * Deterministik TR yardımcı üreticiler — rakip portallardaki yüksek talep uçlar.
 * Resmi kayıt / GİB gönderimi / para transferi yapmaz.
 */

import {
  IBAN_BANKS,
  resolveIbanBank,
  validateIban,
  validatePhone,
  validatePlate,
  validatePostalCode,
  validateTckn,
  validateVkn,
} from './validators';
import { validateKep, validateMersis } from './tools';

function mod97Numeric(digits: string): number {
  let remainder = 0;
  for (const ch of digits) {
    remainder = (remainder * 10 + Number(ch)) % 97;
  }
  return remainder;
}

/** Banka kodu + hesap → geçerli TR IBAN (hesap varlığı iddiası yok). */
export function buildTurkishIban(input: {
  bankCode: string;
  accountNumber: string;
  reservedDigit?: string;
}): {
  ok: boolean;
  iban?: string;
  formatted?: string;
  bankCode?: string;
  bankName?: string;
  isKnownBank?: boolean;
  reason?: string;
} {
  const bankCode = input.bankCode.replace(/\D/g, '').padStart(5, '0');
  if (!/^\d{5}$/.test(bankCode)) {
    return { ok: false, reason: 'Banka kodu 5 haneli olmalıdır' };
  }
  const reserved = (input.reservedDigit ?? '0').replace(/\D/g, '').slice(0, 1) || '0';
  const account = input.accountNumber.replace(/\D/g, '').padStart(16, '0').slice(-16);
  if (!/^\d{16}$/.test(account)) {
    return { ok: false, reason: 'Hesap numarası en fazla 16 rakam olmalıdır' };
  }

  const bban = `${bankCode}${reserved}${account}`;
  // TR → 29 27, check digits placeholder 00
  const expanded = `${bban}292700`;
  const check = String(98 - mod97Numeric(expanded)).padStart(2, '0');
  const iban = `TR${check}${bban}`;
  const bankName = IBAN_BANKS[bankCode];
  return {
    ok: true,
    iban,
    formatted: iban.replace(/(.{4})/g, '$1 ').trim(),
    bankCode,
    bankName: bankName ?? 'Bilinmeyen / diğer banka',
    isKnownBank: Boolean(bankName),
  };
}

/** Türkçe metin sadeleştirme — NFC, boşluk, İ/I tutarlılığı. */
export function normalizeTurkishText(input: {
  text: string;
  mode?: 'nfc' | 'upper' | 'lower' | 'slug';
}): {
  original: string;
  normalized: string;
  mode: string;
} {
  const mode = input.mode ?? 'nfc';
  let t = input.text.normalize('NFC').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

  if (mode === 'upper') {
    t = t.replace(/i/g, 'İ').replace(/ı/g, 'I').toLocaleUpperCase('tr-TR');
  } else if (mode === 'lower') {
    t = t.replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr-TR');
  } else if (mode === 'slug') {
    t = t
      .replace(/I/g, 'ı')
      .replace(/İ/g, 'i')
      .toLocaleLowerCase('tr-TR')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return { original: input.text, normalized: t, mode };
}

function tlv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, '0')}${value}`;
}

/** CRC-16/CCITT-FALSE — EMVCo TR Karekod trailer (tag 63). */
export function crc16CcittFalse(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Kişiden kişiye (P2P) TR Karekod payload — TCMB/FAST TLV iskeleti.
 * PNG üretmez, para göndermez; yalnızca metin payload.
 */
export function buildTrKarekodP2P(input: {
  iban: string;
  name: string;
  amountTry?: number;
  explanation?: string;
  generatorCode?: string;
}): {
  ok: boolean;
  payload?: string;
  flow?: 'static' | 'dynamic';
  iban?: string;
  name?: string;
  reason?: string;
} {
  const bank = resolveIbanBank(input.iban);
  if (!bank.valid || !bank.normalized) {
    return { ok: false, reason: bank.reason ?? 'Geçersiz TR IBAN' };
  }

  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, 26);
  if (name.length < 2) {
    return { ok: false, reason: 'Alıcı adı en az 2 karakter olmalıdır' };
  }

  const generator =
    (input.generatorCode ?? bank.bankCode?.slice(-4) ?? '0000')
      .replace(/\D/g, '')
      .padStart(4, '0')
      .slice(-4);

  const hasAmount =
    typeof input.amountTry === 'number' &&
    Number.isFinite(input.amountTry) &&
    input.amountTry > 0;

  const accountInfo = tlv('01', bank.normalized) + tlv('07', name);
  let payload =
    tlv('75', '10') +
    tlv('01', hasAmount ? '12' : '11') +
    tlv('02', generator) +
    tlv('61', accountInfo);

  if (hasAmount) {
    const kurus = Math.round(input.amountTry! * 100);
    if (kurus > 999_999_999_999) {
      return { ok: false, reason: 'Tutar çok büyük' };
    }
    payload += tlv('54', String(kurus).padStart(12, '0'));
  }

  const note = input.explanation?.trim().slice(0, 25);
  if (note) {
    payload += tlv('08', note);
  }

  payload += '6304' + crc16CcittFalse(payload + '6304');

  return {
    ok: true,
    payload,
    flow: hasAmount ? 'dynamic' : 'static',
    iban: bank.normalized,
    name,
  };
}

export type AutoDetectType =
  | 'tckn'
  | 'vkn'
  | 'iban'
  | 'phone'
  | 'postal'
  | 'plate'
  | 'mersis'
  | 'kep'
  | 'unknown';

/** Tek uçta tip tahmini + doğrulama (rakip “tr/validate auto”). */
export function autoValidateTr(raw: string): {
  detected: AutoDetectType;
  valid: boolean;
  normalized?: string;
  detail?: unknown;
  reason?: string;
} {
  const trimmed = raw.trim();
  const compact = trimmed.replace(/\s+/g, '');

  if (/^TR/i.test(compact) || (compact.length >= 24 && /^\d+$/.test(compact))) {
    const iban = validateIban(trimmed);
    const bank = iban.valid ? resolveIbanBank(trimmed) : null;
    return {
      detected: 'iban',
      valid: iban.valid,
      normalized: iban.normalized,
      detail: bank,
      reason: iban.reason,
    };
  }

  if (/@/.test(trimmed) && /\.kep\.tr$/i.test(trimmed)) {
    const r = validateKep(trimmed);
    return { detected: 'kep', valid: r.valid, normalized: r.normalized, reason: r.reason };
  }

  const digits = compact.replace(/\D/g, '');
  if (digits.length === 11) {
    const r = validateTckn(digits);
    return { detected: 'tckn', valid: r.valid, normalized: r.normalized, reason: r.reason };
  }
  if (digits.length === 10) {
    const r = validateVkn(digits);
    return { detected: 'vkn', valid: r.valid, normalized: r.normalized, reason: r.reason };
  }
  if (digits.length === 16) {
    const r = validateMersis(digits);
    return { detected: 'mersis', valid: r.valid, normalized: r.normalized, reason: r.reason };
  }
  if (digits.length === 5) {
    const r = validatePostalCode(digits);
    return { detected: 'postal', valid: r.valid, normalized: r.normalized, detail: r, reason: r.reason };
  }
  if (digits.length === 10 || digits.length === 11 || digits.length === 12) {
    const r = validatePhone(trimmed);
    if (r.valid || digits.startsWith('5') || digits.startsWith('05') || digits.startsWith('90')) {
      return {
        detected: 'phone',
        valid: r.valid,
        normalized: r.normalized,
        detail: r,
        reason: r.reason,
      };
    }
  }

  const plate = validatePlate(trimmed);
  if (plate.valid || /^[0-9]{2}\s*[A-ZÇĞİÖŞÜ]{1,3}\s*[0-9]{2,4}$/i.test(trimmed)) {
    return {
      detected: 'plate',
      valid: plate.valid,
      normalized: plate.normalized,
      reason: plate.reason,
    };
  }

  return {
    detected: 'unknown',
    valid: false,
    reason: 'Tip tespit edilemedi — type parametresiyle özel uç kullanın',
  };
}
