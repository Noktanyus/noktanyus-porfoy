/**
 * @file SEO generator unit testleri.
 * @description Schema.org JSON-LD üreticilerinin doğru yapısal veri
 *              ürettiğini doğrular. Google Rich Results testinin reddedeceği
 *              hataları erkenden yakalamak için her schema tipi ayrı test edilir.
 */

import { describe, it, expect } from 'vitest';
import {
  articleJsonLd,
  productJsonLd,
  personJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  websiteJsonLd,
  generateOpenGraph,
  generateTwitterCard,
  generateMetadata,
  getBaseUrl,
} from '../seo';

describe('SEO generators', () => {
  // ---------------- Article ----------------
  describe('articleJsonLd', () => {
    it('generates BlogPosting JSON-LD', () => {
      const ld = articleJsonLd({
        type: 'BlogPosting',
        title: 'Test',
        description: 'Desc',
        author: { name: 'Author' },
        datePublished: '2026-01-01',
        url: 'https://test.com/blog/1',
      });
      expect(ld['@context']).toBe('https://schema.org');
      expect(ld['@type']).toBe('BlogPosting');
      expect(ld.headline).toBe('Test');
      expect(ld.author.name).toBe('Author');
      expect(ld.datePublished).toBe('2026-01-01');
      expect(ld.dateModified).toBe('2026-01-01');
    });

    it('falls back dateModified to datePublished when missing', () => {
      const ld = articleJsonLd({
        type: 'Article',
        title: 'T',
        description: 'd',
        author: { name: 'a' },
        datePublished: '2026-01-01T00:00:00.000Z',
        url: 'https://t/x',
      });
      expect(ld.dateModified).toBe('2026-01-01T00:00:00.000Z');
    });

    it('includes publisher Organization', () => {
      const ld = articleJsonLd({
        type: 'NewsArticle',
        title: 'T',
        description: 'd',
        author: { name: 'a' },
        datePublished: '2026-01-01',
        url: 'https://t/x',
      });
      expect((ld.publisher as any)['@type']).toBe('Organization');
      expect((ld.publisher as any).name).toBeTruthy();
    });
  });

  // ---------------- Product ----------------
  describe('productJsonLd', () => {
    it('generates Product JSON-LD with formatted price', () => {
      const ld = productJsonLd({
        name: 'Test',
        description: 'Desc',
        image: 'img.jpg',
        priceCents: 9900,
        currency: 'TRY',
        url: 'https://test.com/product/1',
      });
      expect(ld['@type']).toBe('Product');
      expect((ld.offers as any).price).toBe('99.00');
      expect((ld.offers as any).priceCurrency).toBe('TRY');
      expect((ld.offers as any).availability).toBe('https://schema.org/InStock');
    });

    it('includes aggregateRating only when provided', () => {
      const withRating = productJsonLd({
        name: 'T',
        description: 'd',
        image: 'i',
        priceCents: 100,
        currency: 'try',
        url: '/p',
        rating: { value: 4.8, count: 12 },
      });
      expect((withRating.aggregateRating as any).ratingValue).toBe(4.8);

      const noRating = productJsonLd({
        name: 'T',
        description: 'd',
        image: 'i',
        priceCents: 100,
        currency: 'try',
        url: '/p',
      });
      expect(noRating.aggregateRating).toBeUndefined();
    });
  });

  // ---------------- Person ----------------
  describe('personJsonLd', () => {
    it('generates Person JSON-LD', () => {
      const ld = personJsonLd({
        name: 'Yunus',
        jobTitle: 'Dev',
        description: 'd',
        url: 'https://t/',
      });
      expect(ld['@type']).toBe('Person');
      expect(ld.name).toBe('Yunus');
      expect((ld.worksFor as any)['@type']).toBe('Organization');
    });

    it('filters empty sameAs urls', () => {
      const ld = personJsonLd({
        name: 'Y',
        jobTitle: 'j',
        description: 'd',
        url: 'https://t',
        sameAs: ['https://a', '', 'https://b'],
      });
      expect(ld.sameAs).toEqual(['https://a', 'https://b']);
    });
  });

  // ---------------- Breadcrumb ----------------
  describe('breadcrumbJsonLd', () => {
    it('generates BreadcrumbList with sequential positions', () => {
      const ld = breadcrumbJsonLd([
        { name: 'Home', url: 'https://x.com/' },
        { name: 'Blog', url: 'https://x.com/blog' },
      ]);
      expect(ld['@type']).toBe('BreadcrumbList');
      expect(ld.itemListElement).toHaveLength(2);
      expect((ld.itemListElement[0] as any).position).toBe(1);
      expect((ld.itemListElement[1] as any).position).toBe(2);
      expect((ld.itemListElement[0] as any).item).toBe('https://x.com/');
    });
  });

  // ---------------- FAQ ----------------
  describe('faqJsonLd', () => {
    it('generates FAQPage JSON-LD', () => {
      const ld = faqJsonLd([
        { question: 'Q?', answer: 'A.' },
        { question: 'Q2?', answer: 'A2.' },
      ]);
      expect(ld['@type']).toBe('FAQPage');
      expect(ld.mainEntity).toHaveLength(2);
      expect((ld.mainEntity[0] as any).name).toBe('Q?');
      expect((ld.mainEntity[0] as any).acceptedAnswer.text).toBe('A.');
    });
  });

  // ---------------- Organization ----------------
  describe('organizationJsonLd', () => {
    it('returns defaults when no data provided', () => {
      const ld = organizationJsonLd();
      expect(ld['@type']).toBe('Organization');
      expect(ld.name).toBe('Noktanyus');
      expect((ld.logo as any).url).toContain('logo.png');
    });

    it('respects custom data', () => {
      const ld = organizationJsonLd({ name: 'Acme', url: 'https://acme.com' });
      expect(ld.name).toBe('Acme');
      expect(ld.url).toBe('https://acme.com');
    });
  });

  // ---------------- WebSite ----------------
  describe('websiteJsonLd', () => {
    it('returns WebSite JSON-LD with publisher', () => {
      const ld = websiteJsonLd();
      expect(ld['@type']).toBe('WebSite');
      expect((ld.publisher as any)['@type']).toBe('Organization');
    });
  });

  // ---------------- OG / Twitter ----------------
  describe('open graph & twitter', () => {
    it('generates OG with absolute image URL', () => {
      const og = generateOpenGraph({
        title: 'T',
        description: 'd',
        url: '/blog/x',
        image: '/img.png',
      });
      expect(og.title).toBe('T');
      expect(og.type).toBe('website');
      expect(og.siteName).toBe('Noktanyus');
      expect(og.locale).toBe('tr_TR');
      expect((og.images as any[])?.[0].url).toContain('/img.png');
    });

    it('generates Twitter Card with creator support', () => {
      const tw = generateTwitterCard({
        title: 'T',
        description: 'd',
        image: '/x.webp',
        creator: '@yunus',
      });
      expect(tw.card).toBe('summary_large_image');
      expect(tw.creator).toBe('@yunus');
    });
  });

  // ---------------- Combined metadata ----------------
  describe('generateMetadata', () => {
    it('returns combined Next.js metadata shape', () => {
      const m = generateMetadata({
        title: 'T',
        description: 'd',
        url: '/x',
        image: '/y.png',
        type: 'article',
      });
      expect(m.alternates?.canonical).toBe('/x');
      expect(m.robots?.index).toBe(true);
      expect(m.twitter).toBeTruthy();
      expect(m.openGraph).toBeTruthy();
    });
  });

  // ---------------- Base URL ----------------
  describe('getBaseUrl', () => {
    it('returns localhost default when envs are missing', () => {
      const prevNx = process.env.NEXTAUTH_URL;
      const prevPb = process.env.NEXT_PUBLIC_BASE_URL;
      delete process.env.NEXTAUTH_URL;
      delete process.env.NEXT_PUBLIC_BASE_URL;
      try {
        const url = getBaseUrl();
        expect(url).toBe('http://localhost:3000');
      } finally {
        if (prevNx) process.env.NEXTAUTH_URL = prevNx;
        if (prevPb) process.env.NEXT_PUBLIC_BASE_URL = prevPb;
      }
    });

    it('strips trailing slashes', () => {
      const prev = process.env.NEXTAUTH_URL;
      process.env.NEXTAUTH_URL = 'https://example.com///';
      try {
        expect(getBaseUrl()).toBe('https://example.com');
      } finally {
        if (prev) process.env.NEXTAUTH_URL = prev;
        else delete process.env.NEXTAUTH_URL;
      }
    });
  });
});
