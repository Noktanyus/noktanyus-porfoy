/**
 * Yerel ödeme numaraları: CLABE, RIB, CCC, Belçika OGM
 */

export type PayResult = { valid: boolean; normalized: string; reason?: string };

/** Meksika CLABE — 18 hane */
export function validateClabe(raw: string): PayResult {
  const normalized = raw.replace(/\D/g, '');
  if (!/^\d{18}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'CLABE 18 haneli olmalıdır' };
  }
  const weights = [3, 7, 1];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += (Number(normalized[i]) * weights[i % 3]!) % 10;
  }
  const check = (10 - (sum % 10)) % 10;
  if (check !== Number(normalized[17])) {
    return { valid: false, normalized, reason: 'CLABE kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized };
}

/** Fransız RIB key (banque+guichet+compte → clé) */
export function validateRib(input: {
  bank: string;
  branch: string;
  account: string;
  key: string;
}): PayResult & { key?: string } {
  const bank = input.bank.replace(/\D/g, '');
  const branch = input.branch.replace(/\D/g, '');
  let account = input.account.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const key = input.key.replace(/\D/g, '');
  if (bank.length !== 5 || branch.length !== 5 || account.length !== 11 || key.length !== 2) {
    return {
      valid: false,
      normalized: `${bank}${branch}${account}${key}`,
      reason: 'RIB: banka5 + şube5 + hesap11 + key2',
    };
  }
  const mapLetter = (c: string) => {
    if (/[0-9]/.test(c)) return c;
    const code = c.charCodeAt(0) - 65;
    return String((code % 9) + 1);
  };
  account = account.split('').map(mapLetter).join('');
  const digits = bank + branch + account + '00';
  let rem = 0;
  for (const ch of digits) rem = (rem * 10 + Number(ch)) % 97;
  const expected = String(97 - rem).padStart(2, '0');
  if (expected !== key) {
    return { valid: false, normalized: `${bank}${branch}${account}${key}`, reason: 'RIB key geçersiz', key: expected };
  }
  return { valid: true, normalized: `${bank}${branch}${account}${key}`, key };
}

/** İspanya CCC */
export function validateCcc(raw: string): PayResult {
  const normalized = raw.replace(/\D/g, '');
  if (!/^\d{20}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'CCC 20 haneli olmalıdır' };
  }
  const weights = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];
  const calc = (block: string) => {
    let sum = 0;
    for (let i = 0; i < block.length; i++) {
      sum += Number(block[block.length - 1 - i]) * weights[i % 10]!;
    }
    const r = 11 - (sum % 11);
    if (r === 11) return 0;
    if (r === 10) return 1;
    return r;
  };
  const bankBranch = '00' + normalized.slice(0, 8);
  if (calc(bankBranch) !== Number(normalized[8])) {
    return { valid: false, normalized, reason: 'CCC d1 geçersiz' };
  }
  if (calc(normalized.slice(10)) !== Number(normalized[9])) {
    return { valid: false, normalized, reason: 'CCC d2 geçersiz' };
  }
  return { valid: true, normalized };
}

/** Belçika OGM +++XXX/XXXX/XXXYY+++ */
export function validateBelgiumOgm(raw: string): PayResult {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 12) {
    return { valid: false, normalized: digits, reason: 'OGM 12 haneli olmalıdır' };
  }
  const base = Number(digits.slice(0, 10));
  const check = Number(digits.slice(10));
  const expected = base % 97 === 0 ? 97 : base % 97;
  if (expected !== check) {
    return { valid: false, normalized: digits, reason: 'OGM mod-97 geçersiz' };
  }
  return { valid: true, normalized: digits };
}
