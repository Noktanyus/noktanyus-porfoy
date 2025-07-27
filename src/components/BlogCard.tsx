import { Blog } from '@/types/content';
import { FaArrowRight } from 'react-icons/fa';
import GenericCard from './ui/GenericCard';
import CardImage from './ui/CardImage';
import CardBody from './ui/CardBody';
import CardFooter from './ui/CardFooter';
import TagList from './ui/TagList';

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
    <GenericCard href={`/blog/${blog.slug}`}>
      <CardImage src={imageUrl} alt={`${blog.title} için küçük resim`}>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
          {blog.title}
        </h3>
      </CardImage>
      
      <CardBody>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base leading-relaxed line-clamp-3">
          {blog.description}
        </p>
        
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">{blog.author}</span>
          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            {blog.category}
          </span>
        </div>

        <TagList tags={blog.tags} />
      </CardBody>

      <CardFooter>
        <div className="flex justify-between items-center">
          <time className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
            {new Date(blog.date).toLocaleDateString('tr-TR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </time>
          
          <span className="inline-flex items-center font-semibold text-sm text-brand-primary">
            Devamını Oku 
            <FaArrowRight className="ml-2 w-3 h-3" />
          </span>
        </div>
      </CardFooter>
    </GenericCard>
  );
};

export default BlogCard;
