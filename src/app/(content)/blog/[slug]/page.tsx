import { Suspense } from 'react';
import { getBlog, listBlogs } from '@/services/contentService';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'isomorphic-dompurify';
import { FaArrowLeft, FaClock, FaUser, FaTag, FaEye } from 'react-icons/fa';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { CommentsSection } from '@/components/blog/CommentsSection';
import { locales, defaultLocale } from '@/i18n/config';
import { JsonLd, articleJsonLd, breadcrumbJsonLd, generateOpenGraph, generateTwitterCard, getBaseUrl } from '@/components/seo/JsonLd';
import {
  calculateReadingTime,
  trackBlogView,
  getRelatedBlogs,
} from '@/lib/blogAnalytics';

const md = new MarkdownIt({ html: true });

// Her istekte fresh data + view tracking (server component).
// generateStaticParams ile birlikte calismaz; analytics guncel kalsin.
export const dynamic = 'force-dynamic';

/**
 * Her dil için canonical + hreflang alternate URL'leri üretir.
 * - default locale (tr): prefix yok (/blog/<slug>)
 * - diğer locale'ler:    /<locale>/blog/<slug>
 */
function buildAlternates(slug: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000';
  const normalizedBase = baseUrl.replace(/\/$/, '');

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    const path = loc === defaultLocale
      ? `/blog/${slug}`
      : `/${loc}/blog/${slug}`;
    languages[loc] = `${normalizedBase}${path}`;
  }

  return {
    canonical: `${normalizedBase}/blog/${slug}`,
    languages,
  };
}

type PageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getBlog(params.slug);

  if (!post) {
    return {
      title: "Yazı Bulunamadı",
      description: "Aradığınız blog yazısı mevcut değil.",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;

  return {
    title: `${post.title} | Blog`,
    description: post.description,
    authors: [{ name: post.author }],
    keywords:
      typeof post.tags === 'string'
        ? post.tags.split(',').map((t) => t.trim())
        : Array.isArray(post.tags)
          ? (post.tags.filter((t) => typeof t === 'string') as string[])
          : undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: buildAlternates(post.slug).languages,
    },
    openGraph: generateOpenGraph({
      title: post.title,
      description: post.description,
      url: canonicalUrl,
      image: post.thumbnail ?? undefined,
      type: 'article',
    }) as any,
    twitter: generateTwitterCard({
      title: post.title,
      description: post.description,
      image: post.thumbnail ?? undefined,
    }) as any,
    robots: { index: true, follow: true },
  };
}

function BlogPostPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-6">
      <LoadingSkeleton variant="detail" />
    </div>
  );
}

async function BlogPostPageContent({ slug }: { slug: string }) {
  const post = await getBlog(slug);

  if (!post) {
    notFound();
  }

  // Okuma suresi (icerikten hesaplanir) + view tracking (sunucu tarafli).
  const readTime = calculateReadingTime(post.content);
  await trackBlogView(post.id);

  // Ayni kategorideki ilgili yazilar (varsa gosterilecek).
  const related = await getRelatedBlogs(post.id, post.category, 3);

  const dirtyHtml = md.render(post.content);
  const cleanHtml = DOMPurify.sanitize(dirtyHtml);

  const imageUrl = post.thumbnail?.startsWith('/images/')
    ? `/api/static${post.thumbnail}`
    : post.thumbnail;

  const tags = Array.isArray(post.tags)
    ? post.tags.filter((t): t is string => typeof t === 'string')
    : typeof post.tags === 'string'
      ? post.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;
  const publishedISO = new Date(post.date).toISOString();

  // Article / BlogPosting JSON-LD (zengin sonuclar + Knowledge Graph icin)
  const articleLd = articleJsonLd({
    type: 'BlogPosting',
    title: post.title,
    description: post.description,
    image: post.thumbnail ?? undefined,
    author: { name: post.author },
    datePublished: publishedISO,
    url: canonicalUrl,
    keywords: tags,
    inLanguage: 'tr-TR',
    articleBody: post.content?.slice(0, 1500),
  });

  // Breadcrumb (sayfa yolu) JSON-LD
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Anasayfa', url: `${baseUrl}` },
    { name: 'Blog', url: `${baseUrl}/blog` },
    { name: post.title, url: canonicalUrl },
  ]);

  return (
    <>
      <JsonLd data={[articleLd, breadcrumbLd]} />
      <article className="max-w-4xl mx-auto section-glass-hero bg-blob-decoration">
      <div className="relative z-10 space-y-6">
        {/* Back button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-brand-primary transition-colors duration-300"
        >
          <FaArrowLeft className="w-3 h-3" />
          Blog&apos;a Dön
        </Link>

        {/* Header Card */}
        <div className="glass-card-premium p-6 sm:p-8">
          {/* Category */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-brand-primary/10 text-brand-primary border border-brand-primary/20 mb-4">
            {post.category}
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-5 leading-tight">
            {post.title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <FaClock className="w-3.5 h-3.5" />
              {new Date(post.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FaUser className="w-3.5 h-3.5" />
              {post.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FaClock className="w-3.5 h-3.5" />
              {readTime} dakika okuma
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FaEye className="w-3.5 h-3.5" />
              {post.viewCount.toLocaleString('tr-TR')} okunma
            </span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag) => (
                <span key={tag} className="glass-tag inline-flex items-center gap-1">
                  <FaTag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Cover Image */}
        {imageUrl && (
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30">
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="glass-card-premium p-6 sm:p-8 md:p-10">
          <div
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-brand-primary prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="mt-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              İlgili Yazılar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  className="glass-card-premium p-4 hover:shadow-lg transition-shadow block"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                    {r.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {r.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Comments Section */}
      <CommentsSection blogSlug={slug} />
    </article>
    </>
  );
}

export default function BlogPostPage({ params }: PageProps) {
  return (
    <Suspense fallback={<BlogPostPageSkeleton />}>
      <BlogPostPageContent slug={params.slug} />
    </Suspense>
  );
}

// generateStaticParams kaldırıldı - dynamic = 'force-dynamic' ile birlikte çakışıyordu.
// Sadece runtime render kullanılır. Build sırasında DB'ye erişim gerekmez.
