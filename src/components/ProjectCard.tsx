import Link from 'next/link';
import { Project } from '@/types/content';
import { FaGithub, FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const imageUrl = project.mainImage?.startsWith('/images/')
    ? `/api/static${project.mainImage}`
    : project.mainImage || "/images/placeholder.webp";

  return (
    <article className="group bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-card-light dark:shadow-card-dark hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col lg:flex-row transform hover:-translate-y-1">
      {/* Image Section */}
      <div className="lg:w-2/5 xl:w-1/3 relative h-48 sm:h-56 md:h-64 lg:h-auto min-h-[200px] lg:min-h-[280px]">
        <OptimizedImage
          src={imageUrl}
          alt={`${project.title} projesinin görseli`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 40vw"
          style={{ objectFit: 'cover' }}
          className="transition-transform duration-300 group-hover:scale-105"
          priority={false}
          quality={80}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/20 group-hover:from-black/40 group-hover:to-black/30 transition-all duration-200"></div>
      </div>
      
      {/* Content Section */}
      <div className="lg:w-3/5 xl:w-2/3 p-4 sm:p-6 lg:p-8 flex flex-col">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4 line-clamp-2">
          {project.title}
        </h3>
        
        {/* Technology Tags */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
          {project.technologies?.split(',').filter((tech: string) => tech.trim()).slice(0, 5).map((tech: string) => (
            <span 
              key={tech} 
              className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              {tech.trim()}
            </span>
          ))}
          {project.technologies && project.technologies.split(',').filter(tech => tech.trim()).length > 5 && (
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold">
              +{project.technologies.split(',').filter(tech => tech.trim()).length - 5}
            </span>
          )}
        </div>
        
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed flex-grow line-clamp-3 sm:line-clamp-4">
          {project.description}
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-auto pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* Main Action */}
          <Link 
            href={`/projelerim/${project.slug}`} 
            className="inline-flex items-center justify-center sm:justify-start font-semibold text-brand-primary hover:text-blue-700 dark:hover:text-blue-400 transition-colors min-h-[44px] px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm sm:text-base"
          >
            Daha Fazlasını Gör 
            <FaArrowRight className="ml-2 w-4 h-4" />
          </Link>
          
          {/* External Links */}
          <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 sm:ml-auto">
            {project.liveDemo && (
              <a 
                href={project.liveDemo} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Canlı Demo" 
                className="group/demo min-w-[44px] min-h-[44px] w-11 h-11 inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-green-500 dark:hover:bg-green-500 text-gray-600 dark:text-gray-300 hover:text-white transition-all duration-300 active:scale-95"
              >
                <FaExternalLinkAlt size={16} className="transition-transform duration-500 ease-in-out group-hover/demo:rotate-12" />
              </a>
            )}
            {project.githubRepo && (
              <a 
                href={project.githubRepo} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Kaynak Kodu" 
                className="group/code min-w-[44px] min-h-[44px] w-11 h-11 inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-black text-gray-600 dark:text-gray-300 hover:text-white transition-all duration-300 active:scale-95"
              >
                <FaGithub size={16} className="transition-transform duration-500 ease-in-out group-hover/code:rotate-12" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
