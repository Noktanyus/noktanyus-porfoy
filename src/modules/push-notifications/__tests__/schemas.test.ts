/**
 * Push Notification Schemas Tests
 */

import { describe, it, expect } from 'vitest';
import {
  SubscribePushSchema,
  UnsubscribePushSchema,
  PushPayloadSchema,
} from '../schemas';

describe('Push Schemas', () => {
  it('SubscribePushSchema accepts valid subscription', () => {
    const r = SubscribePushSchema.safeParse({
      endpoint: 'https://push.example.com/abc',
      keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7CI99UTMmEey-Y0=',
              auth: 'tBHItJI5svbpez7KI4CCXg==' },
    });
    expect(r.success).toBe(true);
  });

  it('SubscribePushSchema rejects missing keys', () => {
    const r = SubscribePushSchema.safeParse({
      endpoint: 'https://push.example.com/abc',
    });
    expect(r.success).toBe(false);
  });

  it('SubscribePushSchema rejects non-url endpoint', () => {
    const r = SubscribePushSchema.safeParse({
      endpoint: 'not-a-url',
      keys: { p256dh: 'p', auth: 'a' },
    });
    expect(r.success).toBe(false);
  });

  it('UnsubscribePushSchema requires endpoint', () => {
    expect(UnsubscribePushSchema.safeParse({}).success).toBe(false);
    expect(UnsubscribePushSchema.safeParse({ endpoint: 'https://x.com/y' }).success).toBe(true);
  });

  it('PushPayloadSchema enforces title and body', () => {
    expect(PushPayloadSchema.safeParse({ title: '', body: '' }).success).toBe(false);
    expect(PushPayloadSchema.safeParse({ title: 't', body: 'b' }).success).toBe(true);
  });
});