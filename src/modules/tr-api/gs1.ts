/**
 * GS1 check-digit helpers + GLN / SSCC / GSRN / GRAI / GSIN / GDTI
 * GS1 mod-10 (same family as GTIN).
 */

function gs1CheckDigit(body: string): number {
  // Right-to-left: odd positions *3, even *1 (GS1)
  let sum = 0;
  const digits = body.replace(/\D/g, '');
  for (let i = 0; i < digits.length; i++) {
    const n = Number(digits[digits.length - 1 - i]);
    sum += i % 2 === 0 ? n * 3 : n;
  }
  return (10 - (sum % 10)) % 10;
}

function validateGs1Id(
  raw: string,
  expectedLen: number | number[],
  kind: string
): { valid: boolean; normalized: string; kind: string; reason?: string } {
  const normalized = raw.replace(/\D/g, '');
  const lens = Array.isArray(expectedLen) ? expectedLen : [expectedLen];
  if (!lens.includes(normalized.length)) {
    return {
      valid: false,
      normalized,
      kind,
      reason: `${kind} uzunluğu ${lens.join('/')} olmalı`,
    };
  }
  const body = normalized.slice(0, -1);
  const check = Number(normalized.slice(-1));
  if (gs1CheckDigit(body) !== check) {
    return { valid: false, normalized, kind, reason: `${kind} kontrol hanesi geçersiz` };
  }
  return { valid: true, normalized, kind };
}

/** GLN — 13 hane */
export function validateGln(raw: string) {
  return validateGs1Id(raw, 13, 'GLN');
}

/** SSCC — 18 hane */
export function validateSscc(raw: string) {
  return validateGs1Id(raw, 18, 'SSCC');
}

/** GSRN — 18 hane */
export function validateGsrn(raw: string) {
  return validateGs1Id(raw, 18, 'GSRN');
}

/** GRAI — 14+ (basit: 14 hane GTIN-benzeri) */
export function validateGrai(raw: string) {
  return validateGs1Id(raw, [14, 18], 'GRAI');
}

/** GSIN — 17 hane */
export function validateGsin(raw: string) {
  return validateGs1Id(raw, 17, 'GSIN');
}

/** GDTI — 13+ */
export function validateGdti(raw: string) {
  return validateGs1Id(raw, [13, 14], 'GDTI');
}

export { gs1CheckDigit };
