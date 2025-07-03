/**
 * @file Blog gönderilerinin listelendiği ana blog sayfası.
 * @description Bu sayfa, tüm blog gönderilerini `content/blog` dizininden
 *              alır, tarihe göre sıralar ve `BlogCard` bileşenini kullanarak
 *              bir grid yapısı içinde listeler.
 */

import { getSortedContentData } from '@/lib/content-parser';
import { Blog } from '@/types/content';
import dynamic from 'next/dynamic';

const BlogCard = dynamic(() => import('@/components/BlogCard'), {
  loading: () => (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden animate-pulse">
      <div className="h-52 bg-gray-200 dark:bg-gray-700"></div>
      <div className="p-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  ),
});

export default function BlogPage() {
  // Tüm blog gönderilerini tarihe göre sıralanmış olarak al
  const posts = getSortedContentData<Blog>('blog');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-light-text dark:text-dark-text">Blog</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Teknoloji, yazılım ve diğer konulardaki yazılarım.</p>
      </div>
      
      {posts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Her bir gönderi için bir kart oluştur */}
          {posts.map(post => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-16">
          Henüz yayınlanmış bir blog yazısı bulunmuyor.
        </p>
      )}
    </div>
  );
}
