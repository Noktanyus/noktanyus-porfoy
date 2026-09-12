/**
 * Stripe Server SDK Configuration
 *
 * Sunucu tarafı Stripe SDK instance'ı. STRIPE_SECRET_KEY tanımlı değilse
 * mock mode'da çalışır (development için faydalı).
 *
 * Lazy initialization: SDK sadece ilk kullanımda (ve STRIPE_SECRET_KEY varsa)
 * init edilir. Build sırasında hiçbir istek atılmaz.
 *
 * API version:
 *   Stripe paketinin kendi `LatestApiVersion` tipi ile uyumlu sabit
 *   kullanılır. Configurable yapılmak istenirse STRIPE_API_VERSION env
 *   değeri parse edilir ve `parseStripeApiVersion` ile tipe dönüştürülür
 *   (geçersiz değerlerde package default'a fallback).
 */

import Stripe from 'stripe';

/**
 * Stripe SDK'sının güncel LatestApiVersion değerini tip-güvenli şekilde
 * dışa aktarır. Stripe paketi `API_VERSION`'ı static olarak export eder;
 * SDK yükseltildiğinde API version otomatik olarak güncellenir. Configurable
 * yapılmak istenirse STRIPE_API_VERSION env'i parse edilip
 * `parseStripeApiVersion` ile tipe dönüştürülür (geçersiz değerlerde
 * package default'a fallback).
 */
export const STRIPE_API_VERSION: Stripe.LatestApiVersion =
  Stripe.API_VERSION as Stripe.LatestApiVersion;

let _stripeInstance: Stripe | null = null;

/**
 * Stripe secret key'i process.env üzerinden okur (lazy). Test ortamında
 * vitest.setup.ts tarafından override edilebilir.
 */
function getStripeSecretKey(): string | undefined {
  const raw = process.env.STRIPE_SECRET_KEY;
  return raw && raw.trim().length > 0 ? raw : undefined;
}

export function getStripe(): Stripe {
  const secret = getStripeSecretKey();
  if (!secret) {
    throw new Error(
      '[Stripe] STRIPE_SECRET_KEY not configured — use isStripeConfigured() check before calling getStripe()'
    );
  }
  if (!_stripeInstance) {
    _stripeInstance = new Stripe(secret, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
  }
  return _stripeInstance;
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeSecretKey());
}

/**
 * @deprecated Doğrudan import etme — getStripe() + isStripeConfigured() kullan.
 * Build sırasında hata atmaması için proxy.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!isStripeConfigured()) {
      throw new Error('[Stripe] Not configured. Use isStripeConfigured() first.');
    }
    return (getStripe() as any)[prop];
  },
});