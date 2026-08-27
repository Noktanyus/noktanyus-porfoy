// Force dynamic rendering to prevent build-time database errors
export const dynamic = 'force-dynamic';

import { listProjects } from '@/services/contentService';
import nextDynamic from 'next/dynamic';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

// Lazy-load the heavy client list component (search/filter logic) to reduce
// initial JS bundle size. SSR is kept on so SEO and first paint are preserved.
const ProjectList = nextDynamic(() => import('@/components/ProjectList'), {
  loading: () => <PageSkeleton />,
});

export default async function ProjelerimPage() {
  let allProjects;
  try {
    allProjects = await listProjects();
  } catch (error) {
    return (
      <div className="section-glass-hero bg-blob-decoration">
        <div className="relative z-10 space-y-8">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gradient-animated">
              Projelerim
            </h1>
          </div>
          <ErrorDisplay
            title="Projeler Yüklenemedi"
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
            Projelerim
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Yaptığım çalışmaları ve kullandığım teknolojileri keşfedin.
          </p>
        </div>

        <ProjectList allProjects={allProjects} />
      </div>
    </div>
  );
}
