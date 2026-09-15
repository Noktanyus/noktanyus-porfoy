/**
 * TR API extras unit tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateKdvWithholding,
  calculateSeverance,
  calculateBusinessDays,
  amountToTurkishWords,
} from '../extras';
import { validateEmailMx } from '../emailMx';

describe('calculateKdvWithholding', () => {
  it('splits 5/10 withholding on 20% VAT', () => {
    const r = calculateKdvWithholding({
      amountCents: 10000,
      vatRate: 20,
      mode: 'net',
      withholding: '5/10',
    });
    expect(r.vatCents).toBe(2000);
    expect(r.withholdingCents).toBe(1000);
    expect(r.payableToSellerCents).toBe(11000);
    expect(r.remittedByBuyerCents).toBe(1000);
  });
});

describe('calculateSeverance', () => {
  it('computes notice weeks for long tenure', () => {
    const r = calculateSeverance({
      monthlyGrossCents: 5000000,
      startDate: '2020-01-01',
      endDate: '2025-01-01',
      severanceCeilingCents: 4000000,
    });
    expect(r.noticeWeeks).toBe(8);
    expect(r.cappedMonthlyCents).toBe(4000000);
    expect(r.severanceNetCents).toBeLessThan(r.severanceGrossCents);
  });
});

describe('calculateBusinessDays', () => {
  it('skips weekends and New Year', () => {
    const r = calculateBusinessDays({
      startDate: '2025-01-01',
      endDate: '2025-01-05',
    });
    // 1 Wed holiday, 2 Thu, 3 Fri, 4 Sat, 5 Sun → 2 business days
    expect(r.businessDays).toBe(2);
    expect(r.holidaysTouched).toContain('2025-01-01');
  });
});

describe('amountToTurkishWords', () => {
  it('converts simple TRY amount', () => {
    const r = amountToTurkishWords({ amountCents: 12550 });
    expect(r.words).toContain('yüz yirmi beş');
    expect(r.words).toContain('Türk Lirası');
    expect(r.words).toContain('elli');
    expect(r.words).toContain('Kuruş');
  });
});

describe('validateEmailMx', () => {
  it('rejects bad format', async () => {
    const r = await validateEmailMx('not-an-email');
    expect(r.valid).toBe(false);
  });
});
