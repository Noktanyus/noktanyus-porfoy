/**
 * PayTR Direkt API — hash / OID / sepet yardımcıları
 */

import crypto from 'crypto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  buildPaytrBasket,
  centsToPaytrAmount,
  createDirectPaytrToken,
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

  it('sanitizePaytrEmail removes Turkish chars', () => {
    expect(sanitizePaytrEmail('İbrahim@Örnek.com')).toBe('ibrahim@ornek.com');
  });

  it('buildPaytrBasket produces JSON array', () => {
    const basket = buildPaytrBasket([
      { name: 'Ürün', priceCents: 1000, quantity: 2 },
    ]);
    expect(JSON.parse(basket)).toEqual([['Ürün', '10.00', 2]]);
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
