/**
 * @file Projeleri listeleyen, arama ve filtreleme özellikleri sunan ana bileşen.
 * @description Bu bileşen, tüm projeleri alır ve kullanıcıya metin tabanlı arama yapma
 *              ve projenin durumuna göre (tümü, canlıda olanlar) filtreleme imkanı tanır.
 */

"use client";

import { useState, useMemo } from 'react';
import ProjectCard from '@/components/ProjectCard';
import { Project } from '@/types/content';

interface ProjectListProps {
  /** Listelenecek tüm projelerin dizisi. */
  allProjects: Project[];
}

export default function ProjectList({ allProjects }: ProjectListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'live'>('all');

  /**
   * Projeleri arama terimine ve seçilen filtreye göre hafızada (memoized) filtreler.
   * Bu, her render'da yeniden hesaplama yapılmasını önleyerek performansı artırır.
   */
  const filteredProjects = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase().trim();

    return allProjects
      .filter(project => {
        // 'Canlı Projeler' filtresi aktifse, sadece 'isLive' olanları tut
        if (filter === 'live') {
          return project.isLive === true;
        }
        return true;
      })
      .filter(project => {
        // Arama terimi boşsa, tüm projeleri göster
        if (!lowercasedSearchTerm) return true;
        
        // Proje başlığı, açıklaması veya teknolojileri arama terimini içeriyor mu?
        const titleMatch = project.title.toLowerCase().includes(lowercasedSearchTerm);
        const descriptionMatch = project.description.toLowerCase().includes(lowercasedSearchTerm);
        const techMatch = Array.isArray(project.technologies) ? project.technologies.some(tech => typeof tech === 'string' && tech.toLowerCase().includes(lowercasedSearchTerm)) : false;

        return titleMatch || descriptionMatch || techMatch;
      });
  }, [allProjects, searchTerm, filter]);

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Arama ve Filtreleme Çubuğu - Enhanced Mobile-First Responsive Design */}
      <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">
        {/* Search Input - Improved mobile usability */}
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Proje adı, teknoloji veya anahtar kelime ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 sm:py-4 lg:py-5 text-base sm:text-lg lg:text-xl rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-light-text dark:text-dark-text placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
            />
            {/* Search icon for better UX */}
            <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Filter Buttons - Enhanced mobile layout */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-5">
          {/* Mobile filter label */}
          <div className="flex items-center gap-2 sm:hidden">
            <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Filtrele
            </span>
            <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>
          
          {/* Filter button group with improved spacing */}
          <div className="flex items-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-gray-800 p-1 sm:p-1.5 lg:p-2 w-full sm:w-auto max-w-sm sm:max-w-none shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 rounded-lg sm:rounded-xl text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 min-h-[44px] sm:min-h-[48px] lg:min-h-[52px] ${
                filter === 'all' 
                  ? 'bg-brand-primary text-white shadow-md transform scale-[0.98] sm:scale-100' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 hover:shadow-sm'
              }`}
            >
              Tüm Projeler
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`flex-1 sm:flex-none px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 rounded-lg sm:rounded-xl text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 min-h-[44px] sm:min-h-[48px] lg:min-h-[52px] ${
                filter === 'live' 
                  ? 'bg-brand-primary text-white shadow-md transform scale-[0.98] sm:scale-100' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 hover:shadow-sm'
              }`}
            >
              Canlı Projeler
            </button>
          </div>
        </div>
        
        {/* Results count indicator */}
        {(searchTerm || filter !== 'all') && (
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {filteredProjects.length} proje bulundu
              {searchTerm && (
                <span className="ml-1">
                  &quot;<span className="font-semibold text-brand-primary">{searchTerm}</span>&quot; için
                </span>
              )}
              {filter === 'live' && !searchTerm && (
                <span className="ml-1">canlı projeler arasında</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Filtrelenmiş Proje Listesi - Enhanced Responsive Grid with Optimized Spacing */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-14">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 lg:py-20 xl:py-24">
          <div className="max-w-md mx-auto">
            {/* Empty state icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300 dark:text-gray-600">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
              </svg>
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400 mb-2 font-medium">
              Aradığınız kriterlere uygun proje bulunamadı
            </p>
            <p className="text-sm sm:text-base text-gray-400 dark:text-gray-500 leading-relaxed">
              Farklı anahtar kelimeler deneyin veya filtreyi değiştirin
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 bg-brand-primary text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-blue-600 transition-colors duration-200 min-h-[44px]"
              >
                Tüm Projeleri Göster
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
