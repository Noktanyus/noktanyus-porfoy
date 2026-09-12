/**
 * PayTR Direkt API — sunucu tarafı yardımcılar.
 *
 * Kart bilgileri ASLA bu sunucuya POST edilmez; form doğrudan
 * https://www.paytr.com/odeme adresine gider. Burada yalnızca token
 * üretimi ve callback hash doğrulaması yapılır.
 *
 * Docs: https://dev.paytr.com/direkt-api/direkt-api-1-adim
 */

import crypto from 'crypto';

export const PAYTR_PAYMENT_URL = 'https://www.paytr.com/odeme';

export function isPaytrConfigured(): boolean {
  return Boolean(
    process.env.PAYTR_MERCHANT_ID?.trim() &&
      process.env.PAYTR_MERCHANT_KEY?.trim() &&
      process.env.PAYTR_MERCHANT_SALT?.trim()
  );
}

export function getPaytrConfig() {
  if (!isPaytrConfigured()) {
    throw new Error(
      '[PayTR] PAYTR_MERCHANT_ID / PAYTR_MERCHANT_KEY / PAYTR_MERCHANT_SALT gerekli'
    );
  }
  return {
    merchantId: process.env.PAYTR_MERCHANT_ID!.trim(),
    merchantKey: process.env.PAYTR_MERCHANT_KEY!.trim(),
    merchantSalt: process.env.PAYTR_MERCHANT_SALT!.trim(),
    testMode: process.env.PAYTR_TEST_MODE === '1' ? '1' : '0',
    debugOn: process.env.PAYTR_DEBUG_ON === '0' ? '0' : '1',
    /** 0 = 3D Secure (önerilen), 1 = non-3D (mağaza yetkisi gerekir) */
    non3d: process.env.PAYTR_NON_3D === '1' ? '1' : '0',
  };
}

/** Sipariş no → PayTR merchant_oid (alfanumerik, max 64). */
export function toPaytrMerchantOid(orderNumber: string): string {
  const oid = orderNumber.replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);
  if (!oid) {
    throw new Error('[PayTR] Geçersiz merchant_oid');
  }
  return oid;
}

/** Kuruş → "199.00" (Direkt API payment_amount). */
export function centsToPaytrAmount(cents: number): string {
  return (Math.max(0, cents) / 100).toFixed(2);
}

/**
 * Sepet: [[ürün adı, birim fiyat string, adet], ...]
 * Form alanı olarak JSON string gönderilir.
 */
export function buildPaytrBasket(
  lines: Array<{ name: string; priceCents: number; quantity: number }>
): string {
  const basket = lines.map((line) => [
    line.name.slice(0, 120),
    centsToPaytrAmount(line.priceCents),
    Math.max(1, line.quantity),
  ]);
  return JSON.stringify(basket);
}

/** E-posta: PayTR Türkçe karakter istemiyor. */
export function sanitizePaytrEmail(email: string): string {
  return email
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[ıİ]/g, 'i')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .trim()
    .toLowerCase()
    .slice(0, 100);
}

/**
 * Direkt API token:
 * hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount
 *          + payment_type + installment_count + currency + test_mode + non_3d
 * token = base64(hmac_sha256(hash_str + merchant_salt, merchant_key))
 */
export function createDirectPaytrToken(input: {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: string;
  paymentType: string;
  installmentCount: string;
  currency: string;
  testMode: string;
  non3d: string;
}): string {
  const hashStr =
    input.merchantId +
    input.userIp +
    input.merchantOid +
    input.email +
    input.paymentAmount +
    input.paymentType +
    input.installmentCount +
    input.currency +
    input.testMode +
    input.non3d;

  return crypto
    .createHmac('sha256', input.merchantKey)
    .update(hashStr + input.merchantSalt, 'utf8')
    .digest('base64');
}

/**
 * Callback hash:
 * merchant_oid + merchant_salt + status + total_amount
 */
export function verifyPaytrCallbackHash(input: {
  merchantKey: string;
  merchantSalt: string;
  merchantOid: string;
  status: string;
  totalAmount: string;
  hash: string;
}): boolean {
  const expected = crypto
    .createHmac('sha256', input.merchantKey)
    .update(
      input.merchantOid + input.merchantSalt + input.status + input.totalAmount,
      'utf8'
    )
    .digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(input.hash || '');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function extractClientIp(headers: Headers, fallback = '127.0.0.1'): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 39);
  }
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real.slice(0, 39);
  return fallback.slice(0, 39);
}
