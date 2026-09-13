/**
 * Finans ID: LEI, FIGI, MIC, WKN, SEPA Creditor Identifier
 */

export type IdResult = { valid: boolean; normalized: string; reason?: string };

/** LEI ISO 17442 — 20 karakter, son 2 check (mod 97) */
export function validateLei(raw: string): IdResult {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z0-9]{18}\d{2}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'LEI 20 karakter olmalıdır' };
  }
  const expanded = normalized.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of expanded) rem = (rem * 10 + Number(ch)) % 97;
  if (rem !== 1) return { valid: false, normalized, reason: 'LEI MOD-97 başarısız' };
  return { valid: true, normalized };
}

/** FIGI — BBG + 9 alfanum + check (basit Luhn-benzeri) */
export function validateFigi(raw: string): IdResult {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^BBG[A-Z0-9]{9}$/.test(normalized) && !/^[A-Z0-9]{12}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'FIGI 12 karakter (genelde BBG…) olmalıdır' };
  }
  // Structural only — full FIGI check digit algorithm
  const body = normalized.slice(0, 11);
  const map = (c: string) => (/[0-9]/.test(c) ? Number(c) : c.charCodeAt(0) - 55);
  let sum = 0;
  let dbl = true;
  for (let i = 10; i >= 0; i--) {
    let v = map(body[i]!);
    if (dbl) {
      v *= 2;
      if (v > 9) v -= 9;
    }
    sum += v;
    dbl = !dbl;
  }
  const check = String((10 - (sum % 10)) % 10);
  // Some FIGIs use letter check — accept if last is digit matching OR letter
  if (/[0-9]/.test(normalized[11]!) && normalized[11] !== check) {
    return { valid: false, normalized, reason: 'FIGI kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized };
}

/** MIC ISO 10383 — 4 harf */
export function validateMic(raw: string): IdResult {
  const normalized = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{4}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'MIC 4 harf olmalıdır' };
  }
  return { valid: true, normalized };
}

/** Alman WKN — 6 alfanumerik */
export function validateWkn(raw: string): IdResult {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'WKN 6 karakter olmalıdır' };
  }
  return { valid: true, normalized };
}

/** SEPA Creditor Identifier — yapısal */
export function validateSci(raw: string): IdResult {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  // e.g. DE98ZZZ09999999999 — country(2)+check(2)+business(3)+national
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{3}[A-Z0-9]{1,28}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'SCI formatı geçersiz (ülke+check+ZZZ+…)' };
  }
  if (normalized.length < 8 || normalized.length > 35) {
    return { valid: false, normalized, reason: 'SCI uzunluğu 8–35 olmalıdır' };
  }
  return { valid: true, normalized };
}
