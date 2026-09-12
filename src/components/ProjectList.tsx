"use client";

import { useState, useMemo } from 'react';
import ProjectCard from '@/components/ProjectCard';
import { Project } from '@/types/content';
import { FaSearch } from 'react-icons/fa';

interface ProjectListProps {
  allProjects: Project[];
}

export default function ProjectList({ allProjects }: ProjectListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'live'>('all');

  const filteredProjects = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase().trim();

    return allProjects
      .filter(project => {
        if (filter === 'live') return project.isLive === true;
        return true;
      })
      .filter(project => {
        if (!lowercasedSearchTerm) return true;

        const titleMatch = project.title.toLowerCase().includes(lowercasedSearchTerm);
        const descriptionMatch = project.description.toLowerCase().includes(lowercasedSearchTerm);
        const techMatch = Array.isArray(project.technologies) ? project.technologies.some(tech => typeof tech === 'string' && tech.toLowerCase().includes(lowercasedSearchTerm)) : false;

        return titleMatch || descriptionMatch || techMatch;
      });
  }, [allProjects, searchTerm, filter]);

  return (
    <div className="space-y-8">
      {/* Search & Filters */}
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        {/* Glass Search Bar */}
        <div className="w-full max-w-2xl glass-search">
          <label htmlFor="project-search" className="sr-only">
            Proje ara
          </label>
          <div className="relative flex items-center">
            <FaSearch className="absolute left-5 text-slate-400 dark:text-slate-500 w-4 h-4" aria-hidden="true" />
            <input
              id="project-search"
              type="search"
              inputMode="search"
              placeholder="Proje adı, teknoloji veya anahtar kelime ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[44px] pl-12 pr-5 py-3.5 bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg text-base"
              aria-label="Proje ara"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div role="group" aria-label="Proje filtreleri" className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={`glass-pill whitespace-nowrap min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${filter === 'all' ? 'active' : ''}`}
          >
            Tüm Projeler
          </button>
          <button
            onClick={() => setFilter('live')}
            aria-pressed={filter === 'live'}
            className={`glass-pill whitespace-nowrap min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${filter === 'live' ? 'active' : ''}`}
          >
            Canlı Projeler
          </button>
        </div>

        {/* Results count */}
        <p
          aria-live="polite"
          aria-atomic="true"
          className="text-sm text-slate-500 dark:text-slate-400"
        >
          {(searchTerm || filter !== 'all') ? (
            <>
              {filteredProjects.length} proje bulundu
              {searchTerm && (
                <span> &mdash; &ldquo;<span className="font-semibold text-indigo-600 dark:text-indigo-400">{searchTerm}</span>&rdquo;</span>
              )}
            </>
          ) : (
            <span>{filteredProjects.length} proje listeleniyor</span>
          )}
        </p>
      </div>

      {/* Project List */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          {filteredProjects.map((project, idx) => (
            <ProjectCard key={project.id} project={project} index={idx} />
          ))}
        </div>
      ) : (
        <div className="glass-card-premium text-center py-16 px-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm flex items-center justify-center">
            <FaSearch className="w-6 h-6 text-slate-400" aria-hidden="true" />
          </div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            Proje bulunamadı
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Farklı anahtar kelimeler deneyin veya filtreyi değiştirin.
          </p>
          {(searchTerm || filter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
              className="mt-2 px-6 py-2.5 min-h-[44px] glass-pill active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
}
