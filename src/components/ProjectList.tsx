"use client";

import { useState, useMemo } from 'react';
import ProjectCard from '@/components/ProjectCard';
import { Project } from '@/types/content';
import { FaSearch } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-5"
      >
        {/* Glass Search Bar */}
        <div className="w-full max-w-2xl glass-search">
          <div className="relative flex items-center">
            <FaSearch className="absolute left-5 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Proje adı, teknoloji veya anahtar kelime ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 bg-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none text-base"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`glass-pill ${filter === 'all' ? 'active' : ''}`}
          >
            Tüm Projeler
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`glass-pill ${filter === 'live' ? 'active' : ''}`}
          >
            Canlı Projeler
          </button>
        </div>

        {/* Results count */}
        {(searchTerm || filter !== 'all') && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {filteredProjects.length} proje bulundu
            {searchTerm && (
              <span> &mdash; &ldquo;<span className="font-semibold text-brand-primary">{searchTerm}</span>&rdquo;</span>
            )}
          </motion.p>
        )}
      </motion.div>

      {/* Project List */}
      <AnimatePresence mode="wait">
        {filteredProjects.length > 0 ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 sm:gap-8"
          >
            {filteredProjects.map((project, idx) => (
              <ProjectCard key={project.id} project={project} index={idx} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card-premium text-center py-16 px-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm flex items-center justify-center">
              <FaSearch className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              Proje bulunamadı
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Farklı anahtar kelimeler deneyin veya filtreyi değiştirin.
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="mt-6 px-6 py-2.5 glass-pill active"
              >
                Filtreleri Temizle
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
