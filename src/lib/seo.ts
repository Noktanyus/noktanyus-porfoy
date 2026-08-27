/**
 * @file Schema.org Structured Data (JSON-LD) generators.
 * @description Bu dosya, Next.js uygulamasında Schema.org yapısal veri üretmek
 *              için kullanılan yardımcı fonksiyonları içerir. JSON-LD formatı
 *              arama motorlarına sayfa içeriğini anlamlandırması için zengin
 *              veri sağlar (Article, Product, Person, Organization, vb.).
 *
 *              Next.js'in MetadataRoute sitemap'i ve Metadata API ile birlikte
 *              çalışır. Tüm üreticiler pure-function'dır (server-side veya
 *              build-time'da çalışır) ve DOM bağımlılığı yoktur.
 *
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */

const DEFAULT_BASE_URL = 'http://localhost:3000';

/**
 * Çevre değişkeninden site ana URL'sini güvenli biçimde çözümler.
 * NEXTAUTH_URL ve NEXT_PUBLIC_BASE_URL'yi sırasıyla dener, hiçbiri yoksa
 * geliştirme için localhost'a düşer. URL trailing-slash'sız normalize edilir.
 */
export function getBaseUrl(): string {
  const raw =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, '');
}

// =====================================================================
// Article / BlogPosting / NewsArticle
// =====================================================================

export interface ArticleSchema {
  type: 'Article' | 'BlogPosting' | 'NewsArticle';
  title: string;
  description: string;
  image?: string;
  author: { name: string; url?: string };
  datePublished: string;
  dateModified?: string;
  url: string;
  keywords?: string[];
  articleBody?: string;
  inLanguage?: string;
}

/**
 * Blog yazıları, makaleler ve haber içerikleri için Article/BlogPosting JSON-LD üretir.
 * Google arama sonuçlarında yazar, yayın tarihi ve kapak görseli gibi bilgileri zenginleştirir.
 */
export function articleJsonLd(data: ArticleSchema) {
  const baseUrl = getBaseUrl();
  const fullImage = data.image
    ? data.image.startsWith('http')
      ? data.image
      : `${baseUrl}${data.image}`
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': data.type,
    headline: data.title,
    description: data.description,
    image: fullImage ? [fullImage] : undefined,
    author: {
      '@type': 'Person',
      name: data.author.name,
      url: data.author.url,
    },
    datePublished: data.datePublished,
    dateModified: data.dateModified ?? data.datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url,
    },
    keywords: data.keywords?.join(', '),
    articleBody: data.articleBody,
    inLanguage: data.inLanguage ?? 'tr-TR',
    publisher: organizationJsonLd(),
  };
}

// =====================================================================
// Product
// =====================================================================

export interface ProductSchema {
  name: string;
  description: string;
  image: string;
  priceCents: number;
  currency: string;
  url: string;
  rating?: { value: number; count: number };
  sku?: string;
  brand?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
}

/**
 * Dijital ürünler / fiziksel ürünler için Product JSON-LD üretir.
 * Google Merchant Center ve ürün snippet'ları için kullanılır.
 */
export function productJsonLd(data: ProductSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    image: data.image.startsWith('http')
      ? data.image
      : `${getBaseUrl()}${data.image}`,
    sku: data.sku,
    brand: data.brand
      ? { '@type': 'Brand', name: data.brand }
      : undefined,
    offers: {
      '@type': 'Offer',
      price: (data.priceCents / 100).toFixed(2),
      priceCurrency: data.currency.toUpperCase(),
      url: data.url,
      availability: `https://schema.org/${data.availability ?? 'InStock'}`,
      seller: organizationJsonLd(),
    },
    aggregateRating: data.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: data.rating.value,
          reviewCount: data.rating.count,
        }
      : undefined,
  };
}

// =====================================================================
// Person
// =====================================================================

export interface PersonSchema {
  name: string;
  jobTitle: string;
  description: string;
  image?: string;
  url: string;
  sameAs?: string[];
  email?: string;
  telephone?: string;
}

/**
 * Kişisel portfolyö sahibi için Person JSON-LD üretir.
 * Knowledge Graph'te kişinin kim olduğunu arama motorlarına bildirir.
 */
export function personJsonLd(data: PersonSchema) {
  const baseUrl = getBaseUrl();
  const fullImage = data.image
    ? data.image.startsWith('http')
      ? data.image
      : `${baseUrl}${data.image}`
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name,
    jobTitle: data.jobTitle,
    description: data.description,
    image: fullImage,
    url: data.url,
    sameAs: data.sameAs?.filter(Boolean),
    email: data.email,
    telephone: data.telephone,
    worksFor: organizationJsonLd(),
  };
}

// =====================================================================
// Organization / WebSite
// =====================================================================

export interface OrganizationSchema {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

/**
 * Sitenin yayıncısı / sahibi olarak Organization JSON-LD üretir.
 * Article yapısal verisinin publisher alanı için varsayılan sağlayıcı.
 */
export function organizationJsonLd(data: OrganizationSchema = {}) {
  const baseUrl = getBaseUrl();
  const logoUrl = data.logo
    ? data.logo.startsWith('http')
      ? data.logo
      : `${baseUrl}${data.logo}`
    : `${baseUrl}/logo.png`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name ?? 'Noktanyus',
    url: data.url ?? baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
    },
    description: data.description,
    sameAs: data.sameAs?.filter(Boolean),
  };
}

/**
 * Sitenin WebSite yapısal verisi — sitename + SearchAction (site-search).
 */
export function websiteJsonLd() {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Noktanyus',
    url: baseUrl,
    inLanguage: 'tr-TR',
    publisher: organizationJsonLd(),
  };
}

// =====================================================================
// BreadcrumbList
// =====================================================================

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Breadcrumb (sayfa yolu) için JSON-LD üretir. Google arama sonuçlarında
 * navigasyon hiyerarşisini zenginleştirir.
 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${getBaseUrl()}${item.url}`,
    })),
  };
}

// =====================================================================
// FAQPage
// =====================================================================

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Sıkça sorulan sorular (SSS) için FAQPage JSON-LD üretir.
 * Google arama sonuçlarında zengin SSS kutusu (FAQ rich result) açar.
 */
export function faqJsonLd(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// =====================================================================
// Open Graph & Twitter Helpers
// =====================================================================

export interface OpenGraphData {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  locale?: string;
}

/**
 * Next.js Metadata API ile uyumlu OpenGraph üretir.
 * Facebook, LinkedIn ve diğer OG destekli platformlarda paylaşım önizlemesi.
 */
export function generateOpenGraph(data: OpenGraphData) {
  const baseUrl = getBaseUrl();
  const imageUrl = data.image
    ? data.image.startsWith('http')
      ? data.image
      : `${baseUrl}${data.image}`
    : undefined;

  return {
    title: data.title,
    description: data.description,
    url: data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`,
    siteName: data.siteName ?? 'Noktanyus',
    locale: data.locale ?? 'tr_TR',
    images: imageUrl
      ? [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: data.title,
          },
        ]
      : undefined,
    type: data.type ?? 'website',
  };
}

export interface TwitterCardData {
  title: string;
  description: string;
  image?: string;
  creator?: string;
}

/**
 * Next.js Metadata API ile uyumlu Twitter Card meta verisi üretir.
 */
export function generateTwitterCard(data: TwitterCardData) {
  const baseUrl = getBaseUrl();
  const imageUrl = data.image
    ? data.image.startsWith('http')
      ? data.image
      : `${baseUrl}${data.image}`
    : undefined;

  return {
    card: 'summary_large_image',
    title: data.title,
    description: data.description,
    images: imageUrl ? [imageUrl] : undefined,
    creator: data.creator,
  };
}

// =====================================================================
// Top-Level Metadata Üreticisi
// =====================================================================

export interface MetadataOptions {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string[];
  publishedTime?: string;
  authors?: string[];
}

/**
 * Next.js Metadata API için OG + Twitter + canonical + robots içeren
 * tek-tip meta veri üretir. Sayfa düzeyinde generateMetadata içinde kullanılır.
 */
export function generateMetadata(opts: MetadataOptions) {
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: { canonical: opts.url },
    openGraph: generateOpenGraph({
      title: opts.title,
      description: opts.description,
      url: opts.url,
      image: opts.image,
      type: opts.type,
    }),
    twitter: generateTwitterCard({
      title: opts.title,
      description: opts.description,
      image: opts.image,
    }),
    robots: { index: true, follow: true },
  };
}
