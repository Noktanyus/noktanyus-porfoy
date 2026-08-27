// Force dynamic rendering to prevent build-time database errors
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { listBlogs } from '@/services/contentService';
import { prisma } from '@/lib/prisma';
import nextDynamic from 'next/dynamic';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { locales, defaultLocale } from '@/i18n/config';

/**
 * Blog liste sayfası için hreflang alternate URL'leri.
 * default locale prefix'siz, diğer locale'ler /<locale>/blog ile başlar.
 */
function buildBlogListAlternates() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000';
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    const path = loc === defaultLocale ? '/blog' : `/${loc}/blog`;
    languages[loc] = `${normalizedBase}${path}`;
  }
  return {
    canonical: `${normalizedBase}/blog`,
    languages,
  };
}

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Teknoloji, yazılım ve diğer konulardaki yazılarım.',
  alternates: buildBlogListAlternates(),
};

// Lazy-load the heavy client list component (search/filter logic) to reduce
// initial JS bundle size. SSR is kept on so SEO and first paint are preserved.
const BlogList = nextDynamic(() => import('@/components/BlogList'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100/40 dark:bg-gray-800/40 rounded-2xl" />,
});

type BlogSort = 'newest' | 'oldest' | 'popular';

function resolveSort(sort: string | undefined): BlogSort {
  if (sort === 'oldest' || sort === 'popular') return sort;
  return 'newest';
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { sort?: string };
}) {
  const sort: BlogSort = resolveSort(searchParams?.sort);

  let allPosts;
  try {
    // "popular" secildiyse viewCount'a gore, degilse standart tarihe gore sirala.
    allPosts = sort === 'popular'
      ? await prisma.blog.findMany({
          orderBy: [{ viewCount: 'desc' }, { date: 'desc' }],
        })
      : await listBlogs();
  } catch (error) {
    return (
      <div className="section-glass-hero bg-blob-decoration">
        <div className="relative z-10 space-y-8">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gradient-animated">
              Blog
            </h1>
          </div>
          <ErrorDisplay
            title="Blog Yazıları Yüklenemedi"
            message="Veritabanına bağlanılamıyor veya içerik bulunamadı. Lütfen daha sonra tekrar deneyin."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="section-glass-hero bg-blob-decoration">
      <div className="relative z-10 space-y-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gradient-animated">
            Blog
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Teknoloji, yazılım ve diğer konulardaki yazılarım.
          </p>
        </div>

        <BlogList allPosts={allPosts} sort={sort} />
      </div>
    </div>
  );
}
