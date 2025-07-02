import { getSortedContentData } from '@/lib/content-parser';
import { Project } from '@/types/content';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ProjectList = dynamic(() => import('@/components/ProjectList'), { ssr: false });

export default function ProjelerimPage() {
  const allProjects = getSortedContentData<Project>('projects');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-light-text dark:text-dark-text">Projelerim</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Yaptığım çalışmaları keşfedin.</p>
      </div>
      <Suspense fallback={<div>Yükleniyor...</div>}>
        <ProjectList allProjects={allProjects} />
      </Suspense>
    </div>
  );
}
