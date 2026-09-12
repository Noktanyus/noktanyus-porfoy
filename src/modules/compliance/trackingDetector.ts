/**
 * Tracking Script Detector — Phase 4 C.2
 *
 * Script src URL'leri ve inline script içeriklerinden bilinen tracking
 * provider'ları tespit eder. Pattern-based — URL substring veya inline
 * kod parçacığı (gtag, fbq, ym, hj, vb.) ile eşleşir.
 *
 * Mimari:
 *   - SCRIPT_PATTERNS: bilinen tracker'lar — eklemek için tek yer burası.
 *   - detectTrackingScripts(src listesi) → TrackingScript[]
 *   - inferScriptsFromHtml(html) → TrackingScript[] (regex tabanlı, tarama
 *     öncesi statik HTML analizi için; örn. server-side crawl).
 *
 * Pattern reuse:
 *   - src/modules/compliance/scanner.ts (detectTrackingScript pattern)
 *   - src/modules/compliance/schemas.ts (TrackingScript type)
 */

import type { TrackingScript } from './schemas';

// ============================================================================
// SCRIPT_PATTERNS
// ============================================================================

/**
 * Tek bir tracker pattern tanımı.
 *
 * - name: identifier (log / debug için)
 * - provider: görüntü adı (UI'da gösterilir)
 * - knownTracker: tracker'ın resmi adı (örn. "GA4", "Meta Pixel")
 * - urlPattern: script src URL'inde aranan substring (case-insensitive)
 * - inlinePatterns: inline script içeriğinde aranan marker'lar (OR)
 * - gdprCompliant: ön-onay olmadan yüklenebilir mi
 */
export interface ScriptPattern {
  name: string;
  provider: string;
  knownTracker?: string;
  /** Script src URL substring (case-insensitive). */
  urlPattern?: string;
  /** Inline script içeriğinde aranan marker (herhangi biri eşleşirse). */
  inlinePatterns?: readonly string[];
  /** Ön-onay olmadan kullanılabilir mi (örn. Plausible cookieless = true). */
  gdprCompliant: boolean;
}

/**
 * Bilinen tracking pattern'leri — production'da tracker eklemek için
 * bu listeye entry eklemek yeterli.
 *
 * Sıralama önemli değil — ilk eşleşme kullanılır (provider başına dedupe).
 */
export const SCRIPT_PATTERNS: readonly ScriptPattern[] = [
  // ---- Google Analytics / GTM -----------------------------------------
  {
    name: 'google-analytics',
    provider: 'Google Analytics / GTM',
    knownTracker: 'GA4',
    urlPattern: 'google-analytics.com',
    inlinePatterns: ['gtag(', 'ga(', 'GoogleAnalyticsObject'],
    gdprCompliant: false,
  },
  {
    name: 'googletagmanager',
    provider: 'Google Tag Manager',
    knownTracker: 'GTM',
    urlPattern: 'googletagmanager.com',
    gdprCompliant: false,
  },
  {
    name: 'google-ads',
    provider: 'Google Ads',
    knownTracker: 'Google Ads Conversion',
    urlPattern: 'googleadservices.com',
    inlinePatterns: ['awct(', 'google_conversion_id'],
    gdprCompliant: false,
  },

  // ---- Yandex Metrika --------------------------------------------------
  {
    name: 'yandex-metrika',
    provider: 'Yandex Metrika',
    knownTracker: 'Yandex Metrika',
    urlPattern: 'mc.yandex.ru',
    inlinePatterns: ['ym(', 'ya.metrika', 'mc.yandex'],
    gdprCompliant: false,
  },

  // ---- Meta / Facebook Pixel ------------------------------------------
  {
    name: 'facebook-pixel',
    provider: 'Facebook Pixel',
    knownTracker: 'Meta Pixel',
    urlPattern: 'connect.facebook.net',
    inlinePatterns: ['fbq(', 'facebook.com/tr'],
    gdprCompliant: false,
  },

  // ---- Hotjar ---------------------------------------------------------
  {
    name: 'hotjar',
    provider: 'Hotjar',
    knownTracker: 'Hotjar',
    urlPattern: 'hotjar.com',
    inlinePatterns: ['_hjSettings', 'hj('],
    gdprCompliant: false,
  },

  // ---- Microsoft Clarity ----------------------------------------------
  {
    name: 'microsoft-clarity',
    provider: 'Microsoft Clarity',
    knownTracker: 'Clarity',
    urlPattern: 'clarity.ms',
    inlinePatterns: ['clarity(', 'window.clarity'],
    gdprCompliant: false,
  },

  // ---- LinkedIn Insight Tag -------------------------------------------
  {
    name: 'linkedin-insight',
    provider: 'LinkedIn Insight',
    knownTracker: 'LinkedIn Insight Tag',
    urlPattern: 'snap.licdn.com',
    inlinePatterns: ['_linkedin_partner_id', 'lintrk('],
    gdprCompliant: false,
  },

  // ---- TikTok Pixel ---------------------------------------------------
  {
    name: 'tiktok-pixel',
    provider: 'TikTok Pixel',
    knownTracker: 'TikTok Pixel',
    urlPattern: 'analytics.tiktok.com',
    inlinePatterns: ['ttq.', 'TiktokAnalyticsObject'],
    gdprCompliant: false,
  },

  // ---- Plausible (cookieless — compliant) ----------------------------
  {
    name: 'plausible',
    provider: 'Plausible Analytics',
    knownTracker: 'Plausible',
    urlPattern: 'plausible.io',
    gdprCompliant: true,
  },

  // ---- Umami (cookieless — compliant) --------------------------------
  {
    name: 'umami',
    provider: 'Umami Analytics',
    knownTracker: 'Umami',
    urlPattern: 'umami.is',
    inlinePatterns: ['umami(', 'data-website-id'],
    gdprCompliant: true,
  },
] as const;

// ============================================================================
// Public API
// ============================================================================

/**
 * Script src URL'leri ve inline içerikleri → TrackingScript[].
 *
 * - src URL'leri için urlPattern eşleşmesi
 * - inline script'ler için inlinePatterns eşleşmesi
 * - Aynı provider'dan birden fazla eşleşme → tek kayıt (dedupe by provider)
 */
export function detectTrackingScripts(
  scripts: readonly { src: string; inline?: string | null }[]
): TrackingScript[] {
  const out = new Map<string, TrackingScript>();
  for (const s of scripts) {
    const detected = matchScript(s);
    if (!detected) continue;
    const key = `${detected.provider}|${detected.url}`;
    if (!out.has(key)) out.set(key, detected);
  }
  return Array.from(out.values());
}

/**
 * Statik HTML'den tracking script tespiti — sunucu tarafı crawl veya
 * crawler'ın JS çalıştırmadan önceki analizi için.
 *
 * HTML içindeki <script src="..."> ve inline <script>...</script>
 * bloklarını regex ile parse eder, sonra detectTrackingScripts'i çağırır.
 *
 * NOT: Production HTML genellikle minified; bu yüzden script src extract
 * basit regex ile çalışır. Karmaşık HTML parser (cheerio) gerekirse ileride
 * eklenebilir.
 */
export function inferScriptsFromHtml(html: string): TrackingScript[] {
  const scripts: Array<{ src: string; inline?: string | null }> = [];

  // <script src="..."> tags
  const srcRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = srcRegex.exec(html)) !== null) {
    scripts.push({ src: m[1] });
  }

  // <script>...inline...</script> (src olmayanlar)
  const inlineRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = inlineRegex.exec(html)) !== null) {
    const content = (m[1] ?? '').slice(0, 2000);
    if (content.trim().length === 0) continue;
    scripts.push({ src: 'inline', inline: content });
  }

  return detectTrackingScripts(scripts);
}

// ============================================================================
// Helpers
// ============================================================================

function matchScript(s: { src: string; inline?: string | null }): TrackingScript | null {
  const srcLower = s.src.toLowerCase();
  const inlineLower = (s.inline ?? '').toLowerCase();

  for (const pattern of SCRIPT_PATTERNS) {
    // URL pattern match
    if (pattern.urlPattern && srcLower.includes(pattern.urlPattern.toLowerCase())) {
      return buildTrackingScript(s, pattern);
    }
    // Inline pattern match — inline content varsa ve marker varsa
    if (
      s.inline &&
      pattern.inlinePatterns &&
      pattern.inlinePatterns.some((p) => inlineLower.includes(p.toLowerCase()))
    ) {
      return buildTrackingScript(s, pattern);
    }
  }
  return null;
}

function buildTrackingScript(
  s: { src: string; inline?: string | null },
  pattern: ScriptPattern
): TrackingScript {
  const isInline = s.src === 'inline' || s.src.startsWith('inline:');
  return {
    url: isInline ? `inline:${s.inline?.slice(0, 80) ?? ''}` : s.src,
    provider: pattern.provider,
    knownTracker: pattern.knownTracker,
    gdprCompliant: pattern.gdprCompliant,
  };
}
