/**
 * Stripe Browser SDK Loader
 *
 * @stripe/stripe-js singleton pattern. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 * tanımlı değilse null döner (mock mode).
 */

import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<unknown> | null = null;

export function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      // eslint-disable-next-line no-console
      console.warn('[Stripe Client] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export function isStripeClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}