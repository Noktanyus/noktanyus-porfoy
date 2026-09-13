/**
 * License-free API algorithms — unit tests
 */

import { describe, it, expect } from 'vitest';
import { validateGln, validateSscc, gs1CheckDigit } from '../gs1';
import { validateLei, validateMic, validateFigi } from '../financeIds';
import { verhoeffValidate, verhoeffGenerate, dammValidate } from '../checksumAlgo';
import { validateAwb, validateImo } from '../transportIds';
import { validateOrcid, validateDoi } from '../academicIds';
import { validateCpf, validateSpanishDni, validateAadhaar } from '../nationalIds';
import { validateClabe, validateBelgiumOgm } from '../localPayments';
import { validateMac, validateSemver, validateColorHex, validatePort } from '../formatIds';
import { validateEthAddressEip55 } from '../cryptoStrong';
import { reorderPoint, stripeConnectSplit } from '../commerceMath';
import { listTrProvinces, validateDomainTld, validatePhoneGlobal } from '../openData';

describe('GS1', () => {
  it('computes check digit and validates GLN / SSCC', () => {
    const body = '061414112345';
    const cd = gs1CheckDigit(body);
    expect(validateGln(body + String(cd)).valid).toBe(true);
    const ssccBody = '1'.repeat(17);
    expect(validateSscc(ssccBody + String(gs1CheckDigit(ssccBody))).valid).toBe(true);
  });
});

describe('finance IDs', () => {
  it('validates LEI length/charset', () => {
    expect(validateLei('5493001KJTIIGC8Y1R12').valid).toBe(true);
  });
  it('validates MIC', () => {
    expect(validateMic('XNYS').valid).toBe(true);
  });
  it('rejects short FIGI', () => {
    expect(validateFigi('BBG').valid).toBe(false);
  });
});

describe('checksum algorithms', () => {
  it('verhoeff roundtrip', () => {
    const full = verhoeffGenerate('236');
    expect(verhoeffValidate(full).valid).toBe(true);
  });
  it('damm accepts known valid', () => {
    // Wikipedia: 572 → check digit 4
    expect(dammValidate('5724').valid).toBe(true);
  });
});

describe('transport', () => {
  it('AWB check digit', () => {
    const serial = '1234567';
    const check = Number(serial) % 7;
    expect(validateAwb(`123${serial}${check}`).valid).toBe(true);
  });
  it('IMO', () => {
    // 907472 * weights → known IMO 9074729
    expect(validateImo('9074729').valid).toBe(true);
  });
});

describe('academic', () => {
  it('ORCID checksum', () => {
    expect(validateOrcid('0000-0002-1825-0097').valid).toBe(true);
  });
  it('DOI prefix', () => {
    expect(validateDoi('10.1000/xyz123').valid).toBe(true);
  });
});

describe('national / payments', () => {
  it('CPF', () => {
    expect(validateCpf('529.982.247-25').valid).toBe(true);
  });
  it('DNI letter', () => {
    expect(validateSpanishDni('12345678Z').valid).toBe(true);
  });
  it('Aadhaar via Verhoeff generate', () => {
    const full = verhoeffGenerate('99999999001');
    expect(full).toHaveLength(12);
    expect(validateAadhaar(full).valid).toBe(true);
  });
  it('CLABE checksum formula', () => {
    // Build valid CLABE: 17 digits + check
    const body = '00201007777777777';
    const weights = [3, 7, 1];
    let sum = 0;
    for (let i = 0; i < 17; i++) sum += (Number(body[i]) * weights[i % 3]!) % 10;
    const check = (10 - (sum % 10)) % 10;
    expect(validateClabe(body + String(check)).valid).toBe(true);
  });
  it('Belgium OGM mod97', () => {
    const base = '1234567890';
    const rem = Number(base) % 97;
    const check = rem === 0 ? 97 : rem;
    expect(validateBelgiumOgm(base + String(check).padStart(2, '0')).valid).toBe(true);
  });
});

describe('format + crypto + commerce', () => {
  it('MAC / semver / color / port', () => {
    expect(validateMac('00:1A:2B:3C:4D:5E').valid).toBe(true);
    expect(validateSemver('1.2.3-beta.1').valid).toBe(true);
    expect(validateColorHex('#0af').valid).toBe(true);
    expect(validatePort(443).valid).toBe(true);
  });
  it('EIP-55 lowercase accepted', () => {
    expect(validateEthAddressEip55('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed').valid).toBe(true);
  });
  it('reorder + stripe split', () => {
    const r = reorderPoint({ dailyDemand: 10, leadTimeDays: 5, safetyStock: 20, currentStock: 60 });
    expect(r.reorderPoint).toBe(70);
    expect(r.shouldReorder).toBe(true);
    const s = stripeConnectSplit({ chargeCents: 10000, applicationFeeCents: 100 });
    expect(s.sellerCents).toBeLessThan(10000);
  });
});

describe('open data helpers', () => {
  it('lists 81 provinces including Rize', () => {
    const list = listTrProvinces();
    expect(list).toHaveLength(81);
    expect(list.find((p) => p.id === 53)?.name).toBe(['R', 'i', 'z', 'e'].join(''));
  });
  it('TLD + phone global', () => {
    expect(validateDomainTld('example.com').valid).toBe(true);
    expect(validatePhoneGlobal({ phone: '+905321234567' }).valid).toBe(true);
  });
});
