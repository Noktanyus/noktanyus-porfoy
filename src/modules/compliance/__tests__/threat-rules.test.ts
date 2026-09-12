/**
 * Threat Rules Engine — Unit Tests (Phase 4 C.2)
 *
 * Test edilen kurallar:
 *   1. analytics_without_consent
 *   2. missing_privacy_policy_link
 *   3. pii_form_no_consent
 *   4. third_party_iframe_no_sandbox
 *   5. cookie_duration_too_long
 *   6. missing_cookie_policy_page
 *   7. yandex_metrika_without_consent
 *   8. missing_https
 *
 * computeComplianceScore: 100'den başla, severity ağırlıkları kadar düş.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateThreats,
  computeComplianceScore,
  parseDurationDays,
  DEFAULT_THREAT_RULES,
  type ThreatContext,
} from '../threatRules';
import type {
  CookieRecord,
  TrackingScript,
  FormRecord,
} from '../schemas';

// ============================================================================
// Test fixtures
// ============================================================================

const ctx = (overrides: Partial<ThreatContext> = {}): ThreatContext => ({
  cookies: [],
  trackingScripts: [],
  forms: [],
  pageUrls: ['https://example.com'],
  hasPrivacyPolicyLink: true,
  hasCookiePolicyPage: true,
  hasCookieBanner: true,
  ...overrides,
});

const cookie = (
  name: string,
  type: 'necessary' | 'analytics' | 'marketing' = 'necessary',
  duration?: string
): CookieRecord => ({
  name,
  type,
  duration,
  exemptFromConsent: type === 'necessary',
});

const script = (
  provider: string,
  gdprCompliant = false,
  url = 'https://example.com/script.js'
): TrackingScript => ({
  url,
  provider,
  knownTracker: provider,
  gdprCompliant,
});

const form = (
  url: string,
  consentRequired: boolean,
  fields: Array<{ name: string; type: string; required: boolean }>
): FormRecord => ({
  url,
  method: 'POST',
  fields: fields.map((f) => ({ ...f, sensitive: false })),
  consentRequired,
});

/** Helper to build a form with explicit sensitive flags (for pii_form rule tests). */
const formWithSensitive = (
  url: string,
  consentRequired: boolean,
  fields: Array<{ name: string; type: string; required: boolean; sensitive: boolean }>
): FormRecord => ({
  url,
  method: 'POST',
  fields,
  consentRequired,
});

// ============================================================================
// evaluateThreats — analytics_without_consent
// ============================================================================

describe('evaluateThreats — analytics_without_consent', () => {
  it('fires when analytics cookies exist without banner', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('_ga', 'analytics')],
        hasCookieBanner: false,
      })
    );
    const hit = threats.find((t) => t.type === 'analytics_without_consent');
    expect(hit).toBeTruthy();
    expect(hit!.severity).toBe('HIGH');
    expect(hit!.regulationRef).toContain('KVKK');
  });

  it('fires for marketing cookies without banner', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('_fbp', 'marketing')],
        hasCookieBanner: false,
      })
    );
    expect(threats.some((t) => t.type === 'analytics_without_consent')).toBe(true);
  });

  it('does NOT fire when banner exists', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('_ga', 'analytics')],
        hasCookieBanner: true,
      })
    );
    expect(threats.find((t) => t.type === 'analytics_without_consent')).toBeUndefined();
  });

  it('does NOT fire when only necessary cookies exist', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('session_id', 'necessary')],
        hasCookieBanner: false,
      })
    );
    expect(threats.find((t) => t.type === 'analytics_without_consent')).toBeUndefined();
  });
});

// ============================================================================
// evaluateThreats — missing_privacy_policy_link
// ============================================================================

describe('evaluateThreats — missing_privacy_policy_link', () => {
  it('fires when privacy policy link is missing', () => {
    const threats = evaluateThreats(ctx({ hasPrivacyPolicyLink: false }));
    const hit = threats.find((t) => t.type === 'missing_privacy_policy_link');
    expect(hit).toBeTruthy();
    expect(hit!.severity).toBe('HIGH');
    expect(hit!.regulationRef).toContain('KVKK');
  });

  it('does NOT fire when privacy policy link exists', () => {
    const threats = evaluateThreats(ctx({ hasPrivacyPolicyLink: true }));
    expect(threats.find((t) => t.type === 'missing_privacy_policy_link')).toBeUndefined();
  });
});

// ============================================================================
// evaluateThreats — pii_form_no_consent
// ============================================================================

describe('evaluateThreats — pii_form_no_consent', () => {
  it('fires when form requires consent AND has sensitive PII field', () => {
    const threats = evaluateThreats(
      ctx({
        forms: [
          formWithSensitive('https://example.com/contact', true, [
            { name: 'tc_kimlik', type: 'text', required: true, sensitive: true },
          ]),
        ],
      })
    );
    const hit = threats.find((t) => t.type === 'pii_form_no_consent');
    expect(hit).toBeTruthy();
    expect(hit!.severity).toBe('HIGH');
    expect(hit!.pageUrl).toBe('https://example.com/contact');
  });

  it('does NOT fire when consent is given', () => {
    const threats = evaluateThreats(
      ctx({
        forms: [
          form(
            'https://example.com/contact',
            true,
            [{ name: 'tc_kimlik', type: 'text', required: true }]
          ),
        ],
      })
    );
    expect(threats.find((t) => t.type === 'pii_form_no_consent')).toBeUndefined();
  });

  it('does NOT fire when forms have only non-sensitive fields', () => {
    const threats = evaluateThreats(
      ctx({
        forms: [
          form(
            'https://example.com/newsletter',
            false,
            [{ name: 'email', type: 'email', required: true }]
          ),
        ],
      })
    );
    expect(threats.find((t) => t.type === 'pii_form_no_consent')).toBeUndefined();
  });
});

// ============================================================================
// evaluateThreats — third_party_iframe_no_sandbox
// ============================================================================

describe('evaluateThreats — third_party_iframe_no_sandbox', () => {
  it('fires when 3+ non-compliant 3rd-party trackers present', () => {
    const threats = evaluateThreats(
      ctx({
        trackingScripts: [
          script('Google Analytics', false),
          script('Facebook Pixel', false),
          script('Hotjar', false),
        ],
      })
    );
    expect(threats.some((t) => t.type === 'third_party_iframe_no_sandbox')).toBe(true);
  });

  it('does NOT fire when fewer than 3 trackers', () => {
    const threats = evaluateThreats(
      ctx({
        trackingScripts: [
          script('Google Analytics', false),
          script('Facebook Pixel', false),
        ],
      })
    );
    expect(threats.find((t) => t.type === 'third_party_iframe_no_sandbox')).toBeUndefined();
  });

  it('does NOT fire when all trackers are GDPR-compliant', () => {
    const threats = evaluateThreats(
      ctx({
        trackingScripts: [
          script('Plausible', true),
          script('Umami', true),
          script('Plausible Analytics', true),
        ],
      })
    );
    expect(threats.find((t) => t.type === 'third_party_iframe_no_sandbox')).toBeUndefined();
  });
});

// ============================================================================
// evaluateThreats — cookie_duration_too_long
// ============================================================================

describe('evaluateThreats — cookie_duration_too_long', () => {
  it('fires when cookie duration > 365 days', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('_long_cookie', 'analytics', '2 years')],
      })
    );
    const hit = threats.find((t) => t.type === 'cookie_duration_too_long');
    expect(hit).toBeTruthy();
    expect(hit!.severity).toBe('MEDIUM');
  });

  it('does NOT fire when cookie duration <= 365 days', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('_ga', 'analytics', '1 year')],
      })
    );
    expect(threats.find((t) => t.type === 'cookie_duration_too_long')).toBeUndefined();
  });

  it('does NOT fire when cookie duration is undefined', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('session_id', 'necessary', undefined)],
      })
    );
    expect(threats.find((t) => t.type === 'cookie_duration_too_long')).toBeUndefined();
  });
});

// ============================================================================
// evaluateThreats — missing_cookie_policy_page
// ============================================================================

describe('evaluateThreats — missing_cookie_policy_page', () => {
  it('fires when non-essential cookies exist but no cookie policy page', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('_ga', 'analytics')],
        hasCookiePolicyPage: false,
      })
    );
    const hit = threats.find((t) => t.type === 'missing_cookie_policy_page');
    expect(hit).toBeTruthy();
    expect(hit!.severity).toBe('MEDIUM');
  });

  it('does NOT fire when cookie policy page exists', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('_ga', 'analytics')],
        hasCookiePolicyPage: true,
      })
    );
    expect(threats.find((t) => t.type === 'missing_cookie_policy_page')).toBeUndefined();
  });

  it('does NOT fire when only necessary cookies exist', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('session_id', 'necessary')],
        hasCookiePolicyPage: false,
      })
    );
    expect(threats.find((t) => t.type === 'missing_cookie_policy_page')).toBeUndefined();
  });
});

// ============================================================================
// evaluateThreats — yandex_metrika_without_consent
// ============================================================================

describe('evaluateThreats — yandex_metrika_without_consent', () => {
  it('fires when Yandex Metrika loaded without consent', () => {
    const threats = evaluateThreats(
      ctx({
        trackingScripts: [script('Yandex Metrika', false, 'https://mc.yandex.ru/metrika.js')],
        hasCookieBanner: false,
      })
    );
    const hit = threats.find((t) => t.type === 'yandex_metrika_without_consent');
    expect(hit).toBeTruthy();
    expect(hit!.severity).toBe('HIGH');
  });

  it('does NOT fire when consent banner exists', () => {
    const threats = evaluateThreats(
      ctx({
        trackingScripts: [script('Yandex Metrika', false, 'https://mc.yandex.ru/metrika.js')],
        hasCookieBanner: true,
      })
    );
    expect(threats.find((t) => t.type === 'yandex_metrika_without_consent')).toBeUndefined();
  });
});

// ============================================================================
// evaluateThreats — missing_https
// ============================================================================

describe('evaluateThreats — missing_https', () => {
  it('fires when pageUrls contain HTTP scheme', () => {
    const threats = evaluateThreats(
      ctx({
        pageUrls: ['http://example.com', 'https://example.com/about'],
      })
    );
    const hit = threats.find((t) => t.type === 'missing_https');
    expect(hit).toBeTruthy();
    expect(hit!.severity).toBe('HIGH');
    expect(hit!.pageUrl).toBe('http://example.com');
  });

  it('does NOT fire when all URLs are HTTPS', () => {
    const threats = evaluateThreats(
      ctx({
        pageUrls: ['https://example.com', 'https://example.com/about'],
      })
    );
    expect(threats.find((t) => t.type === 'missing_https')).toBeUndefined();
  });
});

// ============================================================================
// evaluateThreats — aggregate behavior
// ============================================================================

describe('evaluateThreats — aggregate behavior', () => {
  it('returns multiple threats when multiple rules fire', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('_ga', 'analytics')],
        trackingScripts: [script('Yandex Metrika', false)],
        hasPrivacyPolicyLink: false,
        hasCookieBanner: false,
        hasCookiePolicyPage: false,
        pageUrls: ['http://example.com'],
      })
    );
    const types = threats.map((t) => t.type);
    expect(types).toContain('analytics_without_consent');
    expect(types).toContain('missing_privacy_policy_link');
    expect(types).toContain('missing_cookie_policy_page');
    expect(types).toContain('yandex_metrika_without_consent');
    expect(types).toContain('missing_https');
  });

  it('returns empty list when no rules fire', () => {
    const threats = evaluateThreats(
      ctx({
        cookies: [cookie('session_id', 'necessary')],
        trackingScripts: [script('Plausible', true)],
        forms: [],
        pageUrls: ['https://example.com'],
        hasPrivacyPolicyLink: true,
        hasCookiePolicyPage: true,
        hasCookieBanner: true,
      })
    );
    expect(threats).toHaveLength(0);
  });

  it('does not throw when a rule evaluate fails (defensive)', () => {
    // Passing an unusual shape should not crash the evaluator
    expect(() =>
      evaluateThreats(
        ctx({
          cookies: [],
          trackingScripts: [],
          forms: [],
          pageUrls: [],
        })
      )
    ).not.toThrow();
  });
});

// ============================================================================
// DEFAULT_THREAT_RULES — structural assertions
// ============================================================================

describe('DEFAULT_THREAT_RULES', () => {
  it('contains 8 rules', () => {
    expect(DEFAULT_THREAT_RULES.length).toBe(8);
  });

  it('every rule has unique id', () => {
    const ids = DEFAULT_THREAT_RULES.map((r) => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ============================================================================
// computeComplianceScore — weighted scoring
// ============================================================================

describe('computeComplianceScore', () => {
  it('returns 100 for empty threat list', () => {
    expect(computeComplianceScore([])).toBe(100);
  });

  it('subtracts 15 for each HIGH threat', () => {
    const score = computeComplianceScore([
      {
        severity: 'HIGH',
        type: 'test',
        description: 'x',
      },
    ]);
    expect(score).toBe(85);
  });

  it('subtracts 25 for each CRITICAL threat', () => {
    const score = computeComplianceScore([
      {
        severity: 'CRITICAL',
        type: 'test',
        description: 'x',
      },
    ]);
    expect(score).toBe(75);
  });

  it('subtracts 8 for each MEDIUM threat', () => {
    const score = computeComplianceScore([
      {
        severity: 'MEDIUM',
        type: 'test',
        description: 'x',
      },
    ]);
    expect(score).toBe(92);
  });

  it('subtracts 3 for each LOW threat', () => {
    const score = computeComplianceScore([
      {
        severity: 'LOW',
        type: 'test',
        description: 'x',
      },
    ]);
    expect(score).toBe(97);
  });

  it('clamps to 0 (does not go negative)', () => {
    const threats = Array.from({ length: 10 }, () => ({
      severity: 'CRITICAL' as const,
      type: 'x',
      description: 'x',
    }));
    expect(computeComplianceScore(threats)).toBe(0);
  });

  it('clamps to 100 (does not exceed)', () => {
    expect(computeComplianceScore([])).toBeLessThanOrEqual(100);
  });

  it('sums penalties across mixed severities', () => {
    // 1 CRITICAL (25) + 1 HIGH (15) + 1 MEDIUM (8) + 1 LOW (3) = 51 penalty
    const score = computeComplianceScore([
      { severity: 'CRITICAL', type: 'a', description: 'x' },
      { severity: 'HIGH', type: 'b', description: 'x' },
      { severity: 'MEDIUM', type: 'c', description: 'x' },
      { severity: 'LOW', type: 'd', description: 'x' },
    ]);
    expect(score).toBe(49);
  });
});

// ============================================================================
// parseDurationDays — helper
// ============================================================================

describe('parseDurationDays', () => {
  it('parses "session" → 0', () => {
    expect(parseDurationDays('session')).toBe(0);
  });

  it('parses "1 day" → 1', () => {
    expect(parseDurationDays('1 day')).toBe(1);
  });

  it('parses "30 days" → 30', () => {
    expect(parseDurationDays('30 days')).toBe(30);
  });

  it('parses "3 months" → 90', () => {
    expect(parseDurationDays('3 months')).toBe(90);
  });

  it('parses "2 years" → 730', () => {
    expect(parseDurationDays('2 years')).toBe(730);
  });

  it('returns null for empty/undefined', () => {
    expect(parseDurationDays(undefined)).toBeNull();
    expect(parseDurationDays('')).toBeNull();
  });

  it('returns null for unrecognized format', () => {
    expect(parseDurationDays('forever')).toBeNull();
  });
});
