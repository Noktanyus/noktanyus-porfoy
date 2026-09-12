/**
 * Marketplace Gallery — Public template vitrini (Phase 3 B.2).
 *
 * - getServerSession sadece "user info" badge için; içerik tamamen public
 * - prisma.templateListing.findMany({ where: { active: true } })
 * - URL search params ile filtre/sort/pagination (server-side resolve)
 * - Hero section + featured templates carousel
 * - 3 cols desktop / 2 tablet / 1 mobile grid
 *
 * Middleware: PROTECTED_PREFIXES'te /marketplace/dashboard var; burası
 * /marketplace ile başlayıp dashboard'a eşit olmadığı için public.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { safeMetadata } from '@/lib/pageMetadata';
import { ListTemplatesQuerySchema, TEMPLATE_CATEGORIES } from '@/modules/marketplace/templateSchemas';
import { TemplateGallery } from '@/components/marketplace/TemplateGallery';
import { TemplateFilters } from '@/components/marketplace/TemplateFilters';
import type { TemplateCardData } from '@/components/marketplace/TemplateCard';
import { FaArrowRight, FaStar } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

// =================== METADATA ===================

export async function generateMetadata(): Promise<Metadata> {
  return safeMetadata(
    async () => ({
      title: 'Template Marketplace | Noktanyus',
      description:
        'White-label SaaS şablonları, e-ticaret, portfolyo ve blog template\'leri. Hemen satın al, dakikalar içinde kur.',
      alternates: { canonical: '/marketplace' },
    }),
    {
      title: 'Template Marketplace | Noktanyus',
      description:
        'White-label SaaS şablonları — e-ticaret, portfolyo, blog ve SaaS template\'leri.',
      path: '/marketplace',
    }
  );
}

// =================== HELPERS ===================

function parseSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const get = (key: string): string | undefined => {
    const value = searchParams[key];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const parseResult = ListTemplatesQuerySchema.safeParse({
    category: get('category'),
    search: get('search'),
    sort: get('sort') ?? 'newest',
    page: get('page') ? Number(get('page')) : 1,
    pageSize: get('pageSize') ? Number(get('pageSize')) : 12,
  });

  if (!parseResult.success) {
    return { category: undefined, search: undefined, sort: 'newest' as const, page: 1, pageSize: 12 };
  }
  return parseResult.data;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function toCardData(
  t: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    category: string;
    previewImages: unknown;
    priceCents: number;
    currency: string;
    licenseType: string;
    techStack: unknown;
    rating: number | null;
    reviewCount: number;
    featured: boolean;
    version: string;
  }
): TemplateCardData {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    tagline: t.tagline,
    category: t.category,
    previewImages: t.previewImages,
    priceCents: t.priceCents,
    currency: t.currency,
    licenseType: t.licenseType,
    techStack: t.techStack,
    rating: t.rating,
    reviewCount: t.reviewCount,
    featured: t.featured,
    version: t.version,
  };
}

// =================== FEATURED CAROUSEL ===================

async function getFeaturedTemplates() {
  try {
    const items = await prisma.templateListing.findMany({
      where: { active: true, featured: true },
      orderBy: [{ downloads: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    });
    return items;
  } catch (err) {
    console.error('[marketplace] featured fetch failed:', err);
    return [];
  }
}

// =================== PAGE ===================

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const userBadge = session?.user
    ? { email: session.user.email, name: session.user.name }
    : null;

  const query = parseSearchParams(searchParams);

  // Featured (always loaded for hero carousel, ignore filters)
  const featuredRaw = await getFeaturedTemplates();
  const featured = featuredRaw.map(toCardData);

  // Filtered list
  let templates: TemplateCardData[] = [];
  let total = 0;
  let pageCount = 1;

  try {
    const where: import('@prisma/client').Prisma.TemplateListingWhereInput = { active: true };
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { tagline: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderByMap: Record<string, import('@prisma/client').Prisma.TemplateListingOrderByWithRelationInput> = {
      newest: { createdAt: 'desc' },
      popular: { downloads: 'desc' },
      'price-asc': { priceCents: 'asc' },
      'price-desc': { priceCents: 'desc' },
    };

    const orderBy = orderByMap[query.sort] ?? orderByMap.newest;

    const [items, totalCount] = await Promise.all([
      prisma.templateListing.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.templateListing.count({ where }),
    ]);

    templates = items.map(toCardData);
    total = totalCount;
    pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  } catch (err) {
    console.error('[marketplace] list fetch failed:', err);
  }

  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        {/* Hero */}
        <header className="mb-10 text-center max-w-4xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-medium mb-4">
            <FaStar className="w-3 h-3" aria-hidden="true" />
            White-Label Template Marketplace
          </div>
          <h1 className="text-responsive-display font-bold mb-4 text-gray-900 dark:text-white">
            Hazır Şablonlar, Dakikalar İçinde Yayında
          </h1>
          <p className="text-body-responsive-md text-gray-600 dark:text-gray-400">
            E-ticaret, SaaS, portfolyo ve blog kategorilerinde profesyonel template\'ler.
            White-label lisanslarla markanızı koruyun, kod tabanı sizin olsun.
          </p>
          {userBadge && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Hoş geldin,{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {userBadge.name ?? userBadge.email}
              </span>
              .{' '}
              <Link
                href="/marketplace/dashboard"
                className="text-brand-primary hover:underline font-medium"
              >
                Lisanslarıma git →
              </Link>
            </p>
          )}
        </header>

        {/* Featured carousel (sadece featured varsa göster, sadece ilk sayfa) */}
        {featured.length > 0 && query.page === 1 && !query.search && !query.category && (
          <section className="mb-12" aria-labelledby="featured-heading">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="featured-heading"
                className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
              >
                <FaStar className="w-5 h-5 text-amber-500" aria-hidden="true" />
                Öne Çıkan Template'ler
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
              {featured.map((tpl, idx) => {
                const thumb = asStringArray(tpl.previewImages)[0];
                return (
                  <Link
                    key={tpl.id}
                    href={`/marketplace/${tpl.slug}`}
                    className="group shrink-0 w-72 sm:w-80 snap-start glass-card-premium overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="relative aspect-video bg-muted">
                      {thumb && (
                        <Image
                          src={thumb}
                          alt={tpl.name}
                          fill
                          sizes="(max-width: 640px) 288px, 320px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          quality={80}
                          priority={idx === 0}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white mb-2">
                          ⭐ Öne Çıkan
                        </span>
                        <h3 className="text-lg font-bold text-white line-clamp-1 drop-shadow">
                          {tpl.name}
                        </h3>
                        <p className="text-sm text-white/90 line-clamp-1">{tpl.tagline}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Filters */}
        <TemplateFilters initialSearch={query.search ?? ''} />

        {/* Results count */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="tabular-nums text-gray-900 dark:text-white">{total}</strong>{' '}
            template bulundu
            {query.search && (
              <>
                {' '}
                — "<span className="font-medium">{query.search}</span>" için
              </>
            )}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
            Sayfa {query.page} / {pageCount}
          </p>
        </div>

        {/* Gallery */}
        <TemplateGallery templates={templates} />

        {/* Pagination */}
        {pageCount > 1 && (
          <nav
            className="mt-8 flex items-center justify-center gap-2"
            aria-label="Sayfalama"
          >
            <PageLink
              page={Math.max(1, query.page - 1)}
              disabled={query.page <= 1}
              searchParams={searchParams}
              label="Önceki"
            />
            <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
              {query.page} / {pageCount}
            </span>
            <PageLink
              page={Math.min(pageCount, query.page + 1)}
              disabled={query.page >= pageCount}
              searchParams={searchParams}
              label="Sonraki"
            />
          </nav>
        )}

        {/* Category browse (empty-state altında da görünür) */}
        {templates.length === 0 && !query.search && !query.category && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 text-center">
              Veya kategoriye göre keşfet
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/marketplace?category=${cat}`}
                  className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  {cat === 'ecommerce'
                    ? 'E-Ticaret'
                    : cat === 'saas'
                      ? 'SaaS'
                      : cat === 'portfolio'
                        ? 'Portfolyo'
                        : 'Blog'}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Call to action */}
        <section className="mt-12 text-center glass-card-premium p-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Kendi Template'ini Mi Satmak İstersin?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl mx-auto">
            Vendor programımıza katıl, hazırladığın template'leri dünya çapında sat.
            Komisyon oranı sadece %15.
          </p>
          <Link
            href="/marketplace/dashboard"
            className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 font-bold shadow-lg transition-colors"
          >
            Vendor Programı
            <FaArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}

// =================== PAGE LINK (server component) ===================

function PageLink({
  page,
  disabled,
  searchParams,
  label,
}: {
  page: number;
  disabled: boolean;
  searchParams: Record<string, string | string[] | undefined>;
  label: string;
}) {
  if (disabled) {
    return (
      <span
        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed text-sm font-medium"
        aria-disabled="true"
      >
        {label}
      </span>
    );
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page') continue;
    if (Array.isArray(value)) params.set(key, value[0] ?? '');
    else if (value) params.set(key, value);
  }
  if (page > 1) params.set('page', String(page));

  const qs = params.toString();
  return (
    <Link
      href={`/marketplace${qs ? `?${qs}` : ''}`}
      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
    >
      {label}
    </Link>
  );
}