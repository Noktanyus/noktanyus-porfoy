import { describe, expect, it } from 'vitest';
import {
  autoValidateTr,
  buildTrKarekodP2P,
  buildTurkishIban,
  crc16CcittFalse,
  normalizeTurkishText,
} from '../builders';
import { validateIban } from '../validators';

describe('buildTurkishIban', () => {
  it('üretir ve MOD-97 geçer', () => {
    const r = buildTurkishIban({
      bankCode: '00061',
      accountNumber: '0519786457841326',
    });
    expect(r.ok).toBe(true);
    expect(r.iban).toBe('TR330006100519786457841326');
    expect(validateIban(r.iban!).valid).toBe(true);
  });
});

describe('normalizeTurkishText', () => {
  it('slug üretir', () => {
    const r = normalizeTurkishText({ text: 'İstanbul Şişli', mode: 'slug' });
    expect(r.normalized).toBe('istanbul-sisli');
  });
});

describe('crc16CcittFalse', () => {
  it('TCMB örnek trailer ile eşleşir', () => {
    const body =
      '750210010212020400100310RFR234510106122005291401590712200530140159541200000001505061460126TR1234567890123456789012340712HASAN YILDIZ1002032032F93CC13E3E6410C1BADEEAF349E09A56501639939423328517916304';
    expect(crc16CcittFalse(body)).toBe('7CE6');
  });
});

describe('buildTrKarekodP2P', () => {
  it('statik payload + CRC üretir', () => {
    const r = buildTrKarekodP2P({
      iban: 'TR330006100519786457841326',
      name: 'Ali Yilmaz',
    });
    expect(r.ok).toBe(true);
    expect(r.payload).toMatch(/^750210010211/);
    expect(r.payload!.endsWith(crc16CcittFalse(r.payload!.slice(0, -4)))).toBe(true);
    expect(r.flow).toBe('static');
  });
});

describe('autoValidateTr', () => {
  it('TCKN tespit eder', () => {
    const r = autoValidateTr('10000000146');
    expect(r.detected).toBe('tckn');
    expect(r.valid).toBe(true);
  });

  it('IBAN tespit eder', () => {
    const r = autoValidateTr('TR33 0006 1005 1978 6457 8413 26');
    expect(r.detected).toBe('iban');
    expect(r.valid).toBe(true);
  });
});
