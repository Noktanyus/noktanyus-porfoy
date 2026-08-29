/**
 * @file Safe Metadata Wrapper
 * @description Next.js `generateMetadata` async fonksiyonlarını DB erişimi için
 *              güvenli hale getirir. Build sırasında DB yoksa veya Prisma hatası
 *              fırlatırsa, fallback metadata döndürür — SEO bozulmaz.
 *
 *              Kullanım:
 *              ```typescript
 *              export async function generateMetadata({ params }) {
 *                return safeMetadata(
 *                  async () => {
 *                    const post = await getBlog(params.slug);
 *                    if (!post) return null;
 *                    return { title: post.title, ... };
 *                  },
 *                  { title: 'Blog | Noktanyus', description: '...', path: `/blog/${params.slug}` }
 *                );
 *              }
 *              ```
 *
 *              - try/catch ile Prisma/DB hatalarını yakalar
 *              - null/undefined dönüşlerinde fallback'e düşer
 *              - Production'da hata sessizce yutulur (sadece debug log)
 *              - Her zaman Next.js Metadata tipinde geçerli obje döndürür
 */

import type { Metadata } from 'next';
import { logger } from './logger';

/**
 * Base URL — env değişkenlerinden güvenli çözümleme.
 * Trailing slash normalize edilir.
 */
function resolveBaseUrl(): string {
  const raw =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://noktanyus.com';
  return raw.replace(/\/+$/, '');
}

export interface FallbackMetadata {
  title: string;
  description?: string;
  path?: string;
  image?: string;
}

/**
 * DB fetch'li generateMetadata fonksiyonlarını güvenli wrapper ile sarar.
 * Hata durumunda veya null dönüşte fallback metadata üretir.
 *
 * @param fn - Asıl metadata üreten async fonksiyon (DB çağrıları içerebilir)
 * @param fallback - Hata/null durumunda döndürülecek varsayılan metadata
 * @returns Next.js Metadata objesi (her zaman geçerli)
 */
export async function safeMetadata(
  fn: () => Promise<Metadata | null | undefined>,
  fallback: FallbackMetadata
): Promise<Metadata> {
  try {
    const result = await fn();
    if (result) return result;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn(
        '[safeMetadata] build-time fetch failed, falling back:',
        { message: (error as Error)?.message, fallback: fallback.path ?? fallback.title }
      );
    }
    // Fallthrough — fallback kullanılacak
  }

  return buildFallbackMetadata(fallback);
}

/**
 * Statik (async olmayan) metadata üretir.
 * Layout'larda, sabit metadata gereken yerlerde kullanılır.
 *
 * @param opts - Title, description, canonical path, OG image, type
 * @returns Next.js Metadata objesi
 */
export function staticMetadata(opts: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
}): Metadata {
  const baseUrl = resolveBaseUrl();
  const url = opts.path ? `${baseUrl}${opts.path}` : baseUrl;
  const description = opts.description || opts.title;

  return {
    title: opts.title,
    description,
    alternates: opts.path ? { canonical: url } : undefined,
    openGraph: {
      title: opts.title,
      description,
      url,
      siteName: 'Noktanyus',
      images: opts.image ? [{ url: opts.image }] : undefined,
      locale: 'tr_TR',
      type: opts.type ?? 'website',
    } as any,
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description,
      images: opts.image ? [opts.image] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Fallback metadata — DB erişilemediğinde döndürülen OG + Twitter + canonical
 * zenginleştirilmiş minimal metadata.
 *
 * @internal — safeMetadata tarafından kullanılır
 */
function buildFallbackMetadata(opts: FallbackMetadata): Metadata {
  const baseUrl = resolveBaseUrl();
  const url = opts.path ? `${baseUrl}${opts.path}` : baseUrl;
  const description = opts.description || opts.title;

  return {
    title: opts.title,
    description,
    alternates: opts.path ? { canonical: url } : undefined,
    openGraph: {
      title: opts.title,
      description,
      url,
      siteName: 'Noktanyus',
      images: opts.image ? [{ url: opts.image }] : undefined,
      locale: 'tr_TR',
      type: 'website',
    } as any,
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description,
      images: opts.image ? [opts.image] : undefined,
    },
    robots: { index: true, follow: true },
  };
}
