import { getSortedPostsData } from '@/lib/content-parser';
import BlogCard from '@/components/BlogCard';
import { Blog } from '@/types/content';

export default function BlogPage() {
  const posts = getSortedPostsData<Blog>('blog');

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center text-white">Blog</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map(post => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}