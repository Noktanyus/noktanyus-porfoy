/**
 * @file robots.ts — Arama motoru bot yönergeleri.
 * @description Next.js MetadataRoute.Robots API'si ile /robots.txt endpoint'i
 *              üretir. Yönetim & kimlik doğrulama rotalarını engellerken,
 *              herkese açık içerik rotalarını indexlenebilir olarak işaretler.
 *              Ayrıca Sitemap URL'sini içerir; arama motorları haritayı
 *              daha kolay keşfeder.
 */

import { MetadataRoute } from 'next';

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000'
).replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/dashboard',
          '/dashboard/',
          '/api',
          '/api/',
          '/giris',
          '/kayit',
          '/(auth)',
        ],
      },
      {
        // Googlebot için açık kural — diğer user-agent'lardan daha liberal
        // (yine de private rotalara inmiyor)
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/api'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
