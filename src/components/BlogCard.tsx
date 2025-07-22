import Link from 'next/link';
import Image from 'next/image';
import { Blog } from '@prisma/client';
import { FaArrowRight } from 'react-icons/fa';

interface BlogCardProps {
  blog: Blog;
}

const BlogCard = ({ blog }: BlogCardProps) => {
  const imageUrl = blog.thumbnail?.startsWith('/images/')
    ? `/api/static${blog.thumbnail}`
    : blog.thumbnail || "/images/placeholder.webp";

  return (
    <Link href={`/blog/${blog.slug}`} className="group block bg-white dark:bg-dark-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
      <div className="relative h-52">
        <Image
          src={imageUrl || "/images/placeholder.webp"}
          alt={`${blog.title} için küçük resim`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6">
          <h3 className="text-xl font-bold text-white leading-tight">{blog.title}</h3>
        </div>
      </div>
      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{blog.description}</p>
        
        {/* Author and Category */}
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{blog.author}</span>
          <span>•</span>
          <span>{blog.category}</span>
        </div>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(blog.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <span className="inline-flex items-center font-semibold text-sm text-brand-primary group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
            Devamını Oku <FaArrowRight className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
