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
        const techMatch = project.technologies?.some(tech => tech.toLowerCase().includes(lowercasedSearchTerm));

        return titleMatch || descriptionMatch || techMatch;
      });
  }, [allProjects, searchTerm, filter]);

  return (
    <div className="space-y-8">
      {/* Arama ve Filtreleme Çubuğu */}
      <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
        <input
          type="text"
          placeholder="Proje adı, teknoloji veya anahtar kelime ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary text-light-text dark:text-dark-text"
        />
        <div className="flex items-center justify-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-brand-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Tüm Projeler
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === 'live' ? 'bg-brand-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Canlı Projeler
          </button>
        </div>
      </div>

      {/* Filtrelenmiş Proje Listesi */}
      {filteredProjects.length > 0 ? (
        <div className="grid md:grid-cols-1 gap-8">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-16">
          Aradığınız kriterlere uygun bir proje bulunamadı.
        </p>
      )}
    </div>
  );
}
