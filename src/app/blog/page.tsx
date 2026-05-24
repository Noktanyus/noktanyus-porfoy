// Force dynamic rendering to prevent build-time database errors
export const dynamic = 'force-dynamic';

import { listBlogs } from '@/services/contentService';
import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';

const BlogList = dynamicImport(() => import('@/components/BlogList'), {
  ssr: false,
  loading: () => (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-5">
        <div className="w-full max-w-2xl h-14 glass-card-premium rounded-full animate-pulse" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 w-20 glass-card-premium rounded-full animate-pulse" />
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card-premium overflow-hidden">
            <div className="h-52 bg-gray-200/50 dark:bg-gray-700/30 animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg w-full animate-pulse" />
              <div className="h-3 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg w-3/4 animate-pulse" />
              <div className="flex gap-2 pt-2">
                <div className="h-5 w-14 bg-gray-200/50 dark:bg-gray-700/30 rounded-full animate-pulse" />
                <div className="h-5 w-14 bg-gray-200/50 dark:bg-gray-700/30 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
});

export default async function BlogPage() {
  const allPosts = await listBlogs();

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

        <Suspense fallback={<div className="text-center py-16 text-gray-500">Yazılar yükleniyor...</div>}>
          <BlogList allPosts={allPosts} />
        </Suspense>
      </div>
    </div>
  );
}
