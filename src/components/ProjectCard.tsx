'use client';

import Link from 'next/link';
import { Project } from '@/types/content';
import { FaGithub, FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface ProjectCardProps {
  project: Project;
  index?: number;
}

const ProjectCard = ({ project, index = 0 }: ProjectCardProps) => {
  const imageUrl = project.mainImage?.startsWith('/images/')
    ? `/api/static${project.mainImage}`
    : project.mainImage || "/images/placeholder.webp";

  const technologies = Array.isArray(project.technologies)
    ? (project.technologies as string[])
    : [];

  return (
    <article
      className="group glass-card-premium overflow-hidden flex flex-col lg:flex-row animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image Section */}
      <div className="lg:w-2/5 xl:w-1/3 relative h-56 lg:h-auto min-h-[220px] overflow-hidden">
        <Link href={`/projelerim/${project.slug}`} className="block w-full h-full">
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-100 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
                Canlı
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Content Section */}
      <div className="lg:w-3/5 xl:w-2/3 p-5 sm:p-6 lg:p-7 flex flex-col">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-3 line-clamp-2 group-hover:text-brand-primary transition-colors duration-300">
          <Link href={`/projelerim/${project.slug}`}>
            {project.title}
          </Link>
        </h3>

        {/* Technology Tags */}
        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {technologies.slice(0, 5).map((tech) => (
              <span key={tech} className="glass-tag">
                {tech}
              </span>
            ))}
            {technologies.length > 5 && (
              <span className="glass-tag opacity-60">+{technologies.length - 5}</span>
            )}
          </div>
        )}

        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed flex-grow line-clamp-3 mb-4">
          {project.description}
        </p>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-auto pt-4 border-t border-white/10 dark:border-white/5">
          <Link
            href={`/projelerim/${project.slug}`}
            className="inline-flex items-center gap-2 font-semibold text-brand-primary text-sm sm:text-base group-hover:gap-3 transition-all duration-300"
          >
            Detayları Gör
            <FaArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <div className="flex items-center gap-2 sm:ml-auto relative z-10">
            {project.liveDemo && (
              <a
                href={project.liveDemo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary hover:text-white backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-brand-primary/20"
                aria-label="Canlı Demo"
              >
                <FaExternalLinkAlt size={12} />
                <span>Demo</span>
              </a>
            )}
            {project.githubRepo && (
              <a
                href={project.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-800/10 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-300/30 dark:border-white/10 hover:bg-gray-800 hover:text-white dark:hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                aria-label="GitHub"
              >
                <FaGithub size={14} />
                <span>Kaynak</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
