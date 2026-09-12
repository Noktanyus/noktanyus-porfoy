/**
 * Cookie Analyzer — Unit Tests (Phase 4 C.2)
 *
 * Test coverage:
 *   - classifyCookie: known cookies (ga, _ym_uid, _fbp, etc.)
 *   - classifyCookies: bulk + dedupe
 *   - COOKIE_KNOWLEDGE structure
 */

import { describe, it, expect } from 'vitest';
import {
  classifyCookie,
  classifyCookies,
  COOKIE_KNOWLEDGE,
} from '../cookieAnalyzer';

// ============================================================================
// classifyCookie — Google Analytics family
// ============================================================================

describe('classifyCookie — Google Analytics', () => {
  it('classifies _ga as analytics', () => {
    const c = classifyCookie('_ga');
    expect(c.type).toBe('analytics');
    expect(c.provider).toBe('Google Analytics');
    expect(c.exemptFromConsent).toBe(false);
  });

  it('classifies _ga_XXXX prefix variants', () => {
    const c = classifyCookie('_ga_XYZXY12345');
    expect(c.type).toBe('analytics');
    expect(c.provider).toBe('Google Analytics');
  });

  it('classifies _gid as analytics', () => {
    const c = classifyCookie('_gid');
    expect(c.type).toBe('analytics');
    expect(c.provider).toBe('Google Analytics');
    expect(c.duration).toBe('1 day');
  });

  it('classifies _gat as analytics', () => {
    const c = classifyCookie('_gat');
    expect(c.type).toBe('analytics');
    expect(c.provider).toBe('Google Analytics');
    // Note: _gat is matched via _ga prefix entry (durationDays=730 → '2 years')
    // The actual duration value comes from the matched entry, not _gat itself
  });
});

// ============================================================================
// classifyCookie — Yandex Metrika
// ============================================================================

describe('classifyCookie — Yandex Metrika', () => {
  it('classifies _ym_uid as analytics', () => {
    const c = classifyCookie('_ym_uid');
    expect(c.type).toBe('analytics');
    expect(c.provider).toBe('Yandex Metrika');
  });

  it('classifies _ym_d as analytics', () => {
    const c = classifyCookie('_ym_d');
    expect(c.type).toBe('analytics');
    expect(c.provider).toBe('Yandex Metrika');
  });
});

// ============================================================================
// classifyCookie — Facebook Pixel
// ============================================================================

describe('classifyCookie — Facebook Pixel (Meta)', () => {
  it('classifies _fbp as marketing', () => {
    const c = classifyCookie('_fbp');
    expect(c.type).toBe('marketing');
    expect(c.provider).toBe('Meta (Facebook)');
  });

  it('classifies _fbc as marketing', () => {
    const c = classifyCookie('_fbc');
    expect(c.type).toBe('marketing');
    expect(c.provider).toBe('Meta (Facebook)');
  });

  it('classifies fr as marketing', () => {
    const c = classifyCookie('fr');
    expect(c.type).toBe('marketing');
    expect(c.provider).toBe('Meta (Facebook)');
  });
});

// ============================================================================
// classifyCookie — Microsoft Clarity
// ============================================================================

describe('classifyCookie — Microsoft Clarity', () => {
  it('classifies IDE as analytics', () => {
    const c = classifyCookie('IDE');
    expect(c.type).toBe('analytics');
    expect(c.provider).toBe('Microsoft Clarity');
  });
});

// ============================================================================
// classifyCookie — Google Ads
// ============================================================================

describe('classifyCookie — Google Ads', () => {
  it('classifies _gcl_au prefix variants as marketing', () => {
    const c = classifyCookie('_gcl_au_xyz123');
    expect(c.type).toBe('marketing');
    expect(c.provider).toBe('Google Ads');
  });
});

// ============================================================================
// classifyCookie — necessary / session / auth
// ============================================================================

describe('classifyCookie — necessary session/auth tokens', () => {
  it('classifies session_id (contains) as necessary', () => {
    const c = classifyCookie('app_session_id_xyz');
    expect(c.type).toBe('necessary');
    expect(c.exemptFromConsent).toBe(true);
  });

  it('classifies csrf_token (contains) as necessary', () => {
    const c = classifyCookie('my_csrf_token');
    expect(c.type).toBe('necessary');
    expect(c.exemptFromConsent).toBe(true);
  });

  it('classifies xsrf-token (contains) as necessary', () => {
    const c = classifyCookie('xsrf-token');
    expect(c.type).toBe('necessary');
  });

  it('classifies phpsessid prefix as necessary', () => {
    const c = classifyCookie('PHPSESSID123abc');
    expect(c.type).toBe('necessary');
  });

  it('heuristic: jwt → necessary', () => {
    const c = classifyCookie('jwt');
    expect(c.type).toBe('necessary');
    expect(c.exemptFromConsent).toBe(true);
  });

  it('heuristic: auth_token → necessary', () => {
    const c = classifyCookie('my_auth_token');
    expect(c.type).toBe('necessary');
  });
});

// ============================================================================
// classifyCookie — heuristic fallbacks (unknown cookies)
// ============================================================================

describe('classifyCookie — heuristic fallback', () => {
  it('heuristic: unknown analytics-style prefix _gaX → analytics', () => {
    const c = classifyCookie('_ga_unknown_test');
    // _ga prefix matches Google Analytics entry → analytics
    expect(c.type).toBe('analytics');
  });

  it('heuristic: _fbp prefix unknown variant → marketing', () => {
    const c = classifyCookie('_fbp_unknown');
    // _fbp is exact match → marketing
    expect(c.type).toBe('marketing');
  });

  it('heuristic: _ym_ prefix unknown variant → analytics', () => {
    const c = classifyCookie('_ym_custom');
    expect(c.type).toBe('analytics');
  });

  it('heuristic: contains "analytics" → analytics', () => {
    const c = classifyCookie('my_analytics_tracker');
    expect(c.type).toBe('analytics');
  });

  it('heuristic: contains "metrika" → analytics', () => {
    const c = classifyCookie('custommetrika');
    expect(c.type).toBe('analytics');
  });

  it('heuristic: unknown → necessary (safe default)', () => {
    const c = classifyCookie('totally_unknown_xyz123');
    expect(c.type).toBe('necessary');
    expect(c.exemptFromConsent).toBe(true);
  });

  it('heuristic: contains "ads" → marketing', () => {
    const c = classifyCookie('custom_ads_tracker');
    expect(c.type).toBe('marketing');
  });

  it('heuristic: contains "pixel" → marketing', () => {
    const c = classifyCookie('fb_pixel_v2');
    expect(c.type).toBe('marketing');
  });
});

// ============================================================================
// classifyCookie — case insensitivity
// ============================================================================

describe('classifyCookie — case insensitivity', () => {
  it('handles uppercase GA cookie', () => {
    const c = classifyCookie('_GA');
    expect(c.type).toBe('analytics');
  });

  it('handles mixed-case FBP cookie', () => {
    const c = classifyCookie('_FbP');
    expect(c.type).toBe('marketing');
  });
});

// ============================================================================
// classifyCookie — preserves original name
// ============================================================================

describe('classifyCookie — name preservation', () => {
  it('preserves original cookie name (not lowercased)', () => {
    const c = classifyCookie('_GA_OriginalCase');
    expect(c.name).toBe('_GA_OriginalCase');
  });
});

// ============================================================================
// classifyCookies — bulk + dedupe
// ============================================================================

describe('classifyCookies — bulk classification', () => {
  it('classifies multiple cookies in order', () => {
    const result = classifyCookies(['_ga', '_fbp', 'session_id']);
    expect(result).toHaveLength(3);
    expect(result[0]!.type).toBe('analytics');
    expect(result[1]!.type).toBe('marketing');
    expect(result[2]!.type).toBe('necessary');
  });

  it('dedupes exact duplicates (case-insensitive)', () => {
    const result = classifyCookies(['_ga', '_GA', '_ga']);
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe('analytics');
  });

  it('skips empty/whitespace names', () => {
    const result = classifyCookies(['', '   ', '_ga']);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('_ga');
  });

  it('returns empty array for empty input', () => {
    expect(classifyCookies([])).toHaveLength(0);
  });

  it('preserves all unique entries', () => {
    const result = classifyCookies([
      '_ga',
      '_gid',
      '_ym_uid',
      '_fbp',
      '_fbc',
      'IDE',
      'session_id',
    ]);
    expect(result).toHaveLength(7);
    const types = result.map((r) => r.type);
    expect(types.filter((t) => t === 'analytics')).toHaveLength(4); // _ga, _gid, _ym_uid, IDE
    expect(types.filter((t) => t === 'marketing')).toHaveLength(2); // _fbp, _fbc
    expect(types.filter((t) => t === 'necessary')).toHaveLength(1); // session_id
  });

  it('trims whitespace before classification', () => {
    const result = classifyCookies(['  _ga  ', '\t_gid\n']);
    expect(result).toHaveLength(2);
    expect(result[0]!.name).toBe('_ga');
    expect(result[1]!.name).toBe('_gid');
  });
});

// ============================================================================
// COOKIE_KNOWLEDGE — structural assertions
// ============================================================================

describe('COOKIE_KNOWLEDGE', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(COOKIE_KNOWLEDGE)).toBe(true);
    expect(COOKIE_KNOWLEDGE.length).toBeGreaterThan(5);
  });

  it('every entry has provider and type', () => {
    for (const entry of COOKIE_KNOWLEDGE) {
      expect(entry.provider).toBeTruthy();
      expect(['necessary', 'analytics', 'marketing']).toContain(entry.type);
      expect(['exact', 'prefix', 'contains']).toContain(entry.match);
    }
  });

  it('contains major analytics providers', () => {
    const providers = COOKIE_KNOWLEDGE.map((e) => e.provider);
    expect(providers).toContain('Google Analytics');
    expect(providers).toContain('Yandex Metrika');
    expect(providers).toContain('Meta (Facebook)');
  });
});
