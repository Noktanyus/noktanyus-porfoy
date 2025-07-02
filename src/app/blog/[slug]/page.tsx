import { getContentData, getSortedContentData } from '@/lib/content-parser';
import { Blog } from '@/types/content';
import Image from 'next/image';

type Params = {
  params: {
    slug: string;
  };
};

export default async function BlogPostPage({ params }: Params) {
  const post = await getContentData<Blog>('blog', params.slug);

  return (
    <div className="bg-light-bg dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-8">
      <h1 className="text-4xl font-bold text-light-text dark:text-dark-text mb-4">{post.title}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        {new Date(post.date).toLocaleDateString()} by {post.author}
      </p>
      {post.thumbnail && (
        <div className="relative h-96 mb-8">
          <Image
            src={post.thumbnail || "/images/placeholder.webp"}
            alt={post.title}
            fill
            style={{objectFit: 'cover'}}
            className="rounded-md"
          />
        </div>
      )}
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </div>
  );
}

export async function generateStaticParams() {
  const posts = getSortedContentData<Blog>('blog');
  return posts.map(post => ({
    slug: post.id,
  }));
}