/**
 * Taşımacılık: AWB (IATA), IMO gemi numarası
 */

export function validateAwb(raw: string): {
  valid: boolean;
  normalized: string;
  airlinePrefix?: string;
  serial?: string;
  reason?: string;
} {
  const normalized = raw.replace(/[\s-]/g, '');
  if (!/^\d{11}$/.test(normalized) && !/^\d{3}-\d{8}$/.test(raw.replace(/\s/g, ''))) {
    // accept 11 digits or 3-8
  }
  const digits = normalized.replace(/\D/g, '');
  if (digits.length !== 11) {
    return { valid: false, normalized: digits, reason: 'AWB 11 haneli olmalıdır (3+8)' };
  }
  const serial = digits.slice(3, 10);
  const check = Number(digits[10]);
  // AWB check: serial mod 7
  if (Number(serial) % 7 !== check) {
    return { valid: false, normalized: digits, reason: 'AWB check digit (mod 7) geçersiz' };
  }
  return {
    valid: true,
    normalized: digits,
    airlinePrefix: digits.slice(0, 3),
    serial: digits.slice(3, 10),
  };
}

/** IMO: IMO + 7 hane (check digit) */
export function validateImo(raw: string): { valid: boolean; normalized: string; reason?: string } {
  let normalized = raw.replace(/\s+/g, '').toUpperCase();
  if (normalized.startsWith('IMO')) normalized = normalized.slice(3);
  if (!/^\d{7}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'IMO 7 haneli olmalıdır' };
  }
  let sum = 0;
  for (let i = 0; i < 6; i++) {
    sum += Number(normalized[i]) * (7 - i);
  }
  const check = sum % 10;
  if (check !== Number(normalized[6])) {
    return { valid: false, normalized, reason: 'IMO kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized };
}
