'use client';

import Link from 'next/link';
import BlogCard from '@/components/BlogCard';
import { Blog } from '@/types/content';
import { EmptyState } from '@/components/ui/EmptyState';

interface LatestBlogsProps {
  blogs: Blog[];
}

export default function LatestBlogs({ blogs }: LatestBlogsProps) {
  return (
    <section className="py-6 sm:py-8 md:py-10">
      <div className="container-responsive">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4 text-gray-900 dark:text-white">
            Son Blog Yazıları
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Teknoloji, geliştirme süreçleri ve deneyimlerim hakkında yazdığım son yazılar.
          </p>
        </div>

        {blogs.length === 0 ? (
          <EmptyState
            title="Henüz blog yazısı yok"
            description="Yakında yeni yazılarla buradayız."
            icon="file"
            action={{ label: 'Blog Anasayfa', href: '/blog' }}
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {blogs.map((blog, index) => (
                <BlogCard key={blog.id} blog={blog} index={index} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center group gap-2 px-8 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-primary to-blue-600 hover:from-blue-600 hover:to-brand-primary shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30 transition-all duration-500 hover:-translate-y-1"
              >
                Tüm Blog Yazılarını Oku
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
