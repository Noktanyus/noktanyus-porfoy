import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Kapsamlı CSP ayarları - tüm gerekli kaynaklar için optimize edildi
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.cloudflare.com https://mc.yandex.ru https://*.yandex.ru https://mc.yandex.com https://*.yandex.com",
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
  
  // Diğer güvenlik başlıkları
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};