import Link from 'next/link';
import { Blog } from '@/types/content';
import { FaArrowRight } from 'react-icons/fa';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface BlogCardProps {
  blog: Blog;
}

const BlogCard = ({ blog }: BlogCardProps) => {
  if (!blog) {
    return null;
  }
  
  const imageUrl = blog.thumbnail?.startsWith('/images/')
    ? `/api/static${blog.thumbnail}`
    : blog.thumbnail || "/images/placeholder.webp";

  return (
    <article className="group">
      <Link 
        href={`/blog/${blog.slug}`} 
        className="block bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-card-light dark:shadow-card-dark hover:shadow-2xl transition-all duration-500 ease-out overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02] min-h-[44px]"
      >
        {/* Image Section */}
        <div className="relative h-44 sm:h-48 md:h-52 lg:h-56">
          <OptimizedImage
            src={imageUrl || "/images/placeholder.webp"}
            alt={`${blog.title} için küçük resim`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            className=""
            priority={false}
            quality={80}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          
          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
              {blog.title}
            </h3>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-4 sm:p-6">
          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-5 text-sm sm:text-base leading-relaxed line-clamp-3">
            {blog.description}
          </p>
          
          {/* Author and Category */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">{blog.author}</span>
            <span className="hidden sm:inline">•</span>
            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs">
              {blog.category}
            </span>
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
              {blog.tags.slice(0, 4).map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs sm:text-sm rounded-full text-gray-600 dark:text-gray-300 whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
              {blog.tags.length > 4 && (
                <span className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs sm:text-sm rounded-full text-gray-500 dark:text-gray-400">
                  +{blog.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <time className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
              {new Date(blog.date).toLocaleDateString('tr-TR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </time>
            
            <span className="inline-flex items-center font-semibold text-sm sm:text-base text-brand-primary group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300 min-h-[44px] sm:min-h-0 justify-center sm:justify-start">
              Devamını Oku 
              <FaArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-400 ease-out" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;
