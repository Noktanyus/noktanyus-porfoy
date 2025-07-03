/**
 * @file Projelerin listelendiği ana proje sayfası.
 * @description Bu sayfa, `content/projects` dizinindeki tüm projeleri
 *              alır ve `ProjectList` bileşenine prop olarak geçirerek
 *              kullanıcıya sunar. `ProjectList` bileşeni, arama ve filtreleme
 *              gibi interaktif özellikleri barındırır.
 */

import { getSortedContentData } from '@/lib/content-parser';
import { Project } from '@/types/content';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// ProjectList bileşenini sadece istemci tarafında ve ihtiyaç anında yükle.
// Bu, arama/filtreleme gibi interaktif özelliklerin çalışmasını sağlar.
const ProjectList = dynamic(() => import('@/components/ProjectList'), {
  ssr: false,
  loading: () => (
    <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-12 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/3 h-56 md:h-auto bg-gray-200 dark:bg-gray-700"></div>
          <div className="md:w-2/3 p-6 flex flex-col">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="space-y-3 flex-grow">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
            <div className="flex items-center gap-4 mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
});

export default function ProjelerimPage() {
  // Sunucu tarafında tüm projeleri sıralanmış olarak al
  const allProjects = getSortedContentData<Project>('projects');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-light-text dark:text-dark-text">Projelerim</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Yaptığım çalışmaları ve kullandığım teknolojileri keşfedin.</p>
      </div>
      
      {/* Suspense, istemci bileşeni yüklenirken bir fallback göstermeyi sağlar */}
      <Suspense fallback={<div className="text-center py-16">Projeler yükleniyor...</div>}>
        <ProjectList allProjects={allProjects} />
      </Suspense>
    </div>
  );
}
