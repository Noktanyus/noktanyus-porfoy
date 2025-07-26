/**
 * @file Projelerin listelendiği ana proje sayfası.
 * @description Bu sayfa, veritabanından tüm projeleri
 *              alır ve `ProjectList` bileşenine prop olarak geçirerek
 *              kullanıcıya sunar. `ProjectList` bileşeni, arama ve filtreleme
 *              gibi interaktif özellikleri barındırır.
 */



import { listProjects } from '@/services/contentService';
import { Project } from '@prisma/client';
import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';

// ProjectList bileşenini sadece istemci tarafında ve ihtiyaç anında yükle.
// Bu, arama/filtreleme gibi interaktif özelliklerin çalışmasını sağlar.
const ProjectList = dynamicImport(() => import('@/components/ProjectList'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Enhanced Search and Filter Loading Skeleton */}
      <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">
        {/* Search Input Skeleton */}
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative">
            <div className="w-full h-12 sm:h-16 lg:h-20 bg-gray-200 dark:bg-gray-700 rounded-xl sm:rounded-2xl animate-pulse"></div>
            <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Filter Buttons Skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-5">
          <div className="flex items-center gap-2 sm:hidden">
            <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div className="w-12 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl bg-gray-200 dark:bg-gray-700 p-1 sm:p-1.5 lg:p-2 w-full sm:w-auto max-w-sm sm:max-w-none animate-pulse">
            <div className="flex-1 sm:flex-none h-11 sm:h-12 lg:h-14 w-32 sm:w-36 lg:w-40 bg-gray-300 dark:bg-gray-600 rounded-lg sm:rounded-xl"></div>
            <div className="flex-1 sm:flex-none h-11 sm:h-12 lg:h-14 w-32 sm:w-36 lg:w-40 bg-gray-300 dark:bg-gray-600 rounded-lg sm:rounded-xl"></div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Project Cards Loading Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-14 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden flex flex-col lg:flex-row">
            <div className="lg:w-2/5 xl:w-1/3 h-48 sm:h-56 md:h-64 lg:h-auto lg:min-h-[280px] bg-gray-200 dark:bg-gray-700"></div>
            <div className="lg:w-3/5 xl:w-2/3 p-4 sm:p-6 lg:p-8 flex flex-col">
              <div className="h-6 sm:h-8 lg:h-9 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3 sm:mb-4"></div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                <div className="h-6 sm:h-7 w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-6 sm:h-7 w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-6 sm:h-7 w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              <div className="space-y-2 sm:space-y-3 flex-grow mb-6 sm:mb-8">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-auto pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 sm:ml-auto">
                  <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
});

export default async function ProjelerimPage() {
  // Sunucu tarafında tüm projeleri sıralanmış olarak al
  const allProjects = await listProjects();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-light-text dark:text-dark-text">Projelerim</h1>
        <p className="mt-2 text-base sm:text-lg text-gray-600 dark:text-gray-400">Yaptığım çalışmaları ve kullandığım teknolojileri keşfedin.</p>
      </div>
      
      {/* Suspense, istemci bileşeni yüklenirken bir fallback göstermeyi sağlar */}
      <Suspense fallback={<div className="text-center py-16">Projeler yükleniyor...</div>}>
        <ProjectList allProjects={allProjects} />
      </Suspense>
    </div>
  );
}
