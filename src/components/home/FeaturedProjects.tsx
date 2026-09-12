'use client';

import Link from 'next/link';
import ProjectCard from '@/components/ProjectCard';
import { Project } from '@/types/content';
import { EmptyState } from '@/components/ui/EmptyState';

interface FeaturedProjectsProps {
  projects: Project[];
}

export default function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  return (
    <section className="py-6 sm:py-8 md:py-10">
      <div className="container-responsive">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4 text-gray-900 dark:text-white">
            Öne Çıkan Projeler
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Geliştirdiğim en önemli projeler ve kullandığım teknolojiler.
          </p>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="Henüz öne çıkan proje yok"
            description="Yakında eklenecek. Şimdilik tüm projelerimi inceleyebilirsin."
            icon="box"
            action={{ label: 'Tüm Projeleri Gör', href: '/projelerim' }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:gap-8">
              {projects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/projelerim"
                className="inline-flex items-center group gap-2 px-8 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-primary to-blue-600 hover:from-blue-600 hover:to-brand-primary shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30 transition-all duration-500 hover:-translate-y-1"
              >
                Tüm Projeleri Görüntüle
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
