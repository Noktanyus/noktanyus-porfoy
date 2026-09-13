import { describe, it, expect } from 'vitest';
import {
  validateVin,
  validateContainer,
  validateIsbn13,
  validateAbaRouting,
  validateBic,
  validateGtin,
  processCreditorReference,
  validateUuid,
  validateIp,
} from '../checksums';
import { convertUnit, validateMersis, validateKep, parseTurkishAddress } from '../tools';
import { nextBusinessDay, isTurkishBusinessDay } from '../extras';
import { runBatchValidate } from '../batch';

describe('validateVin', () => {
  it('rejects short vin', () => {
    expect(validateVin('SHORT').valid).toBe(false);
  });
});

describe('validateContainer', () => {
  it('rejects bad format', () => {
    expect(validateContainer('ABCD').valid).toBe(false);
  });
});

describe('validateIsbn13', () => {
  it('accepts known ISBN', () => {
    expect(validateIsbn13('9780306406157').valid).toBe(true);
  });
});

describe('validateAbaRouting', () => {
  it('accepts known ABA', () => {
    expect(validateAbaRouting('021000021').valid).toBe(true);
  });
});

describe('validateBic', () => {
  it('accepts 8-char BIC', () => {
    expect(validateBic('DEUTDEFF').valid).toBe(true);
  });
});

describe('validateGtin', () => {
  it('accepts EAN-13 as GTIN', () => {
    expect(validateGtin('5901234123457').valid).toBe(true);
  });
});

describe('processCreditorReference', () => {
  it('encodes payload', () => {
    const r = processCreditorReference({ payload: '123' });
    expect(r.reference.startsWith('RF')).toBe(true);
    expect(r.valid).toBe(true);
  });
});

describe('validateUuid', () => {
  it('accepts v4', () => {
    expect(validateUuid('550e8400-e29b-41d4-a716-446655440000').valid).toBe(true);
  });
});

describe('validateIp', () => {
  it('accepts ipv4', () => {
    expect(validateIp('8.8.8.8').valid).toBe(true);
  });
});

describe('convertUnit', () => {
  it('converts km to m', () => {
    expect(convertUnit({ category: 'length', from: 'km', to: 'm', value: 1 }).result).toBe(1000);
  });
});

describe('validateMersis/kep', () => {
  it('mersis length', () => {
    expect(validateMersis('1234567890123456').valid).toBe(true);
  });
  it('kep domain', () => {
    expect(validateKep('ali@ornek.kep.tr').valid).toBe(true);
  });
});

describe('parseTurkishAddress', () => {
  it('finds istanbul', () => {
    const r = parseTurkishAddress('Cadde No:1 Kadıköy İstanbul 34710');
    expect(r.provinceCode).toBe('34');
    expect(r.postalCode).toBe('34710');
  });
});

describe('calendar helpers', () => {
  it('new year is not business day', () => {
    expect(isTurkishBusinessDay('2025-01-01').isBusinessDay).toBe(false);
  });
  it('next business after new year', () => {
    const r = nextBusinessDay({ date: '2025-01-01', count: 1 });
    expect(r.resultDate).toBe('2025-01-02');
  });
});

describe('batch', () => {
  it('runs multiple ibans', () => {
    const r = runBatchValidate({
      type: 'iban',
      values: ['TR33 0006 1005 1978 6457 8413 26', 'bad'],
    });
    expect(r.count).toBe(2);
  });
});
