import { Suspense } from 'react';
import { getContentData, getSortedContentData } from '@/lib/content-parser';
import { Blog } from '@/types/content';
import Image from 'next/image';
import { notFound } from 'next/navigation';

type Params = {
  params: {
    slug: string;
  };
};

function BlogPostPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
      <div className="relative h-96 mb-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}

async function BlogPostPageContent({ slug }: { slug: string }) {
  try {
    const post = await getContentData<Blog>('blog', slug);

    return (
      <article className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          {post.title}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
          Yayınlanma Tarihi: {new Date(post.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })} / Yazar: {post.author}
        </p>
        {post.thumbnail && (
          <div className="relative h-96 mb-8 shadow-2xl rounded-lg overflow-hidden">
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 1024px"
              style={{objectFit: 'cover'}}
              className="rounded-lg"
              priority
            />
          </div>
        )}
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
    );
  } catch (error) {
    notFound();
  }
}

export default function BlogPostPage({ params }: Params) {
  return (
    <Suspense fallback={<BlogPostPageSkeleton />}>
      <BlogPostPageContent slug={params.slug} />
    </Suspense>
  );
}

export async function generateStaticParams() {
  const posts = getSortedContentData<Blog>('blog');
  return posts.map(post => ({
    slug: post.id,
  }));
}
