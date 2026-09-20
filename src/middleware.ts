import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';

/**
 * Middleware - i18n + legacy redirects + auth guard + audit logging
 *
 * Compose order (L6 — next-intl re-enabled):
 *   1. next-intl middleware (locale prefix ekle/normalize et)
 *   2. Legacy path redirects (301)
 *   3. Protected route auth check (defense-in-depth)
 *   4. Admin write audit logging
 *   5. Common security headers (CSP, HSTS, X-Frame-Options, ...)
 */

const LEGACY_REDIRECTS: Record<string, string> = {
  '/projeler': '/projelerim',
  '/fiyatlandirma': '/magaza/abonelikler',
  '/admin/blog/yeni': '/admin/blog/new',
  '/admin/projects/yeni': '/admin/projects/new',
  '/admin/popups/yeni': '/admin/popups/new',
};

function isAdminWriteRequest(pathname: string, method: string): boolean {
  if (!pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/giris')) return false;
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

function attachSecurityHeaders(response: NextResponse): void {
  // Next.js dev mode (Fast Refresh + react-refresh-utils) eval() kullanıyor.
  // Production'da 'unsafe-eval' ASLA eklenmemelidir (XSS vektörü).
  // Sadece geliştirme ortamında HMR/Hydration için gerekli.
  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrcExtra = isDev ? " 'unsafe-eval'" : '';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${scriptSrcExtra} https://challenges.cloudflare.com https://*.cloudflare.com https://mc.yandex.ru https://*.yandex.ru https://mc.yandex.com https://*.yandex.com https://cdn.redocly.com`,
    "style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://fonts.googleapis.com",
    "img-src 'self' data: https: https://challenges.cloudflare.com https://*.ytimg.com https://*.youtube.com",
    "font-src 'self' data: https://challenges.cloudflare.com https://fonts.gstatic.com",
    "connect-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com https://mc.yandex.ru https://*.yandex.ru https://mc.yandex.com https://*.yandex.com https://*.youtube.com https://*.ytimg.com https://*.doubleclick.net https://*.googleads.com https://cdn.redocly.com",
    "frame-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com https://www.youtube.com https://youtube.com https://*.youtube.com https://www.youtube-nocookie.com https://cal.com https://*.cal.com https://calendly.com https://*.calendly.com",
    "worker-src 'self' blob: https://challenges.cloudflare.com https://cdn.redocly.com",
    "child-src 'self' blob: https://challenges.cloudflare.com https://cdn.redocly.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://www.paytr.com https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
}

/**
 * Protected route prefix'leri (Phase D.6 — Middleware Route Protection).
 * Bu route'lara erişim için NextAuth session cookie zorunlu.
 * Sayfa tarafında zaten getServerSession var; middleware defense-in-depth katmanı.
 *
 * Phase D.4 — public API docs:
 *   `/docs` ve `/api/openapi` buraya DAHİL EDİLMEDİ.
 *   Public olarak erişilebilir; auth gerektirmez.
 *
 * L6 notu: i18n middleware'i /en/dashboard → /en/dashboard olarak normalize
 * eder. Auth kontrolü, locale prefix'i cikarilmis pathName uzerinden yapilir
 * (next-intl aslinda pathname'i degistirmez, sadece locale header ekler
 * + localePrefix: 'as-needed' ise default locale icin prefix eklemez).
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/api/user',
  '/api/templates',
];

/**
 * Whitelist — auth kontrolü ATLANAN public endpointler.
 */
const PUBLIC_WHITELIST: string[] = [
  '/docs',
  '/api/openapi',
  '/api/user/cookie-consent',
  '/api/v1',
];

function hasAuthSessionCookie(request: NextRequest): boolean {
  // NextAuth cookie adları: dev → next-auth.session-token, prod (HTTPS) → __Secure-next-auth.session-token
  const cookies = request.cookies;
  return Boolean(
    cookies.get('next-auth.session-token')?.value ||
      cookies.get('__Secure-next-auth.session-token')?.value
  );
}

/**
 * next-intl'in locale prefix'ini cikarip ham pathname'i doner.
 * Boylece /en/dashboard ve /dashboard ayni sekilde eslesir.
 */
function stripLocalePrefix(pathname: string): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
  }
  return pathname;
}

// next-intl middleware instance — ilk istekte olusturulur (lazy).
// 'as-needed' default locale icin URL prefix'i eklemez; /dashboard ve
// /en/dashboard ayni sayfayi gosterir.
const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  // 'never' kullanıyoruz: default locale (tr) için URL'de prefix OLMASIN
  // (/hakkimda olarak erişilir, /tr/hakkimda DEĞİL). Diğer locale'ler
  // (örn. /en/hakkimda) için prefix zorunlu. 'as-needed' ayarı yeni
  // next-intl sürümlerinde default locale için internal rewrite üretip
  // sayfa route'larını bulamamasına (404) yol açıyor; 'never' bunu önler.
  localePrefix: 'never',
  localeDetection: true,
});

export function middleware(request: NextRequest) {
  // 1) Host yönlendirmesi (www -> apex, 301 kalıcı)
  const host = request.headers.get('host') || '';
  if (host.startsWith('www.')) {
    const newHost = host.replace(/^www\./, '');
    const redirectUrl = new URL(request.url);
    if (newHost.includes(':')) {
      const [hostname, port] = newHost.split(':');
      redirectUrl.hostname = hostname;
      redirectUrl.port = port;
    } else {
      redirectUrl.hostname = newHost;
      redirectUrl.port = '';
    }
    return NextResponse.redirect(redirectUrl, 301);
  }

  const pathname = request.nextUrl.pathname;
  const strippedPath = stripLocalePrefix(pathname);

  // NOT: next-intl middleware bu projede SORUN CIKARIYOR — internal rewrite
  // header'i Next.js'i /tr gibi olmayan route'a yonlendirip 404'a sebep
  // oluyor ve response body'yi bosaltabiliyor. Locale bilgisi zaten
  // (a) NextIntlClientProvider ile server component'lerden,
  // (b) NEXT_LOCALE cookie ile
  // client'a akiyor; URL prefix'ine ihtiyacimiz yok. Bu nedenle intlMiddleware
  // burada CAGIRILMAZ — sadece auth korumasi + security headers.
  const response = NextResponse.next();

  // 2) Legacy path yönlendirmesi (kalıcı 301) — locale'siz path uzerinden.
  const legacyTarget = LEGACY_REDIRECTS[strippedPath];
  if (legacyTarget) {
    const url = request.nextUrl.clone();
    url.pathname = legacyTarget;
    return NextResponse.redirect(url, 301);
  }

  // /projeler/ subpath redirect -> /projelerim/
  if (strippedPath.startsWith('/projeler/')) {
    const url = request.nextUrl.clone();
    url.pathname = strippedPath.replace(/^\/projeler/, '/projelerim');
    return NextResponse.redirect(url, 301);
  }

  // 3) Phase D.4 — public whitelist (auth kontrolü ATLANIR).
  const isWhitelisted = PUBLIC_WHITELIST.some(
    (entry) => strippedPath === entry || strippedPath.startsWith(`${entry}/`)
  );

  // 4) Phase D.6 — protected route auth check (locale'siz path uzerinden).
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => strippedPath === prefix || strippedPath.startsWith(`${prefix}/`)
  );
  if (isProtected && !hasAuthSessionCookie(request)) {
    // API endpoint ise 401 JSON döndür, sayfa ise /giris'e yönlendir
    if (strippedPath.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/giris';
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl, 307);
  }

  // Whitelist entry'leri için de güvenlik header'larını ekle (defense-in-depth)
  if (isWhitelisted) {
    attachSecurityHeaders(response);
    return response;
  }

  // 5) Admin write işlemlerini logla
  if (isAdminWriteRequest(strippedPath, request.method)) {
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        type: 'AUDIT_PENDING',
        method: request.method,
        path: strippedPath,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
      })
    );

    response.headers.set('x-audit-ip', ipAddress);
    response.headers.set('x-audit-ua', userAgent.slice(0, 200));
    attachSecurityHeaders(response);
    return response;
  }

  attachSecurityHeaders(response);
  return response;
}

export const config = {
  /**
   * L6 — next-intl matcher:
   *   - /api, /_next/static, /_next/image, favicon, dosya uzantili
   *     istekler HARIC tutulur (next-intl default).
   *   - next-intl'in kendi matcher'i yeterli; burada manuel prefix eklemeye
   *     gerek yok, cunku createIntlMiddleware default olarak bu desenle
   *     eslesir.
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
