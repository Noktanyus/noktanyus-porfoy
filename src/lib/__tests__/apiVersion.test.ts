import { describe, it, expect } from 'vitest';
import {
  applyApiVersionHeaders,
  matchDeprecation,
  API_VERSION,
  getBrownoutConfig,
  shouldBrownoutDeprecatedPath,
  brownoutErrorBody,
} from '../apiVersion';

describe('apiVersion', () => {
  it('marks removed AI prefix as deprecated with Sunset + successor', () => {
    const dep = matchDeprecation('/api/v1/ai/bulk');
    expect(dep.deprecated).toBe(true);
    expect(dep.sunset).toBeTruthy();
    expect(dep.successor).toBe('/docs/versioning');
  });

  it('does not deprecate active TR paths', () => {
    expect(matchDeprecation('/api/v1/validate/iban').deprecated).toBe(false);
  });

  it('applies Deprecation / Sunset / Link only for deprecated prefixes', () => {
    const headers = new Headers();
    applyApiVersionHeaders(headers, '/api/v1/ai');
    expect(headers.get('X-API-Version')).toBe(API_VERSION);
    expect(headers.get('Deprecation')).toBe('true');
    expect(headers.get('Sunset')).toBeTruthy();
    expect(headers.get('Link')).toContain('rel="successor-version"');

    const active = new Headers();
    applyApiVersionHeaders(active, '/api/v1/validate/iban');
    expect(active.get('Deprecation')).toBeNull();
    expect(active.get('Sunset')).toBeNull();
    expect(active.get('Link')).toBeNull();
  });
});

describe('brownout (deprecation enforcement)', () => {
  it('parses env config with defaults', () => {
    expect(getBrownoutConfig({})).toEqual({
      enabled: false,
      probability: 0.05,
      retryAfterSeconds: 30,
      mode: 'time',
    });
    expect(
      getBrownoutConfig({
        API_BROWNOUT_ENABLED: 'true',
        API_BROWNOUT_PROBABILITY: '0.25',
        API_BROWNOUT_RETRY_AFTER: '45.2',
        API_BROWNOUT_MODE: 'random',
      })
    ).toEqual({
      enabled: true,
      probability: 0.25,
      retryAfterSeconds: 46,
      mode: 'random',
    });
  });

  it('never browns out when disabled or non-deprecated', () => {
    const env = { API_BROWNOUT_ENABLED: 'true', API_BROWNOUT_PROBABILITY: '1' };
    expect(
      shouldBrownoutDeprecatedPath('/api/v1/validate/iban', { env }).brownout
    ).toBe(false);

    expect(
      shouldBrownoutDeprecatedPath('/api/v1/ai/bulk', {
        env: { API_BROWNOUT_ENABLED: '0', API_BROWNOUT_PROBABILITY: '1' },
      }).brownout
    ).toBe(false);
  });

  it('time mode: hits only within first probability×60 seconds of each minute', () => {
    const env = {
      API_BROWNOUT_ENABLED: '1',
      API_BROWNOUT_PROBABILITY: '0.1', // first 6 seconds
      API_BROWNOUT_MODE: 'time',
      API_BROWNOUT_RETRY_AFTER: '12',
    };
    // epoch aligned: second-of-minute = 0 → hit
    const hit = shouldBrownoutDeprecatedPath('/api/v1/ai', {
      env,
      nowMs: 0,
    });
    expect(hit.brownout).toBe(true);
    expect(hit.retryAfterSeconds).toBe(12);

    // second 10 → miss (10 >= 6)
    expect(
      shouldBrownoutDeprecatedPath('/api/v1/ai', {
        env,
        nowMs: 10_000,
      }).brownout
    ).toBe(false);
  });

  it('random mode: respects injected RNG', () => {
    const env = {
      API_BROWNOUT_ENABLED: 'true',
      API_BROWNOUT_PROBABILITY: '0.2',
      API_BROWNOUT_MODE: 'random',
    };
    expect(
      shouldBrownoutDeprecatedPath('/api/v1/ai/x', {
        env,
        random: () => 0.19,
      }).brownout
    ).toBe(true);
    expect(
      shouldBrownoutDeprecatedPath('/api/v1/ai/x', {
        env,
        random: () => 0.2,
      }).brownout
    ).toBe(false);
  });

  it('probability 0 never browns out even when enabled', () => {
    expect(
      shouldBrownoutDeprecatedPath('/api/v1/ai', {
        env: {
          API_BROWNOUT_ENABLED: '1',
          API_BROWNOUT_PROBABILITY: '0',
        },
        nowMs: 0,
      }).brownout
    ).toBe(false);
  });

  it('exposes ENDPOINT_BROWNOUT error body', () => {
    const body = brownoutErrorBody();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('ENDPOINT_BROWNOUT');
    expect(body.error.message).toMatch(/Retry-After/i);
  });
});
