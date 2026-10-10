import { describe, it, expect } from 'vitest';
import { applyApiVersionHeaders, matchDeprecation, API_VERSION } from '../apiVersion';

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
