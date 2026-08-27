// Force dynamic rendering to prevent build-time database errors
export const dynamic = 'force-dynamic';

import { listBlogs } from '@/services/contentService';
import BlogList from '@/components/BlogList';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

export default async function BlogPage() {
  let allPosts;
  try {
    allPosts = await listBlogs();
  } catch (error) {
    return (
      <div className="section-glass-hero bg-blob-decoration">
        <div className="relative z-10 space-y-8">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gradient-animated">
              Blog
            </h1>
          </div>
          <ErrorDisplay
            title="Blog Yazıları Yüklenemedi"
            message="Veritabanına bağlanılamıyor veya içerik bulunamadı. Lütfen daha sonra tekrar deneyin."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="section-glass-hero bg-blob-decoration">
      <div className="relative z-10 space-y-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gradient-animated">
            Blog
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Teknoloji, yazılım ve diğer konulardaki yazılarım.
          </p>
        </div>

        <BlogList allPosts={allPosts} />
      </div>
    </div>
  );
}
