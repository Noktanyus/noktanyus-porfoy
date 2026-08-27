/**
 * Stripe Server SDK Configuration
 *
 * Sunucu tarafı Stripe SDK instance'ı. STRIPE_SECRET_KEY tanımlı değilse
 * mock mode'da çalışır (development için faydalı).
 *
 * Lazy initialization: SDK sadece ilk kullanımda (ve STRIPE_SECRET_KEY varsa)
 * init edilir. Build sırasında hiçbir istek atılmaz.
 */

import Stripe from 'stripe';

let _stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      '[Stripe] STRIPE_SECRET_KEY not configured — use isStripeConfigured() check before calling getStripe()'
    );
  }
  if (!_stripeInstance) {
    _stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-07-29.dahlia',
      typescript: true,
    });
  }
  return _stripeInstance;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
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
