/**
 * Tracking Detector — Unit Tests (Phase 4 C.2)
 *
 * Test coverage:
 *   - detectTrackingScripts: URL + inline pattern matching for known trackers
 *   - inferScriptsFromHtml: regex-based HTML parsing
 *   - SCRIPT_PATTERNS structural assertions
 */

import { describe, it, expect } from 'vitest';
import {
  detectTrackingScripts,
  inferScriptsFromHtml,
  SCRIPT_PATTERNS,
} from '../trackingDetector';

// ============================================================================
// detectTrackingScripts — Google Analytics
// ============================================================================

describe('detectTrackingScripts — Google Analytics', () => {
  it('detects GA via google-analytics.com URL', () => {
    const result = detectTrackingScripts([
      { src: 'https://www.google-analytics.com/analytics.js' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('Google Analytics / GTM');
    expect(result[0]!.knownTracker).toBe('GA4');
    expect(result[0]!.gdprCompliant).toBe(false);
  });

  it('detects GA via gtag() inline pattern', () => {
    const result = detectTrackingScripts([
      {
        src: 'inline',
        inline: 'gtag("config", "G-XXXXX")',
      },
    ]);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]!.provider).toBe('Google Analytics / GTM');
  });

  it('detects GTM via googletagmanager.com URL', () => {
    const result = detectTrackingScripts([
      { src: 'https://www.googletagmanager.com/gtag.js?id=GTM-XXXXX' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('Google Tag Manager');
    expect(result[0]!.knownTracker).toBe('GTM');
  });

  it('detects Google Ads via googleadservices.com', () => {
    const result = detectTrackingScripts([
      { src: 'https://www.googleadservices.com/pagead/conversion.js' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('Google Ads');
  });
});

// ============================================================================
// detectTrackingScripts — Yandex Metrika
// ============================================================================

describe('detectTrackingScripts — Yandex Metrika', () => {
  it('detects Yandex via mc.yandex.ru URL', () => {
    const result = detectTrackingScripts([
      { src: 'https://mc.yandex.ru/metrika/tag.js' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('Yandex Metrika');
    expect(result[0]!.gdprCompliant).toBe(false);
  });

  it('detects Yandex via ym() inline pattern', () => {
    const result = detectTrackingScripts([
      {
        src: 'inline',
        inline: 'ym(98765432, "init", ...)',
      },
    ]);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]!.provider).toBe('Yandex Metrika');
  });
});

// ============================================================================
// detectTrackingScripts — Facebook Pixel
// ============================================================================

describe('detectTrackingScripts — Facebook Pixel', () => {
  it('detects Facebook via connect.facebook.net URL', () => {
    const result = detectTrackingScripts([
      { src: 'https://connect.facebook.net/en_US/fbevents.js' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('Facebook Pixel');
    expect(result[0]!.knownTracker).toBe('Meta Pixel');
  });

  it('detects Facebook via fbq() inline pattern', () => {
    const result = detectTrackingScripts([
      {
        src: 'inline',
        inline: 'fbq("track", "PageView");',
      },
    ]);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]!.provider).toBe('Facebook Pixel');
  });
});

// ============================================================================
// detectTrackingScripts — Other providers
// ============================================================================

describe('detectTrackingScripts — other providers', () => {
  it('detects Hotjar', () => {
    const result = detectTrackingScripts([
      { src: 'https://static.hotjar.com/c/hotjar-12345.js' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('Hotjar');
  });

  it('detects Microsoft Clarity', () => {
    const result = detectTrackingScripts([
      { src: 'https://www.clarity.ms/tag/abc.js' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('Microsoft Clarity');
  });

  it('detects LinkedIn Insight', () => {
    const result = detectTrackingScripts([
      { src: 'https://snap.licdn.com/li.lms-analytics/insight.min.js' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('LinkedIn Insight');
  });

  it('detects TikTok Pixel', () => {
    const result = detectTrackingScripts([
      { src: 'https://analytics.tiktok.com/i18n/pixel/events.js' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('TikTok Pixel');
  });
});

// ============================================================================
// detectTrackingScripts — GDPR-compliant providers
// ============================================================================

describe('detectTrackingScripts — GDPR-compliant providers', () => {
  it('detects Plausible (cookieless) as compliant', () => {
    const result = detectTrackingScripts([
      { src: 'https://plausible.io/js/script.js' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('Plausible Analytics');
    expect(result[0]!.gdprCompliant).toBe(true);
  });

  it('detects Umami (cookieless) as compliant', () => {
    const result = detectTrackingScripts([
      { src: 'https://umami.is/script.js' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('Umami Analytics');
    expect(result[0]!.gdprCompliant).toBe(true);
  });
});

// ============================================================================
// detectTrackingScripts — dedupe & filtering
// ============================================================================

describe('detectTrackingScripts — dedupe behavior', () => {
  it('returns empty array for unknown scripts', () => {
    const result = detectTrackingScripts([
      { src: 'https://example.com/my-app.js' },
      { src: 'https://cdn.example.com/jquery.min.js' },
    ]);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(detectTrackingScripts([])).toHaveLength(0);
  });

  it('dedupes multiple matches for same provider+url combo', () => {
    const result = detectTrackingScripts([
      { src: 'https://www.google-analytics.com/analytics.js' },
      { src: 'https://www.google-analytics.com/analytics.js' },
    ]);
    expect(result).toHaveLength(1);
  });

  it('keeps different providers separate', () => {
    const result = detectTrackingScripts([
      { src: 'https://www.google-analytics.com/analytics.js' },
      { src: 'https://connect.facebook.net/en_US/fbevents.js' },
      { src: 'https://mc.yandex.ru/metrika/tag.js' },
    ]);
    expect(result).toHaveLength(3);
  });

  it('does not detect when script has no src and no inline content', () => {
    const result = detectTrackingScripts([{ src: '', inline: null }]);
    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// detectTrackingScripts — inline content shape
// ============================================================================

describe('detectTrackingScripts — inline content', () => {
  it('uses inline snippet as URL when src is "inline"', () => {
    const result = detectTrackingScripts([
      {
        src: 'inline',
        inline: 'gtag("config", "G-123")',
      },
    ]);
    expect(result[0]!.url).toMatch(/^inline:/);
  });

  it('handles inline null/undefined gracefully', () => {
    const result = detectTrackingScripts([{ src: 'inline', inline: null }]);
    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// inferScriptsFromHtml — regex parsing
// ============================================================================

describe('inferScriptsFromHtml — regex parsing', () => {
  it('extracts script src URLs from HTML', () => {
    const html = `
      <html>
        <head>
          <script src="https://www.google-analytics.com/analytics.js"></script>
          <script src="https://connect.facebook.net/en_US/fbevents.js"></script>
        </head>
      </html>
    `;
    const result = inferScriptsFromHtml(html);
    expect(result.length).toBeGreaterThanOrEqual(2);
    const providers = result.map((r) => r.provider);
    expect(providers).toContain('Google Analytics / GTM');
    expect(providers).toContain('Facebook Pixel');
  });

  it('extracts inline scripts without src attribute', () => {
    const html = `
      <html>
        <body>
          <script>fbq('track', 'PageView');</script>
        </body>
      </html>
    `;
    const result = inferScriptsFromHtml(html);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]!.provider).toBe('Facebook Pixel');
  });

  it('returns empty for HTML without scripts', () => {
    const html = '<html><body><h1>No scripts</h1></body></html>';
    const result = inferScriptsFromHtml(html);
    expect(result).toHaveLength(0);
  });

  it('handles single-quoted src attribute', () => {
    const html = `<script src='https://mc.yandex.ru/metrika/tag.js'></script>`;
    const result = inferScriptsFromHtml(html);
    expect(result).toHaveLength(1);
    expect(result[0]!.provider).toBe('Yandex Metrika');
  });

  it('skips empty inline scripts', () => {
    const html = `<html><body><script></script><script>  </script></body></html>`;
    const result = inferScriptsFromHtml(html);
    expect(result).toHaveLength(0);
  });

  it('extracts multiple inline scripts', () => {
    const html = `
      <script>gtag('config', 'G-1');</script>
      <script>fbq('init', '123');</script>
    `;
    const result = inferScriptsFromHtml(html);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('parses complex HTML with mixed script types', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script src="https://www.googletagmanager.com/gtm.js"></script>
          <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
          </script>
          <link rel="stylesheet" href="style.css">
        </head>
        <body>
          <script src="https://plausible.io/js/script.js" defer></script>
          <script>fbq('track', 'Lead');</script>
        </body>
      </html>
    `;
    const result = inferScriptsFromHtml(html);
    const providers = result.map((r) => r.provider);
    expect(providers).toContain('Google Tag Manager');
    expect(providers).toContain('Plausible Analytics');
  });

  it('handles HTML with no src and inline content separately', () => {
    const html = `<script type="text/javascript">ym(123, 'init', {});</script>`;
    const result = inferScriptsFromHtml(html);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// SCRIPT_PATTERNS — structural assertions
// ============================================================================

describe('SCRIPT_PATTERNS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(SCRIPT_PATTERNS)).toBe(true);
    expect(SCRIPT_PATTERNS.length).toBeGreaterThan(5);
  });

  it('every pattern has provider name', () => {
    for (const p of SCRIPT_PATTERNS) {
      expect(p.provider).toBeTruthy();
      expect(typeof p.name).toBe('string');
    }
  });

  it('every pattern has a boolean gdprCompliant flag', () => {
    for (const p of SCRIPT_PATTERNS) {
      expect(typeof p.gdprCompliant).toBe('boolean');
    }
  });

  it('includes known major providers', () => {
    const providers = SCRIPT_PATTERNS.map((p) => p.provider);
    expect(providers).toContain('Google Analytics / GTM');
    expect(providers).toContain('Yandex Metrika');
    expect(providers).toContain('Facebook Pixel');
    expect(providers).toContain('Hotjar');
    expect(providers).toContain('Microsoft Clarity');
  });
});
