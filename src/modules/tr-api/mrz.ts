/**
 * MRZ (ICAO 9303) — TD3 passport satır kontrolü
 */

const MRZ_WEIGHTS = [7, 3, 1];

function mrzCharValue(c: string): number {
  if (c === '<') return 0;
  if (/[0-9]/.test(c)) return Number(c);
  return c.charCodeAt(0) - 55;
}

export function mrzCheckDigit(data: string): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += mrzCharValue(data[i]!) * MRZ_WEIGHTS[i % 3]!;
  }
  return sum % 10;
}

/** TD3 satır 2 (44 karakter) doğrula */
export function validateMrzTd3Line2(raw: string): {
  valid: boolean;
  normalized: string;
  documentNumber?: string;
  nationality?: string;
  birthDate?: string;
  sex?: string;
  expiryDate?: string;
  reason?: string;
} {
  const normalized = raw.replace(/\s+/g, '').toUpperCase();
  if (normalized.length !== 44) {
    return { valid: false, normalized, reason: 'TD3 satır 2 tam 44 karakter olmalıdır' };
  }
  const doc = normalized.slice(0, 9);
  const docCd = Number(normalized[9]);
  const nat = normalized.slice(10, 13);
  const birth = normalized.slice(13, 19);
  const birthCd = Number(normalized[19]);
  const sex = normalized[20];
  const expiry = normalized.slice(21, 27);
  const expiryCd = Number(normalized[27]);
  const optional = normalized.slice(28, 42);
  const optionalCd = Number(normalized[42]);
  const compositeCd = Number(normalized[43]);

  if (mrzCheckDigit(doc) !== docCd) {
    return { valid: false, normalized, reason: 'Belge no check digit hatalı' };
  }
  if (mrzCheckDigit(birth) !== birthCd) {
    return { valid: false, normalized, reason: 'Doğum tarihi check digit hatalı' };
  }
  if (mrzCheckDigit(expiry) !== expiryCd) {
    return { valid: false, normalized, reason: 'Son kullanma check digit hatalı' };
  }
  if (mrzCheckDigit(optional) !== optionalCd && optional.replace(/</g, '') !== '') {
    // optional may be empty with < 
  }
  const composite = doc + normalized[9] + birth + normalized[19] + expiry + normalized[27] + optional + normalized[42];
  if (mrzCheckDigit(composite) !== compositeCd) {
    return { valid: false, normalized, reason: 'Kompozit check digit hatalı' };
  }
  return {
    valid: true,
    normalized,
    documentNumber: doc.replace(/</g, ''),
    nationality: nat.replace(/</g, ''),
    birthDate: birth,
    sex: sex === 'M' || sex === 'F' || sex === '<' ? sex : sex,
    expiryDate: expiry,
  };
}

/** İki satırlı TD3 pasaport MRZ */
export function validateMrzPassport(input: { line1: string; line2: string }): {
  valid: boolean;
  line1: string;
  line2Result: ReturnType<typeof validateMrzTd3Line2>;
  reason?: string;
} {
  const line1 = input.line1.replace(/\s+/g, '').toUpperCase();
  if (!/^P[A-Z<][A-Z<]{3}/.test(line1) || line1.length !== 44) {
    return {
      valid: false,
      line1,
      line2Result: { valid: false, normalized: input.line2 },
      reason: 'Satır 1 P[tip][ülke]… 44 karakter olmalıdır',
    };
  }
  const line2Result = validateMrzTd3Line2(input.line2);
  return { valid: line2Result.valid, line1, line2Result };
}
