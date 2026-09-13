/**
 * Lisanssız checksum / format doğrulayıcılar (ISO & açık algoritmalar).
 */

export type ValidResult = { valid: boolean; normalized: string; reason?: string };

/** VIN ISO 3779 */
const VIN_MAP: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
};
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function validateVin(raw: string): ValidResult & { checkDigit?: string } {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'VIN 17 karakter; I/O/Q yasak' };
  }
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const v = VIN_MAP[normalized[i]!];
    if (v === undefined) return { valid: false, normalized, reason: 'Geçersiz VIN karakteri' };
    sum += v * VIN_WEIGHTS[i]!;
  }
  const rem = sum % 11;
  const expected = rem === 10 ? 'X' : String(rem);
  if (normalized[8] !== expected) {
    return { valid: false, normalized, checkDigit: expected, reason: 'VIN kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized, checkDigit: expected };
}

/** ISO 6346 konteyner numarası */
const CONT_MAP: Record<string, number> = {
  A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20,
  K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31,
  U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
};

export function validateContainer(raw: string): ValidResult {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z]{4}\d{7}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'Format: 4 harf + 7 rakam' };
  }
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const ch = normalized[i]!;
    const n = /[A-Z]/.test(ch) ? CONT_MAP[ch]! : Number(ch);
    sum += n * Math.pow(2, i);
  }
  const check = sum % 11 % 10;
  if (check !== Number(normalized[10])) {
    return { valid: false, normalized, reason: 'Konteyner kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized };
}

export function validateIsbn10(raw: string): ValidResult {
  const normalized = raw.replace(/[-\s]/g, '').toUpperCase();
  if (!/^\d{9}[\dX]$/.test(normalized)) {
    return { valid: false, normalized, reason: 'ISBN-10 10 karakter olmalıdır' };
  }
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const c = normalized[i]!;
    sum += (c === 'X' ? 10 : Number(c)) * (10 - i);
  }
  if (sum % 11 !== 0) return { valid: false, normalized, reason: 'ISBN-10 kontrolü başarısız' };
  return { valid: true, normalized };
}

export function validateIsbn13(raw: string): ValidResult {
  const normalized = raw.replace(/[-\s]/g, '');
  if (!/^\d{13}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'ISBN-13 13 haneli olmalıdır' };
  }
  if (!normalized.startsWith('978') && !normalized.startsWith('979')) {
    return { valid: false, normalized, reason: 'ISBN-13 978/979 ile başlamalıdır' };
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(normalized[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  if (check !== Number(normalized[12])) {
    return { valid: false, normalized, reason: 'ISBN-13 kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized };
}

export function validateIssn(raw: string): ValidResult {
  const normalized = raw.replace(/[-\s]/g, '').toUpperCase();
  if (!/^\d{7}[\dX]$/.test(normalized)) {
    return { valid: false, normalized, reason: 'ISSN 8 karakter olmalıdır' };
  }
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const c = normalized[i]!;
    sum += (c === 'X' ? 10 : Number(c)) * (8 - i);
  }
  if (sum % 11 !== 0) return { valid: false, normalized, reason: 'ISSN kontrolü başarısız' };
  return { valid: true, normalized };
}

/** ISIN ISO 6166 */
export function validateIsin(raw: string): ValidResult {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(normalized)) {
    return { valid: false, normalized, reason: 'ISIN 12 karakter (2 ülke + 9 + check)' };
  }
  const expanded = normalized
    .slice(0, 11)
    .split('')
    .map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c))
    .join('');
  let sum = 0;
  let alt = true;
  for (let i = expanded.length - 1; i >= 0; i--) {
    let n = Number(expanded[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  const check = (10 - (sum % 10)) % 10;
  if (check !== Number(normalized[11])) {
    return { valid: false, normalized, reason: 'ISIN kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized };
}

/** CUSIP (9 karakter) */
export function validateCusip(raw: string): ValidResult {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z0-9*@#]{9}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'CUSIP 9 karakter olmalıdır' };
  }
  const values: Record<string, number> = {};
  for (let i = 0; i < 10; i++) values[String(i)] = i;
  for (let i = 0; i < 26; i++) values[String.fromCharCode(65 + i)] = 10 + i;
  values['*'] = 36;
  values['@'] = 37;
  values['#'] = 38;
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let v = values[normalized[i]!]!;
    if (i % 2 === 1) v *= 2;
    sum += Math.floor(v / 10) + (v % 10);
  }
  const check = (10 - (sum % 10)) % 10;
  if (check !== Number(normalized[8])) {
    return { valid: false, normalized, reason: 'CUSIP kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized };
}

/** SEDOL (7 karakter) */
export function validateSedol(raw: string): ValidResult {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[0-9B-DF-HJ-NP-TV-Z]{7}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'SEDOL 7 karakter olmalıdır' };
  }
  const weights = [1, 3, 1, 7, 3, 9];
  let sum = 0;
  for (let i = 0; i < 6; i++) {
    const c = normalized[i]!;
    const v = /[0-9]/.test(c) ? Number(c) : c.charCodeAt(0) - 55;
    sum += v * weights[i]!;
  }
  const check = (10 - (sum % 10)) % 10;
  if (check !== Number(normalized[6])) {
    return { valid: false, normalized, reason: 'SEDOL kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized };
}

/** US ABA routing */
export function validateAbaRouting(raw: string): ValidResult {
  const normalized = raw.replace(/\D/g, '');
  if (!/^\d{9}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'ABA 9 haneli olmalıdır' };
  }
  const d = normalized.split('').map(Number);
  const sum =
    3 * (d[0]! + d[3]! + d[6]!) + 7 * (d[1]! + d[4]! + d[7]!) + (d[2]! + d[5]! + d[8]!);
  if (sum % 10 !== 0) return { valid: false, normalized, reason: 'ABA checksum başarısız' };
  return { valid: true, normalized };
}

/** BIC/SWIFT yapısal (8 veya 11) */
export function validateBic(raw: string): ValidResult {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(normalized)) {
    return { valid: false, normalized, reason: 'BIC 8 veya 11 karakter olmalıdır' };
  }
  return { valid: true, normalized };
}

/** GTIN-8/12/13/14 */
export function validateGtin(raw: string): ValidResult & { kind?: string } {
  const normalized = raw.replace(/\D/g, '');
  if (![8, 12, 13, 14].includes(normalized.length)) {
    return { valid: false, normalized, reason: 'GTIN 8/12/13/14 hane olmalıdır' };
  }
  const body = normalized.slice(0, -1);
  const check = Number(normalized.slice(-1));
  let sum = 0;
  const padded = body.padStart(13, '0');
  for (let i = 0; i < 13; i++) {
    sum += Number(padded[i]) * (i % 2 === 0 ? 3 : 1);
  }
  const expected = (10 - (sum % 10)) % 10;
  if (expected !== check) {
    return { valid: false, normalized, reason: 'GTIN kontrol hanesi geçersiz' };
  }
  const kind =
    normalized.length === 8
      ? 'GTIN-8'
      : normalized.length === 12
        ? 'GTIN-12/UPC'
        : normalized.length === 13
          ? 'GTIN-13/EAN'
          : 'GTIN-14';
  return { valid: true, normalized, kind };
}

/** ISO 11649 RF creditor reference — validate or encode */
export function processCreditorReference(input: {
  reference?: string;
  payload?: string;
}): { valid?: boolean; reference: string; reason?: string; encoded?: boolean } {
  if (input.payload) {
    const payload = input.payload.replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z0-9]{1,21}$/.test(payload)) {
      return { reference: '', reason: 'Payload 1–21 alfanümerik olmalıdır' };
    }
    const rearranged = payload + 'RF00';
    const expanded = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
    let rem = 0;
    for (const ch of expanded) rem = (rem * 10 + Number(ch)) % 97;
    const check = String(98 - rem).padStart(2, '0');
    return { valid: true, reference: `RF${check}${payload}`, encoded: true };
  }
  const reference = (input.reference ?? '').replace(/\s+/g, '').toUpperCase();
  if (!/^RF\d{2}[A-Z0-9]{1,21}$/.test(reference)) {
    return { valid: false, reference, reason: 'RF + 2 hane + payload beklenir' };
  }
  const rearranged = reference.slice(4) + reference.slice(0, 4);
  const expanded = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of expanded) rem = (rem * 10 + Number(ch)) % 97;
  if (rem !== 1) return { valid: false, reference, reason: 'RF MOD-97 başarısız' };
  return { valid: true, reference };
}

/** Kart markası (statik BIN prefix) — Luhn ayrı */
export function detectCardBrand(raw: string): {
  brand: string | null;
  normalized: string;
} {
  const normalized = raw.replace(/[\s-]/g, '');
  if (/^4\d{12,18}$/.test(normalized)) return { brand: 'visa', normalized };
  if (/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7[01]\d{12}|720\d{12}))$/.test(normalized))
    return { brand: 'mastercard', normalized };
  if (/^3[47]\d{13}$/.test(normalized)) return { brand: 'amex', normalized };
  if (/^6(?:011|5\d{2})\d{12}$/.test(normalized)) return { brand: 'discover', normalized };
  if (/^3(?:0[0-5]|[68]\d)\d{11}$/.test(normalized)) return { brand: 'diners', normalized };
  if (/^(?:2131|1800|35\d{3})\d{11}$/.test(normalized)) return { brand: 'jcb', normalized };
  if (/^62\d{14,17}$/.test(normalized)) return { brand: 'unionpay', normalized };
  if (/^9792\d{12}$/.test(normalized)) return { brand: 'troy', normalized };
  return { brand: null, normalized };
}

export function validateUuid(raw: string): ValidResult & { version?: number } {
  const normalized = raw.trim().toLowerCase();
  const m = normalized.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-([1-5])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  );
  if (!m) return { valid: false, normalized, reason: 'UUID v1–v5 formatı geçersiz' };
  return { valid: true, normalized, version: Number(m[1]) };
}

export function validateUrl(raw: string): ValidResult & { protocol?: string; host?: string } {
  const normalized = raw.trim();
  try {
    const u = new URL(normalized);
    if (!['http:', 'https:'].includes(u.protocol)) {
      return { valid: false, normalized, reason: 'Yalnızca http/https' };
    }
    return { valid: true, normalized, protocol: u.protocol.replace(':', ''), host: u.host };
  } catch {
    return { valid: false, normalized, reason: 'URL parse edilemedi' };
  }
}

export function validateIp(raw: string): ValidResult & { version?: 4 | 6 } {
  const normalized = raw.trim();
  if (
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(normalized)
  ) {
    return { valid: true, normalized, version: 4 };
  }
  // simplified IPv6
  if (/^[0-9a-f:]+$/i.test(normalized) && normalized.includes(':')) {
    try {
      // Node URL parser for IPv6
      const u = new URL(`http://[${normalized}]`);
      if (u.hostname) return { valid: true, normalized, version: 6 };
    } catch {
      /* fallthrough */
    }
  }
  return { valid: false, normalized, reason: 'Geçersiz IPv4/IPv6' };
}

/** Ethereum EIP-55 */
export function validateEthAddress(raw: string): ValidResult {
  const normalized = raw.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(normalized)) {
    return { valid: false, normalized, reason: '0x + 40 hex beklenir' };
  }
  // If all lower/upper, checksum optional
  if (normalized === normalized.toLowerCase() || normalized === normalized.toUpperCase()) {
    return { valid: true, normalized };
  }
  // EIP-55 check via keccak — without keccak lib, accept mixed as format-only soft pass with note
  // Lightweight: verify hex only (full EIP-55 needs keccak256)
  return {
    valid: true,
    normalized,
    reason: 'EIP-55 tam keccak doğrulaması yok; format geçerli',
  };
}

/** Bitcoin Base58Check (legacy) — simplified charset + length */
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function validateBtcAddress(raw: string): ValidResult & { kind?: string } {
  const normalized = raw.trim();
  if (/^(bc1|tb1)[a-z0-9]{25,90}$/i.test(normalized)) {
    return { valid: true, normalized, kind: 'bech32' };
  }
  if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'Geçersiz BTC adres formatı' };
  }
  for (const ch of normalized) {
    if (!B58.includes(ch)) return { valid: false, normalized, reason: 'Base58 karakter hatası' };
  }
  return { valid: true, normalized, kind: 'base58' };
}
