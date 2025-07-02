/**
 * @file Blog gönderilerini listeleyen sayfalarda her bir gönderi için bir kart gösteren bileşen.
 * @description Bu bileşen, bir blog gönderisinin başlığını, özetini, küçük resmini ve tarihini
 *              gösterir ve tıklandığında ilgili gönderinin detay sayfasına yönlendirir.
 */

import Link from 'next/link';
import Image from 'next/image';
import { Blog } from '@/types/content';

interface BlogCardProps {
  /** Gösterilecek blog gönderisi verileri. */
  post: Blog;
}

const BlogCard = ({ post }: BlogCardProps) => {
  // Küçük resim URL'si mutlak bir URL değilse, base URL'i önüne ekle.
  const imageUrl = post.thumbnail && !post.thumbnail.startsWith('http')
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${post.thumbnail}`
    : post.thumbnail;

  return (
    <Link href={`/blog/${post.id}`} key={post.id}>
      <div className="bg-light-bg dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 shadow-card-light dark:shadow-card-dark hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
        <div className="relative h-40 mb-4">
          <Image
            src={imageUrl || "/images/placeholder.webp"}
            alt={`${post.title} için küçük resim`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            className="rounded-md"
          />
        </div>
        <div className="flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-light-text dark:text-white">{post.title}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {new Date(post.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-gray-600 dark:text-gray-300 mt-2 flex-grow">{post.description}</p>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;