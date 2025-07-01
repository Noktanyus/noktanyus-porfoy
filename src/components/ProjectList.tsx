"use client";

import { useState, useMemo } from 'react';
import ProjectCard from '@/components/ProjectCard';
import { Project } from '@/types/content';

export default function ProjectList({ allProjects }: { allProjects: Project[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'live'>('all');

  const filteredProjects = useMemo(() => {
    return allProjects
      .filter(project => {
        if (filter === 'live') {
          return project.isLive;
        }
        return true;
      })
      .filter(project => {
        if (searchTerm.trim() === '') return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          project.title.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower) ||
          project.technologies?.some(tech => tech.toLowerCase().includes(searchLower))
        );
      });
  }, [allProjects, searchTerm, filter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
        <input
          type="text"
          placeholder="Proje ara (başlık, açıklama, teknoloji)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary text-light-text dark:text-dark-text"
        />
        <div className="flex items-center justify-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-brand-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === 'live' ? 'bg-brand-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Canlıya Alınanlar
          </button>
        </div>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="grid md:grid-cols-1 gap-8">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-16">Aramanızla eşleşen proje bulunamadı.</p>
      )}
    </div>
  );
}
