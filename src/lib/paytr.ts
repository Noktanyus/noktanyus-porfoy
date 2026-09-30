/**
 * PayTR yardımcılar — iFrame API (birincil) + Direkt API (opsiyonel) +
 * callback / iade / durum sorgu / işlem dökümü.
 *
 * Docs:
 * - https://dev.paytr.com/iframe-api
 * - https://dev.paytr.com/havale-eft-iframe-api
 * - https://dev.paytr.com/iade-api
 * - https://dev.paytr.com/durum-sorgu
 * - https://dev.paytr.com/islem-dokumu
 */

import crypto from 'crypto';

export const PAYTR_GET_TOKEN_URL = 'https://www.paytr.com/odeme/api/get-token';
export const PAYTR_PAYMENT_URL = 'https://www.paytr.com/odeme';
export const PAYTR_IFRAME_CARD_BASE = 'https://www.paytr.com/odeme/guvenli';
export const PAYTR_IFRAME_EFT_BASE = 'https://www.paytr.com/odeme/api';
export const PAYTR_REFUND_URL = 'https://www.paytr.com/odeme/iade';
export const PAYTR_STATUS_URL = 'https://www.paytr.com/odeme/durum-sorgu';
export const PAYTR_REPORT_URL = 'https://www.paytr.com/rapor/islem-dokumu';

export type PaytrCheckoutMode = 'iframe' | 'direct';
export type PaytrPaymentType = 'card' | 'eft';

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
  const checkoutMode =
    process.env.PAYTR_CHECKOUT_MODE === 'direct' ? 'direct' : 'iframe';
  return {
    merchantId: process.env.PAYTR_MERCHANT_ID!.trim(),
    merchantKey: process.env.PAYTR_MERCHANT_KEY!.trim(),
    merchantSalt: process.env.PAYTR_MERCHANT_SALT!.trim(),
    testMode: process.env.PAYTR_TEST_MODE === '1' ? '1' : '0',
    debugOn: process.env.PAYTR_DEBUG_ON === '0' ? '0' : '1',
    /** 0 = 3D Secure (önerilen), 1 = non-3D (mağaza yetkisi gerekir) — yalnızca Direkt API */
    non3d: process.env.PAYTR_NON_3D === '1' ? '1' : '0',
    checkoutMode: checkoutMode as PaytrCheckoutMode,
    noInstallment: process.env.PAYTR_NO_INSTALLMENT === '1' ? '1' : '0',
    maxInstallment: process.env.PAYTR_MAX_INSTALLMENT?.trim() || '0',
    timeoutLimit: process.env.PAYTR_TIMEOUT_LIMIT?.trim() || '30',
    eftEnabled: process.env.PAYTR_EFT_ENABLED === '1',
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

/** Kuruş → "199.00" (Direkt API payment_amount / sepet birim fiyat). */
export function centsToPaytrAmount(cents: number): string {
  return (Math.max(0, cents) / 100).toFixed(2);
}

/** iFrame API: tutar kuruş cinsinden string (34.56 TL → "3456"). */
export function centsToPaytrIframeAmount(cents: number): string {
  return String(Math.max(0, Math.round(cents)));
}

/**
 * Direkt API sepet: JSON string [[ad, fiyat, adet], ...]
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

/**
 * iFrame API sepet: base64(JSON([[ad, fiyat, adet], ...]))
 * Token hash'inde bu base64 string kullanılır.
 */
export function buildPaytrIframeBasket(
  lines: Array<{ name: string; priceCents: number; quantity: number }>
): string {
  const basket = lines.map((line) => [
    line.name.slice(0, 120),
    centsToPaytrAmount(line.priceCents),
    Math.max(1, line.quantity),
  ]);
  return Buffer.from(JSON.stringify(basket), 'utf8').toString('base64');
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

function hmacBase64(key: string, data: string): string {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest('base64');
}

/**
 * iFrame (kart) token:
 * hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount
 *          + user_basket + no_installment + max_installment + currency + test_mode
 * token = base64(hmac_sha256(hash_str + merchant_salt, merchant_key))
 */
export function createIframePaytrToken(input: {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: string;
  userBasket: string;
  noInstallment: string;
  maxInstallment: string;
  currency: string;
  testMode: string;
}): string {
  const hashStr =
    input.merchantId +
    input.userIp +
    input.merchantOid +
    input.email +
    input.paymentAmount +
    input.userBasket +
    input.noInstallment +
    input.maxInstallment +
    input.currency +
    input.testMode;
  return hmacBase64(input.merchantKey, hashStr + input.merchantSalt);
}

/**
 * Havale/EFT iFrame token:
 * hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount
 *          + payment_type + test_mode
 */
export function createEftIframePaytrToken(input: {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: string;
  paymentType: string;
  testMode: string;
}): string {
  const hashStr =
    input.merchantId +
    input.userIp +
    input.merchantOid +
    input.email +
    input.paymentAmount +
    input.paymentType +
    input.testMode;
  return hmacBase64(input.merchantKey, hashStr + input.merchantSalt);
}

/**
 * Direkt API token:
 * hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount
 *          + payment_type + installment_count + currency + test_mode + non_3d
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
  return hmacBase64(input.merchantKey, hashStr + input.merchantSalt);
}

/**
 * Callback hash: merchant_oid + merchant_salt + status + total_amount
 */
export function verifyPaytrCallbackHash(input: {
  merchantKey: string;
  merchantSalt: string;
  merchantOid: string;
  status: string;
  totalAmount: string;
  hash: string;
}): boolean {
  const expected = hmacBase64(
    input.merchantKey,
    input.merchantOid + input.merchantSalt + input.status + input.totalAmount
  );
  const a = Buffer.from(expected);
  const b = Buffer.from(input.hash || '');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** İade token: merchant_id + merchant_oid + return_amount + merchant_salt */
export function createRefundPaytrToken(input: {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  merchantOid: string;
  returnAmount: string;
}): string {
  return hmacBase64(
    input.merchantKey,
    input.merchantId + input.merchantOid + input.returnAmount + input.merchantSalt
  );
}

/** Durum sorgu token: merchant_id + merchant_oid + merchant_salt */
export function createStatusPaytrToken(input: {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  merchantOid: string;
}): string {
  return hmacBase64(
    input.merchantKey,
    input.merchantId + input.merchantOid + input.merchantSalt
  );
}

/** İşlem dökümü token: merchant_id + start_date + end_date + merchant_salt */
export function createReportPaytrToken(input: {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  startDate: string;
  endDate: string;
}): string {
  return hmacBase64(
    input.merchantKey,
    input.merchantId + input.startDate + input.endDate + input.merchantSalt
  );
}

export function iframeUrlForToken(
  token: string,
  paymentType: PaytrPaymentType = 'card'
): string {
  const base =
    paymentType === 'eft' ? PAYTR_IFRAME_EFT_BASE : PAYTR_IFRAME_CARD_BASE;
  return `${base}/${token}`;
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
