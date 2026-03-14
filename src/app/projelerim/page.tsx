import { listProjects } from '@/services/contentService';
import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';

const ProjectList = dynamicImport(() => import('@/components/ProjectList'), {
  ssr: false,
  loading: () => (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-5">
        <div className="w-full max-w-2xl h-14 glass-card-premium rounded-full animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-28 glass-card-premium rounded-full animate-pulse" />
          <div className="h-9 w-28 glass-card-premium rounded-full animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:gap-8 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card-premium overflow-hidden flex flex-col lg:flex-row">
            <div className="lg:w-2/5 xl:w-1/3 h-56 lg:h-auto lg:min-h-[220px] bg-gray-200/50 dark:bg-gray-700/30" />
            <div className="lg:w-3/5 xl:w-2/3 p-6 flex flex-col gap-3">
              <div className="h-7 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg w-3/4" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
                <div className="h-5 w-16 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
                <div className="h-5 w-16 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
              </div>
              <div className="space-y-2 flex-grow">
                <div className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
                <div className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded w-5/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
});

export default async function ProjelerimPage() {
  const allProjects = await listProjects();

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

        <Suspense fallback={<div className="text-center py-16 text-gray-500">Projeler yükleniyor...</div>}>
          <ProjectList allProjects={allProjects} />
        </Suspense>
      </div>
    </div>
  );
}
