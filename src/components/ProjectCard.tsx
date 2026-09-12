'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Project } from '@/types/content';
import { FaGithub, FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { DS } from '@/lib/design-system';

interface ProjectCardProps {
  project: Project;
  index?: number;
}

const ProjectCard = memo(function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const imageUrl = project.mainImage?.startsWith('/images/')
    ? `/api/static${project.mainImage}`
    : project.mainImage || "/images/placeholder.webp";

  const technologies = Array.isArray(project.technologies)
    ? (project.technologies as string[])
    : [];

  return (
    <article
      className="group glass-card-premium overflow-hidden flex flex-col lg:flex-row animate-fade-in focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900 rounded-2xl"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image Section */}
      <div className="lg:w-2/5 xl:w-1/3 relative h-56 lg:h-auto min-h-[220px] overflow-hidden">
        <Link
          href={`/projelerim/${project.slug}`}
          className="block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          aria-label={`${project.title} proje detayını görüntüle`}
        >
          <OptimizedImage
            src={imageUrl}
            alt={`${project.title} projesinin görseli`}
            fill
            sizes="(max-width: 1023px) 100vw, (max-width: 1279px) 40vw, 33vw"
            style={{ objectFit: 'cover' }}
            quality={80}
            className="transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-black/10 transition-all duration-500" />

          {/* Live indicator */}
          {project.isLive && (
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide bg-emerald-950/75 dark:bg-emerald-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-300 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" aria-hidden="true" />
                Canlı
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Content Section */}
      <div className="lg:w-3/5 xl:w-2/3 p-5 sm:p-6 lg:p-7 flex flex-col">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
          <Link
            href={`/projelerim/${project.slug}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded"
          >
            {project.title}
          </Link>
        </h3>

        {/* Technology Tags */}
        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4" aria-label="Kullanılan teknolojiler">
            {technologies.slice(0, 5).map((tech) => (
              <span key={tech} className="glass-tag">
                {tech}
              </span>
            ))}
            {technologies.length > 5 && (
              <span className="glass-tag opacity-60" aria-hidden="true">
                +{technologies.length - 5}
              </span>
            )}
          </div>
        )}

        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed flex-grow line-clamp-3 mb-4">
          {project.description}
        </p>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
          <Link
            href={`/projelerim/${project.slug}`}
            className="inline-flex items-center gap-2 font-semibold text-indigo-600 dark:text-indigo-400 text-sm sm:text-base group-hover:gap-3 transition-all duration-300 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded"
            aria-label={`${project.title} detaylarını görüntüle`}
          >
            Detayları Gör
            <FaArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>

          <div className="flex items-center gap-2 sm:ml-auto relative z-10">
            {project.liveDemo && (
              <a
                href={project.liveDemo}
                target="_blank"
                rel="noopener noreferrer"
                className={`${DS.button.secondary} text-sm font-semibold`}
                aria-label={`${project.title} canlı demosunu yeni sekmede aç`}
              >
                <FaExternalLinkAlt size={12} aria-hidden="true" />
                <span>Demo</span>
              </a>
            )}
            {project.githubRepo && (
              <a
                href={project.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className={`${DS.button.secondary} text-sm font-semibold`}
                aria-label={`${project.title} GitHub kaynağını yeni sekmede aç`}
              >
                <FaGithub size={14} aria-hidden="true" />
                <span>Kaynak</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

export default ProjectCard;
