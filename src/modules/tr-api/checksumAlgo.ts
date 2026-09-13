/**
 * Checksum algoritmaları: Verhoeff, Damm, ISO 7064 (mod 11,10 / mod 97)
 */

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export function verhoeffValidate(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/\D/g, '');
  if (!normalized) return { valid: false, normalized, reason: 'Boş' };
  let c = 0;
  const reversed = normalized.split('').reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c]![VERHOEFF_P[i % 8]![Number(reversed[i])]!]!;
  }
  return c === 0 ? { valid: true, normalized } : { valid: false, normalized, reason: 'Verhoeff başarısız' };
}

export function verhoeffGenerate(body: string): string {
  const digits = body.replace(/\D/g, '');
  let c = 0;
  const reversed = digits.split('').reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c]![VERHOEFF_P[(i + 1) % 8]![Number(reversed[i])]!]!;
  }
  return digits + String(VERHOEFF_INV[c]);
}

const DAMM = [
  [0, 3, 1, 7, 5, 9, 8, 6, 4, 2],
  [7, 0, 9, 2, 1, 5, 4, 8, 6, 3],
  [4, 2, 0, 6, 8, 7, 1, 3, 5, 9],
  [1, 7, 5, 0, 9, 8, 3, 4, 2, 6],
  [6, 1, 2, 3, 0, 4, 5, 9, 7, 8],
  [3, 6, 7, 4, 2, 0, 9, 5, 8, 1],
  [5, 8, 6, 9, 7, 2, 0, 1, 3, 4],
  [8, 9, 4, 5, 3, 6, 2, 0, 1, 7],
  [9, 4, 3, 8, 6, 1, 7, 2, 0, 5],
  [2, 5, 8, 1, 4, 3, 6, 7, 9, 0],
];

export function dammValidate(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/\D/g, '');
  if (!normalized) return { valid: false, normalized, reason: 'Boş' };
  let interim = 0;
  for (const ch of normalized) {
    interim = DAMM[interim]![Number(ch)]!;
  }
  return interim === 0
    ? { valid: true, normalized }
    : { valid: false, normalized, reason: 'Damm başarısız' };
}

/** ISO 7064 MOD 97-10 (IBAN tarzı) */
export function iso7064Mod97(raw: string): { valid: boolean; normalized: string; remainder?: number; reason?: string } {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z0-9]+$/.test(normalized)) {
    return { valid: false, normalized, reason: 'Alfanümerik olmalı' };
  }
  const expanded = normalized.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of expanded) rem = (rem * 10 + Number(ch)) % 97;
  return rem === 1
    ? { valid: true, normalized, remainder: rem }
    : { valid: false, normalized, remainder: rem, reason: 'MOD-97 ≠ 1' };
}

/** ISO 7064 MOD 11,10 — numeric */
export function iso7064Mod1110(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/\D/g, '');
  if (normalized.length < 2) return { valid: false, normalized, reason: 'En az 2 hane' };
  let p = 10;
  for (let i = 0; i < normalized.length - 1; i++) {
    p = (p + Number(normalized[i]!)) % 10;
    if (p === 0) p = 10;
    p = (p * 2) % 11;
  }
  const check = (11 - p) % 10;
  if (check !== Number(normalized[normalized.length - 1])) {
    return { valid: false, normalized, reason: 'MOD 11,10 başarısız' };
  }
  return { valid: true, normalized };
}
