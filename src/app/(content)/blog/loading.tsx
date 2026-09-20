import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function BlogLoading() {
  return (
    <div className="section-glass-hero bg-blob-decoration">
      <div className="relative z-10 space-y-8">
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gradient-animated">
            Blog
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Teknoloji, yazılım mimarisi ve geliştirici deneyimleri üzerine yazılarım.
          </p>
        </header>

        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton variant="blog" count={6} />
        </div>
      </div>
    </div>
  );
}
