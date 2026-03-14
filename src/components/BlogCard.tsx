'use client';

import Link from 'next/link';
import { Blog } from '@/types/content';
import { FaArrowRight, FaClock } from 'react-icons/fa';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { motion } from 'framer-motion';

interface BlogCardProps {
  blog: Blog;
  index?: number;
}

const BlogCard = ({ blog, index = 0 }: BlogCardProps) => {
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
    <motion.article
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="group glass-card-premium h-full flex flex-col"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-lg">
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
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4">
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
              <span className="glass-tag opacity-60">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-white/10 dark:border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FaClock className="w-3 h-3" />
            <time>
              {new Date(blog.date).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </time>
          </div>

          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary group-hover:gap-2.5 transition-all duration-300">
            Oku
            <FaArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>

      {/* Full card link */}
      <Link href={`/blog/${blog.slug}`} className="absolute inset-0 z-20" aria-label={blog.title}>
        <span className="sr-only">Devamını oku</span>
      </Link>
    </motion.article>
  );
};

export default BlogCard;
