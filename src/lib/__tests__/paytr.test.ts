/**
 * PayTR iFrame / Direkt / callback / iade token yardımcıları
 */

import crypto from 'crypto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  buildPaytrBasket,
  buildPaytrIframeBasket,
  centsToPaytrAmount,
  centsToPaytrIframeAmount,
  createDirectPaytrToken,
  createEftIframePaytrToken,
  createIframePaytrToken,
  createRefundPaytrToken,
  createStatusPaytrToken,
  iframeUrlForToken,
  sanitizePaytrEmail,
  toPaytrMerchantOid,
  verifyPaytrCallbackHash,
} from '@/lib/paytr';

describe('paytr helpers', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.PAYTR_MERCHANT_ID = '123456';
    process.env.PAYTR_MERCHANT_KEY = 'testkey';
    process.env.PAYTR_MERCHANT_SALT = 'testsalt';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('toPaytrMerchantOid strips non-alphanumeric', () => {
    expect(toPaytrMerchantOid('NK-2026-AB12')).toBe('NK2026AB12');
  });

  it('centsToPaytrAmount formats TL', () => {
    expect(centsToPaytrAmount(19900)).toBe('199.00');
    expect(centsToPaytrAmount(50)).toBe('0.50');
  });

  it('centsToPaytrIframeAmount is integer kuruş', () => {
    expect(centsToPaytrIframeAmount(3456)).toBe('3456');
    expect(centsToPaytrIframeAmount(999)).toBe('999');
  });

  it('sanitizePaytrEmail removes Turkish chars', () => {
    expect(sanitizePaytrEmail('İbrahim@Örnek.com')).toBe('ibrahim@ornek.com');
  });

  it('buildPaytrBasket produces JSON array', () => {
    const basket = buildPaytrBasket([
      { name: 'Ürün', priceCents: 1000, quantity: 2 },
    ]);
    expect(JSON.parse(basket)).toEqual([['Ürün', '10.00', 2]]);
  });

  it('buildPaytrIframeBasket is base64 JSON', () => {
    const b64 = buildPaytrIframeBasket([
      { name: 'Ürün', priceCents: 1000, quantity: 2 },
    ]);
    const decoded = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    expect(decoded).toEqual([['Ürün', '10.00', 2]]);
  });

  it('iframe card token matches PayTR hash formula', () => {
    const userBasket = buildPaytrIframeBasket([
      { name: 'Test', priceCents: 1000, quantity: 1 },
    ]);
    const token = createIframePaytrToken({
      merchantId: '123456',
      merchantKey: 'testkey',
      merchantSalt: 'testsalt',
      userIp: '1.2.3.4',
      merchantOid: 'OID1',
      email: 'a@b.com',
      paymentAmount: '1000',
      userBasket,
      noInstallment: '0',
      maxInstallment: '0',
      currency: 'TL',
      testMode: '0',
    });
    const expected = crypto
      .createHmac('sha256', 'testkey')
      .update(
        '123456' +
          '1.2.3.4' +
          'OID1' +
          'a@b.com' +
          '1000' +
          userBasket +
          '0' +
          '0' +
          'TL' +
          '0' +
          'testsalt',
        'utf8'
      )
      .digest('base64');
    expect(token).toBe(expected);
  });

  it('eft iframe token matches formula', () => {
    const token = createEftIframePaytrToken({
      merchantId: '123456',
      merchantKey: 'testkey',
      merchantSalt: 'testsalt',
      userIp: '1.2.3.4',
      merchantOid: 'OID1',
      email: 'a@b.com',
      paymentAmount: '1000',
      paymentType: 'eft',
      testMode: '0',
    });
    const expected = crypto
      .createHmac('sha256', 'testkey')
      .update('1234561.2.3.4OID1a@b.com1000eft0testsalt', 'utf8')
      .digest('base64');
    expect(token).toBe(expected);
  });

  it('iframeUrlForToken uses correct base', () => {
    expect(iframeUrlForToken('tok123', 'card')).toBe(
      'https://www.paytr.com/odeme/guvenli/tok123'
    );
    expect(iframeUrlForToken('tok123', 'eft')).toBe(
      'https://www.paytr.com/odeme/api/tok123'
    );
  });

  it('refund + status tokens', () => {
    expect(
      createRefundPaytrToken({
        merchantId: '123456',
        merchantKey: 'testkey',
        merchantSalt: 'testsalt',
        merchantOid: 'OID1',
        returnAmount: '10.00',
      })
    ).toBe(
      crypto
        .createHmac('sha256', 'testkey')
        .update('123456OID110.00testsalt', 'utf8')
        .digest('base64')
    );
    expect(
      createStatusPaytrToken({
        merchantId: '123456',
        merchantKey: 'testkey',
        merchantSalt: 'testsalt',
        merchantOid: 'OID1',
      })
    ).toBe(
      crypto
        .createHmac('sha256', 'testkey')
        .update('123456OID1testsalt', 'utf8')
        .digest('base64')
    );
  });

  it('token + callback hash round-trip consistency', () => {
    const token = createDirectPaytrToken({
      merchantId: '123456',
      merchantKey: 'testkey',
      merchantSalt: 'testsalt',
      userIp: '1.2.3.4',
      merchantOid: 'OID1',
      email: 'a@b.com',
      paymentAmount: '10.00',
      paymentType: 'card',
      installmentCount: '0',
      currency: 'TL',
      testMode: '1',
      non3d: '0',
    });
    expect(token.length).toBeGreaterThan(20);

    const hash = crypto
      .createHmac('sha256', 'testkey')
      .update('OID1' + 'testsalt' + 'success' + '1000', 'utf8')
      .digest('base64');

    expect(
      verifyPaytrCallbackHash({
        merchantKey: 'testkey',
        merchantSalt: 'testsalt',
        merchantOid: 'OID1',
        status: 'success',
        totalAmount: '1000',
        hash,
      })
    ).toBe(true);
  });
});
