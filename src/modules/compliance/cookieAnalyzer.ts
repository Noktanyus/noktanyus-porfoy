/**
 * Cookie Analyzer — Phase 4 C.2
 *
 * Cookie adından kategori (necessary/analytics/marketing), provider, açık
 * rıza muafiyeti ve tipik süre gibi metadata çıkarır. Bilinen tracker
 * pattern'leri için bilgi tabanı (COOKIE_KNOWLEDGE) kullanır; bilinmeyen
 * cookie'ler için heuristic fallback uygular.
 *
 * Mimari:
 *   - Single source of truth — scanner.ts inline helper'ları buradan import
 *     edilebilir (ileride refactor için).
 *   - Pure functions — DB / IO yok, unit test kolay.
 *   - Zod-safe — dönen tipler schemas.ts'den gelir.
 *
 * Pattern reuse:
 *   - src/modules/compliance/scanner.ts (classifyCookie helper pattern)
 *   - src/modules/compliance/schemas.ts (CookieRecord, CookieType)
 */

import type { CookieRecord, CookieType } from './schemas';

// ============================================================================
// COOKIE_KNOWLEDGE — bilinen cookie metadata
// ============================================================================

/**
 * Tek bir cookie için bilinen metadata.
 *
 * - name: tam eşleşme veya prefix (lowercase karşılaştırma)
 * - match: 'exact' | 'prefix' | 'contains'
 * - provider: çerez sahibi (örn. "Google Analytics")
 * - purpose: GDPR açısından işlev tanımı
 * - durationDays: tipik saklama süresi (gün) — undefined ise session
 * - gdprCompliant: ön-onay olmadan kullanılabilir mi (necessary = true)
 */
export interface CookieKnowledgeEntry {
  name: string;
  match: 'exact' | 'prefix' | 'contains';
  provider: string;
  purpose: string;
  durationDays?: number;
  /** Ön-onay olmadan kullanılabilir mi (sadece necessary). */
  gdprCompliant: boolean;
  type: CookieType;
}

/**
 * Bilinen cookie metadata veritabanı — Google Analytics, Yandex Metrika,
 * Facebook Pixel, Hotjar, Microsoft Clarity ve yaygın session/auth cookie'ler.
 *
 * Sıralama: longest prefix/match first — `classifyCookie` ilk eşleşmeyi alır.
 */
export const COOKIE_KNOWLEDGE: readonly CookieKnowledgeEntry[] = [
  // ---- Session / Auth (necessary, exempt from consent) -----------------
  {
    name: 'session_id',
    match: 'contains',
    provider: 'first-party',
    purpose: 'User session identifier',
    gdprCompliant: true,
    type: 'necessary',
  },
  {
    name: 'csrf_token',
    match: 'contains',
    provider: 'first-party',
    purpose: 'Cross-site request forgery protection token',
    gdprCompliant: true,
    type: 'necessary',
  },
  {
    name: 'xsrf-token',
    match: 'contains',
    provider: 'first-party',
    purpose: 'XSRF protection token (Next.js default)',
    gdprCompliant: true,
    type: 'necessary',
  },
  {
    name: 'phpsessid',
    match: 'prefix',
    provider: 'first-party',
    purpose: 'PHP session identifier',
    gdprCompliant: true,
    type: 'necessary',
  },

  // ---- Google Analytics (analytics, requires consent) ------------------
  {
    name: '_ga',
    match: 'prefix',
    provider: 'Google Analytics',
    purpose: 'Kullanıcı ayırt etme (Universal Analytics / GA4)',
    durationDays: 730,
    gdprCompliant: false,
    type: 'analytics',
  },
  {
    name: '_gid',
    match: 'exact',
    provider: 'Google Analytics',
    purpose: 'Kullanıcı ayırt etme (24 saat)',
    durationDays: 1,
    gdprCompliant: false,
    type: 'analytics',
  },
  {
    name: '_gat',
    match: 'exact',
    provider: 'Google Analytics',
    purpose: 'Throttling rate (1 dakika)',
    durationDays: 0,
    gdprCompliant: false,
    type: 'analytics',
  },

  // ---- Yandex Metrika (analytics, requires consent) --------------------
  {
    name: '_ym_uid',
    match: 'exact',
    provider: 'Yandex Metrika',
    purpose: 'Kullanıcı ayırt etme (Yandex Metrika)',
    durationDays: 365,
    gdprCompliant: false,
    type: 'analytics',
  },
  {
    name: '_ym_d',
    match: 'exact',
    provider: 'Yandex Metrika',
    purpose: 'İlk ziyaret tarihi (Yandex Metrika)',
    durationDays: 365,
    gdprCompliant: false,
    type: 'analytics',
  },

  // ---- Facebook Pixel (marketing, requires consent) --------------------
  {
    name: '_fbp',
    match: 'exact',
    provider: 'Meta (Facebook)',
    purpose: 'Facebook Pixel — reklam dönüşüm takibi',
    durationDays: 90,
    gdprCompliant: false,
    type: 'marketing',
  },
  {
    name: '_fbc',
    match: 'exact',
    provider: 'Meta (Facebook)',
    purpose: 'Facebook click identifier (ad click)',
    durationDays: 90,
    gdprCompliant: false,
    type: 'marketing',
  },
  {
    name: 'fr',
    match: 'exact',
    provider: 'Meta (Facebook)',
    purpose: 'Facebook Pixel browser identifier',
    durationDays: 90,
    gdprCompliant: false,
    type: 'marketing',
  },

  // ---- Microsoft Clarity (analytics, requires consent) ----------------
  {
    name: 'IDE',
    match: 'exact',
    provider: 'Microsoft Clarity',
    purpose: 'Kullanıcı ayırt etme (Microsoft Clarity)',
    durationDays: 365,
    gdprCompliant: false,
    type: 'analytics',
  },

  // ---- Misc marketing --------------------------------------------------
  {
    name: '_gcl_au',
    match: 'prefix',
    provider: 'Google Ads',
    purpose: 'Google Ads conversion linker',
    durationDays: 90,
    gdprCompliant: false,
    type: 'marketing',
  },
  {
    name: 'vs',
    match: 'exact',
    provider: 'Visual Website Optimizer (VWO)',
    purpose: 'A/B test kullanıcı ayırt etme',
    durationDays: 365,
    gdprCompliant: false,
    type: 'marketing',
  },
] as const;

// ============================================================================
// Public API
// ============================================================================

/**
 * Tek bir cookie adını sınıflandırır — knowledge base + heuristic fallback.
 *
 * Öncelik sırası:
 *   1. COOKIE_KNOWLEDGE içinde tam/prefix/contains eşleşme
 *   2. Heuristic: csrf/session/auth token → necessary
 *   3. Heuristic: _ga/_gid/_fbp/_ym → analytics/marketing
 *   4. Default: necessary (bilinmiyor → en güvenli taraf)
 *
 * Not: scanner.ts'te default 'analytics' idi; burada 'necessary' yapıyoruz
 * çünkü bilinmeyen cookie'lerin "consent gerekli" kabul edilmesi daha güvenli.
 */
export function classifyCookie(name: string): CookieRecord {
  const lower = name.toLowerCase();
  const hit = findKnowledgeEntry(lower);
  if (hit) {
    return {
      name,
      provider: hit.provider,
      purpose: hit.purpose,
      duration: formatDuration(hit.durationDays),
      type: hit.type,
      exemptFromConsent: hit.gdprCompliant,
    };
  }

  // Heuristic fallback
  const heuristic = heuristicClassify(lower);
  return {
    name,
    provider: undefined,
    purpose: undefined,
    duration: undefined,
    type: heuristic,
    exemptFromConsent: heuristic === 'necessary',
  };
}

/**
 * Cookie adı listesi → CookieRecord[] (batch, dedupe korunur).
 */
export function classifyCookies(names: readonly string[]): CookieRecord[] {
  const seen = new Set<string>();
  const out: CookieRecord[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push(classifyCookie(name));
  }
  return out;
}

// ============================================================================
// Helpers
// ============================================================================

function findKnowledgeEntry(lower: string): CookieKnowledgeEntry | null {
  for (const entry of COOKIE_KNOWLEDGE) {
    const target = entry.name.toLowerCase();
    if (entry.match === 'exact' && lower === target) return entry;
    if (entry.match === 'prefix' && lower.startsWith(target)) return entry;
    if (entry.match === 'contains' && lower.includes(target)) return entry;
  }
  return null;
}

function heuristicClassify(lower: string): CookieType {
  // Necessary — auth/session/csrf tokens
  if (
    lower.includes('session') ||
    lower.includes('csrf') ||
    lower.includes('xsrf') ||
    lower.includes('token') ||
    lower.includes('auth') ||
    lower.startsWith('phpsessid') ||
    lower.startsWith('asp.net') ||
    lower === 'jwt'
  ) {
    return 'necessary';
  }
  // Marketing — known ad-tech signatures
  if (
    lower.startsWith('_fbp') ||
    lower.startsWith('_fbc') ||
    lower === 'fr' ||
    lower.includes('ads') ||
    lower.includes('pixel') ||
    lower.startsWith('_gcl_au')
  ) {
    return 'marketing';
  }
  // Analytics — common analytics prefixes
  if (
    lower.startsWith('_ga') ||
    lower.startsWith('_gid') ||
    lower.startsWith('_gat') ||
    lower.startsWith('_ym_') ||
    lower.includes('analytics') ||
    lower.includes('metrika') ||
    lower.includes('clarity')
  ) {
    return 'analytics';
  }
  // Unknown → necessary (en güvenli taraf, açık rıza gerekli kabul et)
  return 'necessary';
}

/** durationDays → ISO-8601 / natural language string. */
function formatDuration(days?: number): string | undefined {
  if (days === undefined || days === null) return undefined;
  if (days === 0) return 'session';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}
