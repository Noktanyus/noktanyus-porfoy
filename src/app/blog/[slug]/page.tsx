import { Suspense } from 'react';
import { getBlog, listBlogs } from '@/services/contentService';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'isomorphic-dompurify';
import { FaArrowLeft, FaClock, FaUser, FaTag } from 'react-icons/fa';

const md = new MarkdownIt({ html: true });

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
    };
  }

  return {
    title: `${post.title} | Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: post.thumbnail ? [{ url: post.thumbnail }] : [],
      type: 'article',
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
      tags: typeof post.tags === 'string' ? post.tags.split(',').map(tag => tag.trim()) : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.thumbnail ? [post.thumbnail] : [],
    },
  };
}

function BlogPostPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-6">
      <div className="glass-card-premium p-8 space-y-4">
        <div className="h-10 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg w-3/4" />
        <div className="flex gap-4">
          <div className="h-5 w-32 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
          <div className="h-5 w-24 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
        </div>
      </div>
      <div className="h-96 glass-card-premium rounded-2xl" />
      <div className="glass-card-premium p-8 space-y-4">
        <div className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded w-full" />
        <div className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded w-full" />
        <div className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded w-5/6" />
      </div>
    </div>
  );
}

async function BlogPostPageContent({ slug }: { slug: string }) {
  const post = await getBlog(slug);

  if (!post) {
    notFound();
  }

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

  return (
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
      </div>
    </article>
  );
}

export default function BlogPostPage({ params }: PageProps) {
  return (
    <Suspense fallback={<BlogPostPageSkeleton />}>
      <BlogPostPageContent slug={params.slug} />
    </Suspense>
  );
}

export async function generateStaticParams() {
  try {
    const posts = await listBlogs();
    return posts.map(post => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.warn('generateStaticParams: Could not fetch blogs, returning empty array. Build will use dynamic rendering.');
    return [];
  }
}
