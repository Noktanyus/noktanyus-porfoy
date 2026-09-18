/**
 * TR API validators unit tests
 */

import { describe, it, expect } from 'vitest';
import { validateTckn, validateVkn, validateIban, buildInvoicePdf, validatePhone, validatePostalCode, validatePlate, calculateKdv, resolveIbanBank, validateCardLuhn, validateEan13 } from '../validators';

describe('validateTckn', () => {
  it('rejects wrong length', () => {
    expect(validateTckn('123').valid).toBe(false);
  });

  it('rejects leading zero', () => {
    expect(validateTckn('01234567890').valid).toBe(false);
  });
});

describe('validateVkn', () => {
  it('rejects wrong length', () => {
    expect(validateVkn('123').valid).toBe(false);
  });
});

describe('validateIban', () => {
  it('accepts a known valid TR IBAN', () => {
    // Wikipedia / common test IBAN
    const result = validateIban('TR33 0006 1005 1978 6457 8413 26');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('TR330006100519786457841326');
  });

  it('rejects invalid checksum', () => {
    expect(validateIban('TR00 0000 0000 0000 0000 0000 00').valid).toBe(false);
  });
});

describe('validatePhone', () => {
  it('normalizes mobile with +90', () => {
    const r = validatePhone('+90 532 123 45 67', 'mobile');
    expect(r.valid).toBe(true);
    expect(r.normalized).toBe('5321234567');
    expect(r.e164).toBe('+905321234567');
  });
});

describe('validatePostalCode', () => {
  it('accepts Istanbul-style code', () => {
    expect(validatePostalCode('34000').valid).toBe(true);
  });
  it('rejects invalid province', () => {
    expect(validatePostalCode('99000').valid).toBe(false);
  });
});

describe('validatePlate', () => {
  it('accepts common plate', () => {
    expect(validatePlate('34 ABC 123').valid).toBe(true);
  });
});

describe('calculateKdv', () => {
  it('adds 20% on net', () => {
    const r = calculateKdv({ amountCents: 10000, vatRate: 20, mode: 'net' });
    expect(r.vatCents).toBe(2000);
    expect(r.grossCents).toBe(12000);
  });
});

describe('resolveIbanBank', () => {
  it('resolves Garanti code 00061 from valid IBAN structure', () => {
    const r = resolveIbanBank('TR33 0006 1005 1978 6457 8413 26');
    expect(r.valid).toBe(true);
    expect(r.bankCode).toBe('00061');
    expect(r.bankName).toBe('Garanti BBVA');
    expect(r.isKnown).toBe(true);
  });

  it('resolves Garanti code 00062', () => {
    const r = resolveIbanBank('TR600006201234567890123456');
    expect(r.valid).toBe(true);
    expect(r.bankCode).toBe('00062');
    expect(r.bankName).toBe('Garanti BBVA');
    expect(r.isKnown).toBe(true);
  });

  it('resolves İş Bankası, Katılım, Enpara and Papara correctly', () => {
    const isBank = resolveIbanBank('TR450006401234567890123456');
    expect(isBank.bankName).toBe('Türkiye İş Bankası');
    expect(isBank.isKnown).toBe(true);

    const katilim = resolveIbanBank('TR730020901234567890123456');
    expect(katilim.bankName).toBe('Ziraat Katılım Bankası');
    expect(katilim.isKnown).toBe(true);

    const enpara = resolveIbanBank('TR750015701234567890123456');
    expect(enpara.bankName).toBe('Enpara Bank');
    expect(enpara.isKnown).toBe(true);

    const papara = resolveIbanBank('TR790082901234567890123456');
    expect(papara.bankName).toBe('Papara Elektronik Para');
    expect(papara.isKnown).toBe(true);
  });

  it('handles unlisted bank code gracefully with isKnown = false', () => {
    // 99999 is unlisted bank code with valid MOD-97 check digits (TR039999901234567890123456)
    const r = resolveIbanBank('TR039999901234567890123456');
    expect(r.valid).toBe(true);
    expect(r.bankCode).toBe('99999');
    expect(r.bankName).toBe('Bilinmeyen / diğer banka');
    expect(r.isKnown).toBe(false);
  });
});

describe('buildInvoicePdf', () => {
  it('returns a PDF buffer starting with %PDF', () => {
    const pdf = buildInvoicePdf({
      sellerName: 'Test A.S.',
      buyerName: 'Musteri',
      invoiceNumber: 'F-1',
      lines: [{ description: 'Hizmet', quantity: 1, unitPriceCents: 10000, vatRate: 20 }],
    });
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  });
});

describe('validateCardLuhn', () => {
  it('accepts Visa test PAN', () => {
    // common Luhn-valid test number
    expect(validateCardLuhn('4111111111111111').valid).toBe(true);
  });
});

describe('validateEan13', () => {
  it('accepts known EAN', () => {
    expect(validateEan13('5901234123457').valid).toBe(true);
  });
});
