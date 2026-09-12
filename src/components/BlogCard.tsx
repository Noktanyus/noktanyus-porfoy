'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Blog } from '@/types/content';
import { FaArrowRight, FaClock, FaEye } from 'react-icons/fa';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface BlogCardProps {
  blog: Blog;
  index?: number;
}

const BlogCard = memo(function BlogCard({ blog, index = 0 }: BlogCardProps) {
  if (!blog) {
    return null;
  }

  const imageUrl = blog.thumbnail?.startsWith('/images/')
    ? `/api/static${blog.thumbnail}`
    : blog.thumbnail || "/images/placeholder.webp";

  const tags = Array.isArray(blog.tags)
    ? blog.tags.filter((tag): tag is string => typeof tag === 'string')
    : [];

  return (
    <article
      className="group glass-card-premium h-full flex flex-col animate-fade-in relative focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900 rounded-2xl"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image Section */}
      <div className="relative h-52 sm:h-56 overflow-hidden">
        <OptimizedImage
          src={imageUrl}
          alt={`${blog.title} için küçük resim`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
          quality={80}
          className="transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40 opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase glass-badge-overlay">
            {blog.category}
          </span>
        </div>

        {/* Title on Image */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10 transform group-hover:-translate-y-1 transition-transform duration-500">
          <h3 className="text-lg sm:text-xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
            {blog.title}
          </h3>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-grow flex flex-col">
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-4">
          {blog.description}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="glass-tag">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="glass-tag opacity-60" aria-hidden="true">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <FaClock className="w-3 h-3" aria-hidden="true" />
              <time dateTime={new Date(blog.date).toISOString()}>
                {new Date(blog.date).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </time>
            </span>
            {blog.viewCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <FaEye className="w-3 h-3" aria-hidden="true" />
                <span aria-label={`${blog.viewCount} görüntülenme`}>
                  {blog.viewCount.toLocaleString('tr-TR')}
                </span>
              </span>
            )}
            {blog.readTimeMinutes > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <FaClock className="w-3 h-3" aria-hidden="true" />
                <span>{blog.readTimeMinutes} dk okuma</span>
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all duration-300">
            Oku
            <FaArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </div>

      {/* Full card link */}
      <Link
        href={`/blog/${blog.slug}`}
        className="absolute inset-0 z-20 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        aria-label={`${blog.title} - Devamını oku`}
      >
        <span className="sr-only">Devamını oku</span>
      </Link>
    </article>
  );
});

export default BlogCard;
