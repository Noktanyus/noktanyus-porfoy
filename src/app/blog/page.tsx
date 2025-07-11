/**
 * @file Blog gönderilerinin listelendiği ana blog sayfası.
 * @description Bu sayfa, tüm blog gönderilerini sunucu tarafında
 *              alır ve arama gibi interaktif özellikler için `BlogList`
 *              istemci bileşenine aktarır.
 */
import { listBlogs } from '@/services/contentService';
import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';

// BlogList bileşenini sadece istemci tarafında ve ihtiyaç anında yükle.
const BlogList = dynamicImport(() => import('@/components/BlogList'), {
  ssr: false,
  loading: () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
          <div className="h-52 bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
});

export default async function BlogPage() {
  // Sunucu tarafında tüm blog gönderilerini tarihe göre sıralanmış olarak al
  const allPosts = await listBlogs();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-light-text dark:text-dark-text">Blog</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Teknoloji, yazılım ve diğer konulardaki yazılarım.</p>
      </div>
      
      <Suspense fallback={<div className="text-center py-16">Yazılar yükleniyor...</div>}>
        <BlogList allPosts={allPosts} />
      </Suspense>
    </div>
  );
}
