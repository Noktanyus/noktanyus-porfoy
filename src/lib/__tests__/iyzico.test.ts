/**
 * iyzico (iyzipay) wrapper unit tests
 *
 * Konfigürasyon kontrolü, mock mode ve iyzicoService davranışı.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    webhookEvent: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    customer: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    subscription: { upsert: vi.fn(), update: vi.fn() },
  },
}));

describe('iyzico lib', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.IYZICO_API_KEY;
    delete process.env.IYZICO_SECRET_KEY;
    delete process.env.IYZICO_URI;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('isIyzicoConfigured() returns false when env is missing', async () => {
    const { isIyzicoConfigured } = await import('../iyzico');
    expect(isIyzicoConfigured()).toBe(false);
  });

  it('isIyzicoConfigured() returns true when all env vars are set', async () => {
    process.env.IYZICO_API_KEY = 'test-key';
    process.env.IYZICO_SECRET_KEY = 'test-secret';
    process.env.IYZICO_URI = 'https://sandbox-api.iyzipay.com';

    const { isIyzicoConfigured } = await import('../iyzico');
    expect(isIyzicoConfigured()).toBe(true);
  });

  it('getIyzico() throws when not configured', async () => {
    const { getIyzico } = await import('../iyzico');
    expect(() => getIyzico()).toThrow(/IYZICO/);
  });

  it('iyzicoService.createCheckout returns mock token when not configured', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    const { iyzicoService } = await import('@/modules/commerce/iyzicoService');

    const result = await iyzicoService.createCheckout({
      items: [{ id: 'p1', name: 'Test', category: 'general', price: '10.00' }],
      totalPrice: '10.00',
      customerEmail: 'test@example.com',
      callbackUrl: 'http://localhost:3000/callback',
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.token).toMatch(/^mock_iyzico_/);
      expect(result.paymentPageUrl).toContain('/odeme/basarili');
    }
  });

  it('iyzicoService.retrieveCheckout returns success in mock mode', async () => {
    const { iyzicoService } = await import('@/modules/commerce/iyzicoService');

    const result = await iyzicoService.retrieveCheckout('mock_token');
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.paymentStatus).toBe('SUCCESS');
    }
  });
});

describe('selectPaymentProvider', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.IYZICO_API_KEY;
    delete process.env.IYZICO_SECRET_KEY;
    delete process.env.IYZICO_URI;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.PAYTR_MERCHANT_ID;
    delete process.env.PAYTR_MERCHANT_KEY;
    delete process.env.PAYTR_MERCHANT_SALT;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns paytr (mock path) when nothing configured', async () => {
    const { selectPaymentProvider } = await import('@/modules/commerce/service');
    expect(selectPaymentProvider()).toBe('paytr');
  });

  it('returns paytr when PayTR configured even if others exist', async () => {
    process.env.PAYTR_MERCHANT_ID = 'm';
    process.env.PAYTR_MERCHANT_KEY = 'k';
    process.env.PAYTR_MERCHANT_SALT = 's';
    process.env.IYZICO_API_KEY = 'k';
    process.env.IYZICO_SECRET_KEY = 's';
    process.env.IYZICO_URI = 'https://sandbox-api.iyzipay.com';
    process.env.STRIPE_SECRET_KEY = 'sk_test';

    const { selectPaymentProvider } = await import('@/modules/commerce/service');
    expect(selectPaymentProvider()).toBe('paytr');
    expect(selectPaymentProvider('stripe')).toBe('paytr');
  });

  it('returns iyzico when PayTR missing and iyzico configured', async () => {
    process.env.IYZICO_API_KEY = 'k';
    process.env.IYZICO_SECRET_KEY = 's';
    process.env.IYZICO_URI = 'https://sandbox-api.iyzipay.com';

    const { selectPaymentProvider } = await import('@/modules/commerce/service');
    expect(selectPaymentProvider()).toBe('iyzico');
  });

  it('honors explicit iyzico/stripe only when PayTR not configured', async () => {
    process.env.IYZICO_API_KEY = 'k';
    process.env.IYZICO_SECRET_KEY = 's';
    process.env.IYZICO_URI = 'https://sandbox-api.iyzipay.com';
    process.env.STRIPE_SECRET_KEY = 'sk_test';

    const { selectPaymentProvider } = await import('@/modules/commerce/service');
    expect(selectPaymentProvider('iyzico')).toBe('iyzico');
    expect(selectPaymentProvider('stripe')).toBe('stripe');
  });

  it('falls back when explicit provider not configured', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    const { selectPaymentProvider } = await import('@/modules/commerce/service');
    expect(selectPaymentProvider('iyzico')).toBe('stripe');
  });
});
