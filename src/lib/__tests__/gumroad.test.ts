/**
 * Gumroad Webhook Helpers — Unit Tests
 *
 * verifyGumroadWebhook:
 *  - secret yok → false
 *  - signature yok → false
 *  - gecersiz hex → false
 *  - valid HMAC SHA256 → true
 *  - sha256= prefix kabul edilir
 *  - sha256= prefix olmadan da kabul edilir
 *
 * parseGumroadSale:
 *  - zorunlu alanlar (saleId, email, productId) eksikse null
 *  - tam payload ile dogru ParsedGumroadSale doner
 *  - refunded=true ise refunded=true
 *  - dispute_started=true ise refunded=true
 *  - price string "1000" → priceCents=1000
 *  - product_permalink ve GUMROAD_PRODUCT_MAP precedence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  verifyGumroadWebhook,
  parseGumroadSale,
  getGumroadProductMap,
  isGumroadConfigured,
} from '../gumroad';

const SECRET = 'gumroad-test-secret';

function sign(payload: string, secret: string = SECRET): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

describe('isGumroadConfigured', () => {
  beforeEach(() => {
    delete process.env.GUMROAD_WEBHOOK_SECRET;
  });

  it('returns true when GUMROAD_WEBHOOK_SECRET set', () => {
    process.env.GUMROAD_WEBHOOK_SECRET = SECRET;
    expect(isGumroadConfigured()).toBe(true);
  });

  it('returns false when GUMROAD_WEBHOOK_SECRET missing', () => {
    delete process.env.GUMROAD_WEBHOOK_SECRET;
    expect(isGumroadConfigured()).toBe(false);
  });
});

describe('verifyGumroadWebhook', () => {
  beforeEach(() => {
    process.env.GUMROAD_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.GUMROAD_WEBHOOK_SECRET;
  });

  it('returns false when secret not configured', () => {
    delete process.env.GUMROAD_WEBHOOK_SECRET;
    expect(verifyGumroadWebhook('payload', 'sig')).toBe(false);
  });

  it('returns false when signature is null', () => {
    expect(verifyGumroadWebhook('payload', null)).toBe(false);
  });

  it('returns false when signature is empty string', () => {
    expect(verifyGumroadWebhook('payload', '')).toBe(false);
  });

  it('returns false when signature is not hex', () => {
    expect(verifyGumroadWebhook('payload', 'NOT-HEX-@!')).toBe(false);
  });

  it('returns false when signature length differs from computed HMAC', () => {
    // gecerli hex ama yanlis icerik — length esit (64 char) ama farkli bytes
    expect(verifyGumroadWebhook('payload', 'a'.repeat(64))).toBe(false);
  });

  it('returns true for valid HMAC signature (no prefix)', () => {
    const payload = '{"resource_name":"sale"}';
    const sig = sign(payload);
    expect(verifyGumroadWebhook(payload, sig)).toBe(true);
  });

  it('returns true for valid HMAC signature with sha256= prefix', () => {
    const payload = '{"resource_name":"sale"}';
    const sig = `sha256=${sign(payload)}`;
    expect(verifyGumroadWebhook(payload, sig)).toBe(true);
  });

  it('returns false when payload is tampered', () => {
    const sig = sign('{"resource_name":"sale"}');
    expect(verifyGumroadWebhook('{"resource_name":"refund"}', sig)).toBe(false);
  });
});

describe('getGumroadProductMap', () => {
  beforeEach(() => {
    delete process.env.GUMROAD_PRODUCT_MAP;
  });

  it('returns empty object when env missing', () => {
    expect(getGumroadProductMap()).toEqual({});
  });

  it('parses valid JSON string→string map', () => {
    process.env.GUMROAD_PRODUCT_MAP = JSON.stringify({
      'gp-001': 'modern-portfolio',
      'gp-002': 'saas-starter',
    });
    expect(getGumroadProductMap()).toEqual({
      'gp-001': 'modern-portfolio',
      'gp-002': 'saas-starter',
    });
  });

  it('drops non-string values and whitespace-only values', () => {
    process.env.GUMROAD_PRODUCT_MAP = JSON.stringify({
      good: 'modern',
      bad: 123,
      empty: '   ',
    });
    expect(getGumroadProductMap()).toEqual({ good: 'modern' });
  });

  it('returns empty object on malformed JSON', () => {
    process.env.GUMROAD_PRODUCT_MAP = 'not json';
    expect(getGumroadProductMap()).toEqual({});
  });
});

describe('parseGumroadSale', () => {
  beforeEach(() => {
    process.env.GUMROAD_PRODUCT_MAP = JSON.stringify({
      'gp-001': 'modern-portfolio',
    });
  });

  afterEach(() => {
    delete process.env.GUMROAD_PRODUCT_MAP;
  });

  const basePayload = {
    sale_id: 'sale_abc123',
    email: 'buyer@example.com',
    product_id: 'gp-001',
    price: '4900',
    currency: 'USD',
    refunded: false,
    dispute_started: false,
    full_name: 'Buyer Name',
    product_permalink: 'modern-portfolio',
  };

  it('parses a full payload into ParsedGumroadSale', () => {
    const result = parseGumroadSale(basePayload);
    expect(result).toEqual({
      saleId: 'sale_abc123',
      email: 'buyer@example.com',
      name: 'Buyer Name',
      productId: 'gp-001',
      productSlug: 'modern-portfolio', // GUMROAD_PRODUCT_MAP precedence
      priceCents: 4900,
      currency: 'USD',
      refunded: false,
      raw: basePayload,
    });
  });

  it('falls back to product_permalink when no product map match', () => {
    const result = parseGumroadSale({
      ...basePayload,
      product_id: 'unknown-id',
    });
    expect(result?.productSlug).toBe('modern-portfolio');
  });

  it('returns null when sale_id missing', () => {
    const { sale_id, ...rest } = basePayload;
    expect(parseGumroadSale(rest)).toBeNull();
  });

  it('returns null when email missing', () => {
    const { email, ...rest } = basePayload;
    expect(parseGumroadSale(rest)).toBeNull();
  });

  it('returns null when product_id and short_product_id missing', () => {
    const { product_id, ...rest } = basePayload;
    expect(parseGumroadSale(rest)).toBeNull();
  });

  it('accepts short_product_id as product_id fallback', () => {
    const { product_id, ...rest } = basePayload;
    const result = parseGumroadSale({
      ...rest,
      short_product_id: 'gp-002',
    });
    expect(result?.productId).toBe('gp-002');
  });

  it('accepts id as sale_id fallback', () => {
    const { sale_id, ...rest } = basePayload;
    const result = parseGumroadSale({ ...rest, id: 'sale_alt' });
    expect(result?.saleId).toBe('sale_alt');
  });

  it('flags refunded=true when refunded is true', () => {
    const result = parseGumroadSale({ ...basePayload, refunded: true });
    expect(result?.refunded).toBe(true);
  });

  it('flags refunded=true when dispute_started is true', () => {
    const result = parseGumroadSale({ ...basePayload, dispute_started: true });
    expect(result?.refunded).toBe(true);
  });

  it('parses numeric price into cents', () => {
    const result = parseGumroadSale({ ...basePayload, price: 9900 });
    expect(result?.priceCents).toBe(9900);
  });

  it('treats empty / invalid price as 0 cents', () => {
    const result = parseGumroadSale({ ...basePayload, price: '' });
    expect(result?.priceCents).toBe(0);
  });

  it('defaults currency to USD when missing', () => {
    const { currency, ...rest } = basePayload;
    const result = parseGumroadSale({ ...rest });
    expect(result?.currency).toBe('USD');
  });

  it('omits name when full_name is not a string', () => {
    const result = parseGumroadSale({ ...basePayload, full_name: 12345 });
    expect(result?.name).toBeUndefined();
  });
});
