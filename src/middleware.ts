import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware - Legacy redirects + audit logging
 * (next-intl devre dışı - prod build'de parse hatası)
 */

const LEGACY_REDIRECTS: Record<string, string> = {
  '/admin/blog/yeni': '/admin/blog/new',
  '/admin/projects/yeni': '/admin/projects/new',
  '/admin/popups/yeni': '/admin/popups/new',
};

function isAdminWriteRequest(pathname: string, method: string): boolean {
  if (!pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/admin/login')) return false;
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

function attachSecurityHeaders(response: NextResponse): void {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://*.cloudflare.com https://mc.yandex.ru https://*.yandex.ru https://mc.yandex.com https://*.yandex.com",
    "style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://fonts.googleapis.com",
    "img-src 'self' data: https: https://challenges.cloudflare.com https://*.ytimg.com https://*.youtube.com",
    "font-src 'self' data: https://challenges.cloudflare.com https://fonts.gstatic.com",
    "connect-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com https://mc.yandex.ru https://*.yandex.ru https://mc.yandex.com https://*.yandex.com https://*.youtube.com https://*.ytimg.com https://*.doubleclick.net https://*.googleads.com",
    "frame-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com https://www.youtube.com https://youtube.com https://*.youtube.com https://www.youtube-nocookie.com",
    "worker-src 'self' blob: https://challenges.cloudflare.com",
    "child-src 'self' blob: https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://challenges.cloudflare.com",
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

export function middleware(request: NextRequest) {
  // Legacy path yönlendirmesi (kalıcı 301)
  const legacyTarget = LEGACY_REDIRECTS[request.nextUrl.pathname];
  if (legacyTarget) {
    const url = request.nextUrl.clone();
    url.pathname = legacyTarget;
    return NextResponse.redirect(url, 301);
  }

  // Admin write işlemlerini logla
  if (isAdminWriteRequest(request.nextUrl.pathname, request.method)) {
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
        path: request.nextUrl.pathname,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
      })
    );

    const response = NextResponse.next();
    response.headers.set('x-audit-ip', ipAddress);
    response.headers.set('x-audit-ua', userAgent.slice(0, 200));
    attachSecurityHeaders(response);
    return response;
  }

  const response = NextResponse.next();
  attachSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
