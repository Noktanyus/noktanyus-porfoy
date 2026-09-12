/**
 * Lemon Squeezy Webhook Helpers — Unit Tests
 *
 * verifyLemonSqueezyWebhook:
 *  - secret yok → false
 *  - signature null → false
 *  - gecersiz hex → false
 *  - valid HMAC SHA256 → true
 *  - length mismatch → false
 *
 * parseLemonSqueezyEvent:
 *  - zorunlu alanlar (event_name, data.id, attrs.user_email) eksikse null
 *  - first_order_item.variant_id priority
 *  - data.attributes.variant_id fallback
 *  - amountCents number parse + string parse
 *  - isCancellation subscription_cancelled icin true
 *  - isRefund order_refunded / cancellation / status=refunded
 *  - currency default USD
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  verifyLemonSqueezyWebhook,
  parseLemonSqueezyEvent,
  getLemonSqueezyProductMap,
  isLemonSqueezyConfigured,
  isLemonSqueezyCheckoutConfigured,
} from '../lemonsqueezy';

const SECRET = 'ls-test-secret';

function sign(payload: string, secret: string = SECRET): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

describe('isLemonSqueezyConfigured / isLemonSqueezyCheckoutConfigured', () => {
  beforeEach(() => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    delete process.env.LEMONSQUEEZY_API_KEY;
    delete process.env.LEMONSQUEEZY_STORE_ID;
  });

  it('webhook secret set → configured true', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
    expect(isLemonSqueezyConfigured()).toBe(true);
  });

  it('all 3 envs required for checkout configured', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
    process.env.LEMONSQUEEZY_API_KEY = 'ls_api';
    process.env.LEMONSQUEEZY_STORE_ID = 'store_1';
    expect(isLemonSqueezyCheckoutConfigured()).toBe(true);
  });

  it('checkout configured false when any env missing', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
    process.env.LEMONSQUEEZY_API_KEY = 'ls_api';
    // STORE_ID missing
    expect(isLemonSqueezyCheckoutConfigured()).toBe(false);
  });
});

describe('verifyLemonSqueezyWebhook', () => {
  beforeEach(() => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  });

  it('returns false when secret not configured', () => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    expect(verifyLemonSqueezyWebhook('payload', 'sig')).toBe(false);
  });

  it('returns false when signature is null', () => {
    expect(verifyLemonSqueezyWebhook('payload', null)).toBe(false);
  });

  it('returns false when signature is non-hex', () => {
    expect(verifyLemonSqueezyWebhook('payload', 'xyz-!@#')).toBe(false);
  });

  it('returns false when signature length differs', () => {
    expect(verifyLemonSqueezyWebhook('payload', 'abcd')).toBe(false);
  });

  it('returns true for valid HMAC signature', () => {
    const payload = '{"meta":{"event_name":"order_created"}}';
    const sig = sign(payload);
    expect(verifyLemonSqueezyWebhook(payload, sig)).toBe(true);
  });

  it('returns false when payload is tampered', () => {
    const sig = sign('{"meta":{"event_name":"order_created"}}');
    expect(verifyLemonSqueezyWebhook('{"meta":{"event_name":"order_refunded"}}', sig)).toBe(false);
  });
});

describe('getLemonSqueezyProductMap', () => {
  beforeEach(() => {
    delete process.env.LEMONSQUEEZY_PRODUCT_MAP;
  });

  it('returns empty object when env missing', () => {
    expect(getLemonSqueezyProductMap()).toEqual({});
  });

  it('parses valid JSON map', () => {
    process.env.LEMONSQUEEZY_PRODUCT_MAP = JSON.stringify({
      'var-1': 'modern-portfolio',
      'var-2': 'saas-starter',
    });
    expect(getLemonSqueezyProductMap()).toEqual({
      'var-1': 'modern-portfolio',
      'var-2': 'saas-starter',
    });
  });

  it('drops non-string / empty values', () => {
    process.env.LEMONSQUEEZY_PRODUCT_MAP = JSON.stringify({
      good: 'modern',
      bad: 42,
      empty: '   ',
    });
    expect(getLemonSqueezyProductMap()).toEqual({ good: 'modern' });
  });

  it('returns empty object on malformed JSON', () => {
    process.env.LEMONSQUEEZY_PRODUCT_MAP = '{not json';
    expect(getLemonSqueezyProductMap()).toEqual({});
  });
});

describe('parseLemonSqueezyEvent', () => {
  beforeEach(() => {
    process.env.LEMONSQUEEZY_PRODUCT_MAP = JSON.stringify({
      'var-1': 'modern-portfolio',
    });
  });

  afterEach(() => {
    delete process.env.LEMONSQUEEZY_PRODUCT_MAP;
  });

  const basePayload = {
    meta: { event_name: 'order_created' },
    data: {
      id: 'order_123',
      attributes: {
        user_email: 'buyer@example.com',
        user_name: 'Buyer Name',
        total: 4900,
        currency: 'USD',
        first_order_item: { variant_id: 'var-1', product_id: 'prod-1' },
        slug: 'modern-portfolio',
        status: 'paid',
      },
    },
  };

  it('parses full order_created payload', () => {
    const result = parseLemonSqueezyEvent(basePayload);
    expect(result).toEqual({
      eventName: 'order_created',
      orderId: 'order_123',
      customerEmail: 'buyer@example.com',
      customerName: 'Buyer Name',
      productId: 'var-1', // first_order_item.variant_id priority
      productSlug: 'modern-portfolio', // map precedence
      amountCents: 4900,
      currency: 'USD',
      isRefund: false,
      isCancellation: false,
      raw: basePayload,
    });
  });

  it('returns null when event_name missing', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    payload.meta.event_name = '';
    expect(parseLemonSqueezyEvent(payload)).toBeNull();
  });

  it('returns null when data.id missing', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    delete payload.data.id;
    expect(parseLemonSqueezyEvent(payload)).toBeNull();
  });

  it('returns null when user_email missing', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    delete payload.data.attributes.user_email;
    expect(parseLemonSqueezyEvent(payload)).toBeNull();
  });

  it('returns null when product identification completely missing', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    delete payload.data.attributes.first_order_item;
    delete payload.data.attributes.variant_id;
    delete payload.data.attributes.product_id;
    delete payload.data.attributes.variant_name;
    expect(parseLemonSqueezyEvent(payload)).toBeNull();
  });

  it('falls back to data.attributes.variant_id when first_order_item missing', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    delete payload.data.attributes.first_order_item;
    payload.data.attributes.variant_id = 'var-99';
    const result = parseLemonSqueezyEvent(payload);
    expect(result?.productId).toBe('var-99');
  });

  it('falls back to variant_name when no variant_id/product_id', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    delete payload.data.attributes.first_order_item;
    payload.data.attributes.variant_name = 'fallback-name';
    const result = parseLemonSqueezyEvent(payload);
    expect(result?.productId).toBe('fallback-name');
  });

  it('parses total as string number', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    payload.data.attributes.total = '9900';
    const result = parseLemonSqueezyEvent(payload);
    expect(result?.amountCents).toBe(9900);
  });

  it('treats missing / negative total as 0', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    delete payload.data.attributes.total;
    const result = parseLemonSqueezyEvent(payload);
    expect(result?.amountCents).toBe(0);
  });

  it('flags isCancellation true for subscription_cancelled', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    payload.meta.event_name = 'subscription_cancelled';
    const result = parseLemonSqueezyEvent(payload);
    expect(result?.isCancellation).toBe(true);
    // subscription_cancelled ayrica refund olarak da sayilir
    expect(result?.isRefund).toBe(true);
  });

  it('flags isRefund true for order_refunded', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    payload.meta.event_name = 'order_refunded';
    const result = parseLemonSqueezyEvent(payload);
    expect(result?.isRefund).toBe(true);
    expect(result?.isCancellation).toBe(false);
  });

  it('flags isRefund true when attributes.status is refunded', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    payload.data.attributes.status = 'refunded';
    const result = parseLemonSqueezyEvent(payload);
    expect(result?.isRefund).toBe(true);
  });

  it('uses product map slug over attrs.slug fallback', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    payload.data.attributes.slug = 'fallback-slug';
    // first_order_item.variant_id 'var-1' → map'te 'modern-portfolio'
    const result = parseLemonSqueezyEvent(payload);
    expect(result?.productSlug).toBe('modern-portfolio');
  });

  it('uses attrs.slug when no product map match', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    payload.data.attributes.first_order_item.variant_id = 'unknown-var';
    const result = parseLemonSqueezyEvent(payload);
    expect(result?.productSlug).toBe('modern-portfolio');
  });

  it('defaults currency to USD when missing', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    delete payload.data.attributes.currency;
    const result = parseLemonSqueezyEvent(payload);
    expect(result?.currency).toBe('USD');
  });

  it('omits customerName when not a string', () => {
    const payload = JSON.parse(JSON.stringify(basePayload));
    payload.data.attributes.user_name = null;
    const result = parseLemonSqueezyEvent(payload);
    expect(result?.customerName).toBeUndefined();
  });
});
