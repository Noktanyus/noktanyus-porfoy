/**
 * Compliance Site Crawler — Playwright-based (Phase 4 C.2)
 *
 * Bir domain'i headless Chromium ile crawl eder; cookie, tracking script
 * ve kişisel veri formlarını tespit edip KVKK/GDPR uyumluluk tehditlerini
 * çıkarır. Sonuç ScanResult tipinde döner (service.ts bu sonucu CookieScan
 * tablosuna yazar).
 *
 * Mimari:
 *   - Lazy-loaded chromium (her çağrıda yeni context; memory leak riski düşük).
 *   - Tek sayfa crawl — BFS derinliği 1, max pages=5 (timeout kontrolü).
 *   - Her sayfa için: cookies + scripts + forms + threats analizi.
 *   - Score hesabı: 100'den başla, threat ağırlıkları kadar düş.
 *
 * Pattern reuse:
 *   - Playwright zaten @playwright/test ile kurulu (devDep).
 *   - logger.error ile tüm hatalar merkezi loga düşer.
 *   - Zod ScanResultSchema ile output validate edilir.
 *
 * NOT: Production'da playwright browser binary'si runtime'da gerekli.
 * Development'ta `npx playwright install chromium` ile kurulmalı.
 */

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';

import { logger } from '@/lib/logger';
import {
  ScanResultSchema,
  type ScanResult,
  type CookieRecord,
  type TrackingScript,
  type FormRecord,
  type Threat,
  type ThreatSeverity,
  type CookieType,
} from './schemas';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_PAGES = 5;

/** URL exclude listesi — sosyal medya/auth subdomain crawl edilmez. */
const EXCLUDED_PATH_PATTERNS = [
  /\/(login|logout|signin|signup|auth)\b/i,
  /\/(admin|panel|dashboard)\b/i,
  /\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|zip|tar|gz)(\?|$)/i,
];

// ============================================================================
// Public API
// ============================================================================

export interface ScanSiteOptions {
  /** Toplam tarama süresi (ms). Default 30s. */
  timeoutMs?: number;
  /** Kaç sayfa crawl edilecek (1-10). Default 5. */
  maxPages?: number;
  /** Özel User-Agent header. */
  userAgent?: string;
  /** Custom cookie consent banner bekleme selector (varsa). */
  cookieBannerSelector?: string;
}

export interface ScanSiteResult {
  scan: ScanResult;
  /** Scan sırasında loglanan ek bilgiler (debug için). */
  logs: string[];
}

/**
 * Verilen domain'i crawl eder, ScanResult döner.
 * Hata durumunda throw eder (queue handler retry yapar).
 */
export async function scanSite(
  domain: string,
  options: ScanSiteOptions = {}
): Promise<ScanSiteResult> {
  const startedAt = Date.now();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxPages = Math.max(1, Math.min(10, options.maxPages ?? DEFAULT_MAX_PAGES));
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const logs: string[] = [];

  // URL normalize — domain'in başında http yoksa https:// ekle
  const normalizedDomain = domain.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  const startUrl = `https://${normalizedDomain}`;

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  const cookies: CookieRecord[] = [];
  const trackingScripts: TrackingScript[] = [];
  const forms: FormRecord[] = [];
  const threats: Threat[] = [];
  const visitedUrls = new Set<string>();
  const pagesScanned = { count: 0 };

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    context = await browser.newContext({
      userAgent,
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
    });

    context.setDefaultTimeout(timeoutMs);

    // Sayfa ziyaret sırası: ana sayfa + keşfedilen linkler (BFS depth 1)
    const queue: string[] = [startUrl];

    while (queue.length > 0 && pagesScanned.count < maxPages) {
      const url = queue.shift()!;
      if (visitedUrls.has(url)) continue;
      visitedUrls.add(url);
      pagesScanned.count++;

      // Excluded path patterns
      if (EXCLUDED_PATH_PATTERNS.some((rx) => rx.test(url))) {
        logs.push(`Skip (excluded): ${url}`);
        continue;
      }

      // Same-origin guard
      try {
        const pageUrl = new URL(url);
        if (pageUrl.hostname !== normalizedDomain) {
          logs.push(`Skip (off-origin): ${url}`);
          continue;
        }
      } catch {
        logs.push(`Skip (invalid url): ${url}`);
        continue;
      }

      const page = await context.newPage();
      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: timeoutMs,
        });

        // Cookie banner bekleme (varsa)
        if (options.cookieBannerSelector) {
          try {
            await page.waitForSelector(options.cookieBannerSelector, { timeout: 2000 });
            logs.push(`Cookie banner detected: ${url}`);
          } catch {
            /* banner yoksa sessizce devam */
          }
        }

        // Cookies — Playwright context API
        const contextCookies = await context.cookies(url);
        for (const c of contextCookies) {
          cookies.push(mapPlaywrightCookie(c));
        }

        // Scripts — page.evaluate ile document.scripts src'leri
        const scriptData = await page.evaluate(() => {
          const scripts: Array<{ src: string; inline: string | null }> = [];
          for (const s of Array.from(document.scripts)) {
            scripts.push({
              src: (s as HTMLScriptElement).src || '',
              inline: s.src ? null : (s.textContent ?? '').slice(0, 500),
            });
          }
          // Forms
          const formData: Array<{
            action: string;
            method: string;
            url: string;
            fields: Array<{ name: string; type: string; required: boolean }>;
          }> = [];
          for (const f of Array.from(document.forms)) {
            const fields: Array<{ name: string; type: string; required: boolean }> = [];
            for (const el of Array.from(f.elements)) {
              const tag = (el as HTMLElement).tagName;
              if (tag === 'BUTTON' || tag === 'FIELDSET') continue;
              const input = el as HTMLInputElement;
              fields.push({
                name: input.name || (input.id ?? ''),
                type: input.type ?? tag.toLowerCase(),
                required: !!input.required,
              });
            }
            formData.push({
              action: f.action || '',
              method: (f.method || 'GET').toUpperCase(),
              url: window.location.href,
              fields,
            });
          }
          return { scripts, formData };
        });

        // Scripts → tracking detect
        for (const s of scriptData.scripts) {
          if (s.src) {
            const ts = detectTrackingScript(s.src);
            if (ts) {
              trackingScripts.push(ts);
              threats.push(...scriptThreatsFor(ts));
            }
          } else if (s.inline) {
            // Inline tracking pixel / GA / fbq call
            const inlineTs = detectInlineTracker(s.inline, url);
            if (inlineTs) {
              trackingScripts.push(inlineTs);
              threats.push(...scriptThreatsFor(inlineTs));
            }
          }
        }

        // Forms → threat detect
        for (const f of scriptData.formData) {
          const formRec = mapFormRecord(f);
          forms.push(formRec);
          threats.push(...formThreatsFor(formRec));
        }

        // Sayfa HTTPS mi?
        const isHttps = url.startsWith('https://');
        if (!isHttps) {
          threats.push({
            severity: 'HIGH',
            type: 'missing_https',
            description: `Sayfa HTTPS kullanmıyor: ${url}`,
            regulationRef: 'KVKK Madde 12 / GDPR Art. 32',
            fixSuggestion: 'Tüm trafiği HTTPS üzerinden serve edin (Let\'s Encrypt ücretsiz).',
            pageUrl: url,
          });
        }

        // Cookie banner yok → threat
        if (cookies.some((c) => c.type !== 'necessary') && contextCookies.length > 0) {
          const hasBanner = await page.evaluate(() => {
            const text = document.body.innerText.toLowerCase();
            return (
              text.includes('çerez') ||
              text.includes('cookie') ||
              text.includes('consent') ||
              text.includes('onay')
            );
          });
          if (!hasBanner) {
            threats.push({
              severity: 'HIGH',
              type: 'missing_cookie_consent',
              description: `Analytics/marketing cookie kullanılıyor ancak cookie consent banner bulunamadı: ${url}`,
              regulationRef: 'KVKK Madde 5/1 / GDPR Art. 6',
              fixSuggestion:
                'Analytics ve marketing cookie\'ler için açık rıza (opt-in) banner ekleyin.',
              pageUrl: url,
            });
          }
        }

        // Link keşfi (BFS depth 1) — sadece ana sayfadan internal linkler
        if (pagesScanned.count === 1) {
          const discovered = await page.evaluate(() => {
            const out = new Set<string>();
            for (const a of Array.from(document.querySelectorAll('a[href]'))) {
              const href = (a as HTMLAnchorElement).href;
              try {
                const u = new URL(href);
                if (u.protocol === 'http:' || u.protocol === 'https:') {
                  out.add(u.toString());
                }
              } catch {
                /* ignore invalid */
              }
            }
            return Array.from(out);
          });
          for (const link of discovered) {
            if (queue.length + pagesScanned.count >= maxPages) break;
            queue.push(link);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn('[scanner] Page crawl error', { url, error: msg });
        logs.push(`Page error ${url}: ${msg.slice(0, 200)}`);
      } finally {
        await page.close().catch(() => undefined);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[scanner] Crawl failed', { domain, error: msg });
    throw new Error(`Site crawl başarısız (${domain}): ${msg}`);
  } finally {
    await context?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
  }

  const durationMs = Date.now() - startedAt;
  const score = computeScore(threats);

  const result: ScanResult = {
    cookies: dedupeCookies(cookies),
    trackingScripts: dedupeScripts(trackingScripts),
    forms,
    threats,
    pagesScanned: pagesScanned.count,
    durationMs,
    score,
  };

  // Zod validate — runtime shape güvenliği
  const validated = ScanResultSchema.parse(result);

  logs.push(
    `Scan complete: ${validated.cookies.length} cookies, ${validated.trackingScripts.length} scripts, ${validated.forms.length} forms, ${validated.threats.length} threats, score=${validated.score}`
  );

  return { scan: validated, logs };
}

// ============================================================================
// Helpers — Playwright → Our schema mapping
// ============================================================================

interface PlaywrightCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None' | string;
}

function mapPlaywrightCookie(c: PlaywrightCookie): CookieRecord {
  return {
    name: c.name,
    provider: extractCookieProvider(c.name),
    purpose: undefined,
    duration: c.expires > 0 ? new Date(c.expires * 1000).toISOString() : 'session',
    type: classifyCookie(c.name),
    exemptFromConsent: classifyCookie(c.name) === 'necessary',
  };
}

/**
 * Cookie adından sağlayıcı çıkarır. Bilinen tracker'lar için heuristic.
 */
function extractCookieProvider(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (lower.includes('_ga') || lower.includes('google')) return 'Google Analytics';
  if (lower.includes('fb') || lower.includes('facebook')) return 'Facebook';
  if (lower.includes('ym') || lower.includes('metrika') || lower.includes('yandex')) return 'Yandex Metrika';
  if (lower.includes('hotjar')) return 'Hotjar';
  if (lower.includes('segment')) return 'Segment';
  if (lower.includes('mixpanel')) return 'Mixpanel';
  if (lower.includes('intercom')) return 'Intercom';
  return undefined;
}

/**
 * Cookie tipi tahmini — bilinen pattern'ler.
 */
function classifyCookie(name: string): CookieType {
  const lower = name.toLowerCase();
  // Necessary (session, auth, csrf)
  if (
    lower.includes('session') ||
    lower.includes('csrf') ||
    lower.includes('xsrf') ||
    lower.includes('token') ||
    lower.includes('auth') ||
    lower.startsWith('phpsessid') ||
    lower.startsWith('asp.net')
  ) {
    return 'necessary';
  }
  // Analytics
  if (
    lower.startsWith('_ga') ||
    lower.startsWith('_gid') ||
    lower.includes('analytics') ||
    lower.includes('metrika') ||
    lower.startsWith('ym_uid')
  ) {
    return 'analytics';
  }
  // Marketing
  if (
    lower.startsWith('_fbp') ||
    lower.startsWith('_fbc') ||
    lower.includes('ads') ||
    lower.includes('pixel') ||
    lower.startsWith('fr') // Facebook cookie
  ) {
    return 'marketing';
  }
  // Default: analytics (en güvenli taraf)
  return 'analytics';
}

/**
 * Script URL'den tracking provider tespiti.
 */
function detectTrackingScript(src: string): TrackingScript | null {
  const lower = src.toLowerCase();
  let provider: string | null = null;
  let knownTracker: string | undefined;
  let gdprCompliant = false;

  if (lower.includes('google-analytics.com') || lower.includes('googletagmanager.com')) {
    provider = 'Google Analytics / GTM';
    knownTracker = 'GA4';
    gdprCompliant = false; // Öncesi rıza olmadan yüklenirse non-compliant
  } else if (lower.includes('connect.facebook.net')) {
    provider = 'Facebook Pixel';
    knownTracker = 'Meta Pixel';
    gdprCompliant = false;
  } else if (lower.includes('mc.yandex.ru')) {
    provider = 'Yandex Metrika';
    knownTracker = 'Yandex Metrika';
    gdprCompliant = false;
  } else if (lower.includes('hotjar.com')) {
    provider = 'Hotjar';
    knownTracker = 'Hotjar';
    gdprCompliant = false;
  } else if (lower.includes('segment.com') || lower.includes('analytics.js')) {
    provider = 'Segment';
    knownTracker = 'Segment';
    gdprCompliant = false;
  } else if (lower.includes('mixpanel.com')) {
    provider = 'Mixpanel';
    gdprCompliant = false;
  } else if (lower.includes('intercom.io') || lower.includes('intercom.com')) {
    provider = 'Intercom';
    gdprCompliant = false;
  } else if (lower.includes('tawk.to')) {
    provider = 'Tawk.to';
    gdprCompliant = false;
  } else if (lower.includes('crisp.chat')) {
    provider = 'Crisp';
    gdprCompliant = false;
  } else if (lower.includes('cloudflareinsights.com')) {
    provider = 'Cloudflare Insights';
    gdprCompliant = true; // First-party analytics
  } else if (lower.includes('plausible.io')) {
    provider = 'Plausible';
    gdprCompliant = true; // Cookieless analytics
  }

  if (!provider) return null;

  return {
    url: src,
    provider,
    knownTracker,
    gdprCompliant,
  };
}

/**
 * Inline script içeriğinden tracker çağrısı tespiti.
 */
function detectInlineTracker(inline: string, pageUrl: string): TrackingScript | null {
  const lower = inline.toLowerCase();
  if (lower.includes('fbq(') || lower.includes('facebook.com/tr')) {
    return {
      url: `inline:${pageUrl}`,
      provider: 'Facebook Pixel',
      knownTracker: 'Meta Pixel',
      gdprCompliant: false,
    };
  }
  if (lower.includes('ym(') || lower.includes('ya.metrika') || lower.includes('mc.yandex')) {
    return {
      url: `inline:${pageUrl}`,
      provider: 'Yandex Metrika',
      knownTracker: 'Yandex Metrika',
      gdprCompliant: false,
    };
  }
  if (lower.includes('gtag(') || lower.includes('ga(') || lower.includes('google-analytics')) {
    return {
      url: `inline:${pageUrl}`,
      provider: 'Google Analytics / GTM',
      knownTracker: 'GA4',
      gdprCompliant: false,
    };
  }
  if (lower.includes('hotjar')) {
    return {
      url: `inline:${pageUrl}`,
      provider: 'Hotjar',
      gdprCompliant: false,
    };
  }
  return null;
}

interface PageFormData {
  action: string;
  method: string;
  url: string;
  fields: Array<{ name: string; type: string; required: boolean }>;
}

function mapFormRecord(f: PageFormData): FormRecord {
  return {
    url: f.url,
    action: f.action || undefined,
    method: f.method === 'POST' ? 'POST' : 'GET',
    fields: f.fields.map((field) => ({
      name: field.name,
      type: field.type,
      required: field.required,
      sensitive: isSensitiveField(field.name, field.type),
    })),
    consentRequired: false, // Default false; sayfa banner kontrolü service'te
  };
}

/**
 * Hassas kişisel veri tespiti — KVKK Madde 6.
 */
function isSensitiveField(name: string, type: string): boolean {
  const lower = (name + ' ' + type).toLowerCase();
  if (lower.includes('tc') || lower.includes('kimlik')) return true;
  if (lower.includes('sağlık') || lower.includes('health')) return true;
  if (lower.includes('din') || lower.includes('ırk')) return true;
  if (lower.includes('cinsel')) return true;
  if (lower.includes('biyometri')) return true;
  if (lower.includes('sendika')) return true;
  if (lower.includes('siyasi')) return true;
  return false;
}

// ============================================================================
// Threat derivation
// ============================================================================

function scriptThreatsFor(ts: TrackingScript): Threat[] {
  if (ts.gdprCompliant) return [];
  return [
    {
      severity: ts.provider.toLowerCase().includes('facebook') ? 'HIGH' : 'MEDIUM',
      type: 'tracking_without_consent',
      description: `GDPR uyumsuz tracking script tespit edildi: ${ts.provider} (${ts.url})`,
      regulationRef: 'KVKK Madde 5/1 / GDPR Art. 6',
      fixSuggestion:
        'Bu tracking script\'i cookie consent alındıktan sonra yükleyin (consent management platform kullanın).',
      pageUrl: ts.url.startsWith('http') ? undefined : ts.url,
    },
  ];
}

function formThreatsFor(f: FormRecord): Threat[] {
  const out: Threat[] = [];
  const hasConsentField = f.fields.some(
    (x) => x.type === 'checkbox' && (x.name.toLowerCase().includes('consent') || x.name.toLowerCase().includes('onay') || x.name.toLowerCase().includes('kvkk') || x.name.toLowerCase().includes('gdpr'))
  );
  if (!hasConsentField && f.fields.length > 0) {
    out.push({
      severity: 'MEDIUM',
      type: 'missing_form_consent',
      description: `Form'da KVKK/GDPR onay checkbox'ı bulunamadı (${f.url})`,
      regulationRef: 'KVKK Madde 5/1 / GDPR Art. 6/7',
      fixSuggestion: 'Form\'a "KVKK kapsamında kişisel verilerimin işlenmesini kabul ediyorum" tipinde zorunlu onay checkbox\'ı ekleyin.',
      pageUrl: f.url,
    });
  }
  // Hassas alan uyarısı
  const sensitiveFields = f.fields.filter((x) => x.sensitive);
  if (sensitiveFields.length > 0) {
    out.push({
      severity: 'HIGH',
      type: 'sensitive_field_no_explicit_consent',
      description: `Form hassas kişisel veri topluyor: ${sensitiveFields.map((x) => x.name).join(', ')}`,
      regulationRef: 'KVKK Madde 6 / GDPR Art. 9',
      fixSuggestion:
        'Hassas veri kategorileri için açık rıza (ayrı bir checkbox) ve veri minimizasyonu uygulayın.',
      pageUrl: f.url,
    });
  }
  return out;
}

/**
 * Compliance skoru — 100'den başla, threat ağırlıkları kadar düş.
 */
function computeScore(threats: Threat[]): number {
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
// Dedupe helpers
// ============================================================================

function dedupeCookies(list: CookieRecord[]): CookieRecord[] {
  const map = new Map<string, CookieRecord>();
  for (const c of list) {
    const key = `${c.name}|${c.provider ?? ''}|${c.type}`;
    if (!map.has(key)) map.set(key, c);
  }
  return Array.from(map.values());
}

function dedupeScripts(list: TrackingScript[]): TrackingScript[] {
  const map = new Map<string, TrackingScript>();
  for (const s of list) {
    const key = `${s.provider}|${s.url}`;
    if (!map.has(key)) map.set(key, s);
  }
  return Array.from(map.values());
}
