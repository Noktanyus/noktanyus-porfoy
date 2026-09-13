import { verhoeffValidate } from './checksumAlgo';

/**
 * Ulusal / vergi ID format doğrulama (kayıt sorgusu değil)
 */

export type NatResult = { valid: boolean; normalized: string; country?: string; reason?: string };

/** EU VAT yapısal (jsvat ile güçlendirilebilir) */
export function validateEuVatFormat(raw: string): NatResult {
  const normalized = raw.replace(/[\s.-]/g, '').toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{2,12}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'Ülke kodu + numara beklenir' };
  }
  return { valid: true, normalized, country: normalized.slice(0, 2) };
}

/** Brezilya CPF */
export function validateCpf(raw: string): NatResult {
  const normalized = raw.replace(/\D/g, '');
  if (!/^\d{11}$/.test(normalized) || /^(\d)\1+$/.test(normalized)) {
    return { valid: false, normalized, reason: 'CPF 11 hane, tekrarlı olamaz' };
  }
  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factor - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  if (calc(normalized.slice(0, 9), 10) !== Number(normalized[9])) {
    return { valid: false, normalized, reason: 'CPF d1 geçersiz' };
  }
  if (calc(normalized.slice(0, 10), 11) !== Number(normalized[10])) {
    return { valid: false, normalized, reason: 'CPF d2 geçersiz' };
  }
  return { valid: true, normalized, country: 'BR' };
}

/** Brezilya CNPJ */
export function validateCnpj(raw: string): NatResult {
  const normalized = raw.replace(/\D/g, '');
  if (!/^\d{14}$/.test(normalized) || /^(\d)\1+$/.test(normalized)) {
    return { valid: false, normalized, reason: 'CNPJ 14 hane olmalıdır' };
  }
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const calc = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += Number(base[i]) * weights[i]!;
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  if (calc(normalized.slice(0, 12), w1) !== Number(normalized[12])) {
    return { valid: false, normalized, reason: 'CNPJ d1 geçersiz' };
  }
  if (calc(normalized.slice(0, 13), w2) !== Number(normalized[13])) {
    return { valid: false, normalized, reason: 'CNPJ d2 geçersiz' };
  }
  return { valid: true, normalized, country: 'BR' };
}

/** İspanya DNI/NIE */
export function validateSpanishDni(raw: string): NatResult {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  let numStr: string;
  let check: string;
  if (/^[XYZ]\d{7}[A-Z]$/.test(normalized)) {
    const map: Record<string, string> = { X: '0', Y: '1', Z: '2' };
    numStr = map[normalized[0]!]! + normalized.slice(1, 8);
    check = normalized[8]!;
  } else if (/^\d{8}[A-Z]$/.test(normalized)) {
    numStr = normalized.slice(0, 8);
    check = normalized[8]!;
  } else {
    return { valid: false, normalized, reason: 'DNI/NIE formatı geçersiz' };
  }
  if (letters[Number(numStr) % 23] !== check) {
    return { valid: false, normalized, reason: 'DNI kontrol harfi geçersiz' };
  }
  return { valid: true, normalized, country: 'ES' };
}

/** Hindistan Aadhaar — Verhoeff */
export function validateAadhaar(raw: string): NatResult {
  const normalized = raw.replace(/\s+/g, '');
  if (!/^\d{12}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'Aadhaar 12 haneli olmalıdır' };
  }
  const r = verhoeffValidate(normalized);
  return { ...r, country: 'IN' };
}
