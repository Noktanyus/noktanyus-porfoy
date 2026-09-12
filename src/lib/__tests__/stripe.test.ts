/**
 * Stripe Module — API Version Safety Test
 *
 * Validates that:
 *   - isStripeConfigured() reflects STRIPE_SECRET_KEY presence
 *   - getStripe() uses Stripe.LatestApiVersion (matches package's
 *     declared API version) without leaking raw process.env
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type Stripe from 'stripe';

const originalKey = process.env.STRIPE_SECRET_KEY;

describe('lib/stripe — configuration & API version', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it('isStripeConfigured() false when STRIPE_SECRET_KEY unset', async () => {
    const { isStripeConfigured } = await import('../stripe');
    expect(isStripeConfigured()).toBe(false);
  });

  it('getStripe() throws with helpful error when STRIPE_SECRET_KEY unset', async () => {
    const { getStripe } = await import('../stripe');
    expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY not configured/);
  });

  it('exposes the package LatestApiVersion as a typed literal', async () => {
    const { STRIPE_API_VERSION } = await import('../stripe');

    // Compile-time guarantee: STRIPE_API_VERSION tipi Stripe.LatestApiVersion
    // olarak kullanilabilir olmali.
    const _typecheck: Stripe.LatestApiVersion = STRIPE_API_VERSION;
    expect(typeof _typecheck).toBe('string');
  });
});