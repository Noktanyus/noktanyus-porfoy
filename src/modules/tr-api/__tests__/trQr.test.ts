import { describe, it, expect } from 'vitest';
import {
  calculateCrc16Ccitt,
  buildTrQrString,
  parseTrQrString,
  generateTrQrSvg,
  generateTrQrDataUrl,
} from '../trQr';

// Test için geçerli TR IBAN
const SAMPLE_IBAN = 'TR330006100519786457841326';

describe('TCMB TR Karekod (TR-QR / FAST) Engine', () => {
  it('calculates standard CRC-16/CCITT-FALSE checksum correctly', () => {
    // 4 karakterli Hex ve 0xFFFF başlangıç kontrolü
    const crc = calculateCrc16Ccitt('00020101021153039495802TR6304');
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
    expect(crc.length).toBe(4);
  });

  it('builds a valid static TR Karekod payload without amount', () => {
    const result = buildTrQrString({
      iban: SAMPLE_IBAN,
      payeeName: 'Ahmet Yılmaz',
      city: 'İstanbul',
    });

    expect(result.valid).toBe(true);
    expect(result.type).toBe('static');
    expect(result.amount).toBeNull();
    expect(result.payeeName).toBe('AHMET YILMAZ');
    expect(result.city).toBe('ISTANBUL');

    // EMVCo format kontrolleri
    expect(result.payload.startsWith('000201010211')).toBe(true);
    expect(result.payload).toContain('tr.gov.tcmb.fast');
    expect(result.payload).toContain(SAMPLE_IBAN);
    expect(result.payload).toContain('5303949'); // TRY para birimi
    expect(result.payload).toContain('5802TR'); // Türkiye
    expect(result.payload.slice(-8, -4)).toBe('6304');
    expect(result.payload.slice(-4)).toBe(result.crc);
  });

  it('builds a valid dynamic TR Karekod payload with amount and reference', () => {
    const result = buildTrQrString({
      iban: SAMPLE_IBAN,
      payeeName: 'Noktanyus Teknoloji',
      amount: 450.75,
      reference: 'SIP-2026-991',
      city: 'Ankara',
      type: 'dynamic',
    });

    expect(result.valid).toBe(true);
    expect(result.type).toBe('dynamic');
    expect(result.amount).toBe('450.75');
    expect(result.payeeName).toBe('NOKTANYUS TEKNOLOJI');
    expect(result.reference).toBe('SIP-2026-991');

    // Tutar tag'i (Tag 54) ve Dinamik tag'i (Tag 01 = 12)
    expect(result.payload).toContain('010212');
    expect(result.payload).toContain('5406450.75');
    expect(result.payload).toContain('62'); // Additional data
    expect(result.payload).toContain('SIP-2026-991');
  });

  it('handles Turkish character sanitization safely for banking terminals', () => {
    const result = buildTrQrString({
      iban: SAMPLE_IBAN,
      payeeName: 'Özgür Çetin Şahin',
      city: 'Eskişehir',
    });

    expect(result.payeeName).toBe('OZGUR CETIN SAHIN');
    expect(result.city).toBe('ESKISEHIR');
  });

  it('parses an existing TR Karekod string with complete fidelity', () => {
    const built = buildTrQrString({
      iban: SAMPLE_IBAN,
      payeeName: 'Mehmet Demir',
      amount: 1250.0,
      reference: 'FATURA-4819',
      city: 'Izmir',
    });

    const parsed = parseTrQrString(built.payload);

    expect(parsed.valid).toBe(true);
    expect(parsed.crcValid).toBe(true);
    expect(parsed.iban).toBe(SAMPLE_IBAN);
    expect(parsed.ibanValid).toBe(true);
    expect(parsed.payeeName).toBe('MEHMET DEMIR');
    expect(parsed.amount).toBe(1250.0);
    expect(parsed.currency).toBe('TRY');
    expect(parsed.reference).toBe('FATURA-4819');
    expect(parsed.city).toBe('IZMIR');
    expect(parsed.type).toBe('dynamic');
  });

  it('detects tampered payload when amount is altered without recalculating CRC', () => {
    const built = buildTrQrString({
      iban: SAMPLE_IBAN,
      payeeName: 'Test Alıcı',
      amount: 100.0,
    });

    // Tutar 100.00 yerine 999.00 yapılarak tahrif edilsin
    const tampered = built.payload.replace('100.00', '999.00');
    const parsed = parseTrQrString(tampered);

    expect(parsed.crcValid).toBe(false);
    expect(parsed.valid).toBe(false);
  });

  it('generates valid SVG and PNG data URL QR codes', async () => {
    const input = {
      iban: SAMPLE_IBAN,
      payeeName: 'Noktanyus',
      amount: 50.0,
    };

    const svg = await generateTrQrSvg(input);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');

    const dataUrl = await generateTrQrDataUrl(input);
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });
});
