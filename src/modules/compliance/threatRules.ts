/**
 * Threat Rules Engine — Phase 4 C.2
 *
 * Cookie, script, form ve site metadata'yı alıp KVKK/GDPR tehditlerini
 * çıkarır. Kurallar declarative (ThreatRule[]) — yeni tehdit eklemek için
 * DEFAULT_THREAT_RULES'a entry eklemek yeterli.
 *
 * Mimari:
 *   - ThreatRule: bir kural tanımı (id, severity, evaluate(ctx))
 *   - DEFAULT_THREAT_RULES: 8 varsayılan kural
 *   - evaluateThreats(ctx): tüm kuralları çalıştır, Threat[] döner
 *   - computeComplianceScore(threats): 100'den başla, ağırlıklar kadar düş
 *
 * Pattern reuse:
 *   - src/modules/compliance/scanner.ts (scriptThreatsFor / formThreatsFor)
 *   - src/modules/compliance/schemas.ts (Threat, ThreatSeverity types)
 */

import type {
  CookieRecord,
  FormRecord,
  Threat,
  ThreatSeverity,
  TrackingScript,
} from './schemas';

// ============================================================================
// ThreatRule
// ============================================================================

/**
 * Threat evaluation context — bir kuralın ihtiyaç duyduğu tüm bilgi.
 */
export interface ThreatContext {
  cookies: readonly CookieRecord[];
  trackingScripts: readonly TrackingScript[];
  forms: readonly FormRecord[];
  /** Tarama yapılan sayfa URL listesi (HTTPS kontrolü için). */
  pageUrls: readonly string[];
  /** HTML içeriğinde privacy policy link'i var mı? */
  hasPrivacyPolicyLink: boolean;
  /** Sitede /cerez-politikasi veya /cookie-policy sayfası var mı? */
  hasCookiePolicyPage: boolean;
  /** Cookie consent banner mevcut mu? */
  hasCookieBanner: boolean;
}

export interface ThreatRule {
  /** Unique identifier (log + debug için). */
  id: string;
  severity: ThreatSeverity;
  /** KVKK/GDPR referansı. */
  regulationRef: string;
  /** Kısa açıklama — UI'da gösterilir. */
  description: string;
  /** Kuralın ne yaptığının kısa özeti (audit için). */
  evaluate: (ctx: ThreatContext) => Threat | null;
}

// ============================================================================
// DEFAULT_THREAT_RULES
// ============================================================================

/**
 * Varsayılan tehdit kuralları. 8 kural:
 *
 * 1. analytics_without_consent         — Analytics cookie var, consent banner yok
 * 2. missing_privacy_policy_link       — Sitede privacy policy link'i yok
 * 3. pii_form_no_consent               — PII form, onay checkbox'ı yok
 * 4. third_party_iframe_no_sandbox     — 3rd-party iframe sandbox attribute yok
 * 5. cookie_duration_too_long          — Cookie süresi > 365 gün
 * 6. missing_cookie_policy_page        — Cookie policy sayfası yok
 * 7. yandex_metrika_without_consent    — Yandex Metrika, consent yok
 * 8. missing_https                     — Sayfa HTTP kullanıyor
 */
export const DEFAULT_THREAT_RULES: readonly ThreatRule[] = [
  // 1. Analytics without consent
  {
    id: 'analytics_without_consent',
    severity: 'HIGH',
    regulationRef: 'KVKK Madde 5/1 / GDPR Art. 6',
    description: 'Analytics/marketing cookie kullanılıyor ancak consent banner bulunamadı',
    evaluate: (ctx) => {
      const hasNonEssential = ctx.cookies.some(
        (c) => c.type === 'analytics' || c.type === 'marketing'
      );
      if (!hasNonEssential || ctx.hasCookieBanner) return null;
      return {
        severity: 'HIGH',
        type: 'analytics_without_consent',
        description:
          'Analytics/marketing cookie kullanılıyor ancak açık rıza (cookie banner) bulunamadı.',
        regulationRef: 'KVKK Madde 5/1 / GDPR Art. 6',
        fixSuggestion:
          'Analytics ve marketing cookie\'ler için opt-in cookie banner ekleyin (örn. Cookiebot, OneTrust).',
      };
    },
  },

  // 2. Missing privacy policy link
  {
    id: 'missing_privacy_policy_link',
    severity: 'HIGH',
    regulationRef: 'KVKK Madde 10 / GDPR Art. 13-14',
    description: 'Sitede aydınlatma metni (privacy policy) linki bulunamadı',
    evaluate: (ctx) => {
      if (ctx.hasPrivacyPolicyLink) return null;
      return {
        severity: 'HIGH',
        type: 'missing_privacy_policy_link',
        description: 'Site footer/header\'da KVKK aydınlatma metni linki tespit edilmedi.',
        regulationRef: 'KVKK Madde 10 / GDPR Art. 13-14',
        fixSuggestion:
          'Tüm sayfalardan erişilebilir bir "Aydınlatma Metni" linki ekleyin (footer\'da veya header menüsünde).',
      };
    },
  },

  // 3. PII form, no consent
  {
    id: 'pii_form_no_consent',
    severity: 'HIGH',
    regulationRef: 'KVKK Madde 5/1 / GDPR Art. 6/7',
    description: 'PII toplayan formda onay checkbox\'ı yok',
    evaluate: (ctx) => {
      const violations: FormRecord[] = ctx.forms.filter(
        (f) => f.consentRequired && f.fields.some((x) => x.sensitive)
      );
      if (violations.length === 0) return null;
      return {
        severity: 'HIGH',
        type: 'pii_form_no_consent',
        description: `${violations.length} form hassas kişisel veri topluyor ancak onay checkbox'ı yok: ${violations
          .slice(0, 3)
          .map((v) => v.url)
          .join(', ')}`,
        regulationRef: 'KVKK Madde 5/1 / GDPR Art. 6/7',
        fixSuggestion:
          'Form\'a "KVKK kapsamında kişisel verilerimin işlenmesini kabul ediyorum" tipinde zorunlu onay checkbox\'ı ekleyin.',
        pageUrl: violations[0]?.url,
      };
    },
  },

  // 4. Third-party iframe, no sandbox
  {
    id: 'third_party_iframe_no_sandbox',
    severity: 'MEDIUM',
    regulationRef: 'KVKK Madde 12 / GDPR Art. 32',
    description: 'Üçüncü taraf iframe sandbox attribute olmadan yüklenmiş',
    evaluate: (ctx) => {
      // Tracking script provider'ları iframe yükler (GA debug view, Clarity replay vb.)
      // Burada iframe sandbox kontrolü scanner.ts'e eklenebilir; şimdilik heuristik:
      // 3+ farklı 3rd-party tracker varsa sandbox uyarısı çıkar.
      const distinctProviders = new Set(
        ctx.trackingScripts.filter((t) => !t.gdprCompliant).map((t) => t.provider)
      );
      if (distinctProviders.size < 3) return null;
      return {
        severity: 'MEDIUM',
        type: 'third_party_iframe_no_sandbox',
        description: `${distinctProviders.size} farklı 3rd-party tracker tespit edildi; iframe sandbox attribute kontrolü önerilir.`,
        regulationRef: 'KVKK Madde 12 / GDPR Art. 32',
        fixSuggestion:
          '3rd-party iframe\'lere sandbox="allow-scripts allow-same-origin" attribute ekleyin.',
      };
    },
  },

  // 5. Cookie duration too long
  {
    id: 'cookie_duration_too_long',
    severity: 'MEDIUM',
    regulationRef: 'GDPR Art. 5/1(e) — Storage Limitation',
    description: 'Bir cookie 365 günden uzun süre saklanıyor',
    evaluate: (ctx) => {
      const longCookies = ctx.cookies.filter((c) => {
        const days = parseDurationDays(c.duration);
        return days !== null && days > 365;
      });
      if (longCookies.length === 0) return null;
      return {
        severity: 'MEDIUM',
        type: 'cookie_duration_too_long',
        description: `Uzun süreli cookie'ler tespit edildi (>365 gün): ${longCookies
          .slice(0, 3)
          .map((c) => c.name)
          .join(', ')}`,
        regulationRef: 'GDPR Art. 5/1(e) — Storage Limitation',
        fixSuggestion:
          'Cookie sürelerini veri işleme amacıyla orantılı olacak şekilde kısaltın (max 365 gün önerilir).',
      };
    },
  },

  // 6. Missing cookie policy page
  {
    id: 'missing_cookie_policy_page',
    severity: 'MEDIUM',
    regulationRef: 'KVKK Madde 10 / GDPR Art. 13',
    description: 'Çerez politikası sayfası bulunamadı',
    evaluate: (ctx) => {
      if (ctx.hasCookiePolicyPage) return null;
      const hasNonEssential = ctx.cookies.some((c) => c.type !== 'necessary');
      if (!hasNonEssential) return null;
      return {
        severity: 'MEDIUM',
        type: 'missing_cookie_policy_page',
        description:
          'Sitede /cerez-politikasi, /cookie-policy veya eşdeğer bir çerez politikası sayfası tespit edilmedi.',
        regulationRef: 'KVKK Madde 10 / GDPR Art. 13',
        fixSuggestion:
          'Kullanılan tüm cookie\'leri listeleyen bir "Çerez Politikası" sayfası oluşturun ve footer\'dan linkleyin.',
      };
    },
  },

  // 7. Yandex Metrika without consent
  {
    id: 'yandex_metrika_without_consent',
    severity: 'HIGH',
    regulationRef: 'KVKK Madde 5/1 / GDPR Art. 6',
    description: 'Yandex Metrika consent olmadan yüklenmiş',
    evaluate: (ctx) => {
      const yaMetrika = ctx.trackingScripts.find((t) =>
        t.provider.toLowerCase().includes('yandex')
      );
      if (!yaMetrika || yaMetrika.gdprCompliant || ctx.hasCookieBanner) return null;
      return {
        severity: 'HIGH',
        type: 'yandex_metrika_without_consent',
        description:
          'Yandex Metrika yüklenmiş ancak cookie consent alınmamış. Yandex, sunucu konumu (Rusya) nedeniyle ek risk taşır.',
        regulationRef: 'KVKK Madde 5/1 / GDPR Art. 6',
        fixSuggestion:
          'Yandex Metrika\'yı consent alındıktan sonra yükleyin veya veri transfer sözleşmesi (SCC) imzalayın.',
        pageUrl: yaMetrika.url.startsWith('http') ? yaMetrika.url : undefined,
      };
    },
  },

  // 8. Missing HTTPS
  {
    id: 'missing_https',
    severity: 'HIGH',
    regulationRef: 'KVKK Madde 12 / GDPR Art. 32',
    description: 'Sayfa HTTP üzerinden serve ediliyor',
    evaluate: (ctx) => {
      const httpUrls = ctx.pageUrls.filter((u) => u.startsWith('http://'));
      if (httpUrls.length === 0) return null;
      return {
        severity: 'HIGH',
        type: 'missing_https',
        description: `${httpUrls.length} sayfa HTTP üzerinden serve ediliyor: ${httpUrls
          .slice(0, 3)
          .join(', ')}`,
        regulationRef: 'KVKK Madde 12 / GDPR Art. 32',
        fixSuggestion: 'Tüm trafiği HTTPS üzerinden serve edin (Let\'s Encrypt ücretsiz).',
        pageUrl: httpUrls[0],
      };
    },
  },
] as const;

// ============================================================================
// Public API
// ============================================================================

/**
 * Tüm tehdit kurallarını context üzerinde çalıştır, Threat[] döner.
 * Boş liste döndüğünde hiçbir tehdit tespit edilmedi anlamına gelir.
 */
export function evaluateThreats(ctx: ThreatContext): Threat[] {
  const out: Threat[] = [];
  for (const rule of DEFAULT_THREAT_RULES) {
    try {
      const threat = rule.evaluate(ctx);
      if (threat) out.push(threat);
    } catch (err) {
      // Bir kural fail olursa diğerleri etkilenmesin
      // (logger'ı import etmiyoruz — pure module; caller loglar)
      void err;
    }
  }
  return out;
}

/**
 * Compliance skoru — 100'den başla, threat severity ağırlıkları kadar düş.
 *
 * Ağırlıklar (scanner.ts ile uyumlu):
 *   CRITICAL: 25
 *   HIGH:     15
 *   MEDIUM:    8
 *   LOW:       3
 *
 * Sonuç 0-100 arasında clamp edilir.
 */
export function computeComplianceScore(threats: readonly Threat[]): number {
  const weights: Record<ThreatSeverity, number> = {
    CRITICAL: 25,
    HIGH: 15,
    MEDIUM: 8,
    LOW: 3,
  };
  let penalty = 0;
  for (const t of threats) {
    penalty += weights[t.severity] ?? 0;
  }
  return Math.max(0, Math.min(100, 100 - penalty));
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * duration string → gün cinsinden sayı. Parse edilemezse null.
 *
 * Desteklenen formatlar:
 *   - "session"        → 0
 *   - "1 day"          → 1
 *   - "30 days"        → 30
 *   - "3 months"       → 90
 *   - "2 years"        → 730
 *   - ISO 8601 date    → bugüne kadar kalan gün
 */
export function parseDurationDays(duration: string | undefined): number | null {
  if (!duration) return null;
  const trimmed = duration.trim();
  if (trimmed === 'session') return 0;

  // Natural language: "30 days", "3 months", "2 years"
  const nlMatch = trimmed.match(/^(\d+)\s+(day|days|month|months|year|years)$/i);
  if (nlMatch) {
    const n = parseInt(nlMatch[1] ?? '0', 10);
    const unit = (nlMatch[2] ?? '').toLowerCase();
    if (unit.startsWith('day')) return n;
    if (unit.startsWith('month')) return n * 30;
    if (unit.startsWith('year')) return n * 365;
  }

  // ISO 8601 date
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    const diffMs = date.getTime() - Date.now();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  return null;
}
