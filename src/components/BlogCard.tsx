import Link from 'next/link';
import Image from 'next/image';
import { Blog } from '@/types/content';

const BlogCard = ({ post }: { post: Blog }) => {
  const imageUrl = post.thumbnail?.startsWith('http') ? post.thumbnail : `${process.env.NEXT_PUBLIC_BASE_URL}${post.thumbnail}`;
  return (
    <Link href={`/blog/${post.id}`} key={post.id}>
      <div className="bg-light-bg dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 shadow-card-light dark:shadow-card-dark hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
        <div className="relative h-40 mb-4">
          <Image
            src={post.thumbnail ? imageUrl : "/images/placeholder.webp"}
            alt={post.title}
            fill
            style={{objectFit: 'cover'}}
            className="rounded-md"
          />
        </div>
        <h3 className="text-lg font-bold text-light-text dark:text-white">{post.title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{new Date(post.date).toLocaleDateString()}</p>
        <p className="text-gray-600 dark:text-gray-300 mt-2">{post.description}</p>
      </div>
    </Link>
  );
};

export default BlogCard;
