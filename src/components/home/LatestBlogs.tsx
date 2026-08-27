'use client';

import BlogCard from "@/components/BlogCard";
import { Blog } from "@/types/content";

interface LatestBlogsProps {
  blogs: Blog[];
}

export default function LatestBlogs({ blogs }: LatestBlogsProps) {
  if (blogs.length === 0) {
    return (
      <section className="py-12">
        <div className="container-responsive text-center">
          <h2 className="text-3xl font-bold mb-4 text-muted-foreground">Son Blog Yazıları</h2>
          <p className="text-muted-foreground">Henüz blog yazısı yok.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-8 md:py-10">
      <div className="container-responsive">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4 text-gradient-animated">
            Son Blog Yazıları
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Teknoloji, geliştirme süreçleri ve deneyimlerim hakkında yazdığım son yazılar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {blogs.map((blog, index) => (
            <BlogCard key={blog.id} blog={blog} index={index} />
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-10">
          <a
            href="/blog"
            className="inline-flex items-center group gap-2 px-8 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-primary to-blue-600 hover:from-blue-600 hover:to-brand-primary shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30 transition-all duration-500 hover:-translate-y-1"
          >
            Tüm Blog Yazılarını Oku
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
