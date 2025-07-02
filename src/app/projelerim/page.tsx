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
  // Yüklenirken gösterilecek fallback bileşeni
  loading: () => <div className="text-center py-16">Projeler yükleniyor...</div>,
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
