import Link from 'next/link';
import { Project } from '@/types/content';
import { FaGithub, FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa';
import OptimizedImage from '@/components/ui/OptimizedImage';
import TagList from './ui/TagList';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const imageUrl = project.mainImage?.startsWith('/images/')
    ? `/api/static${project.mainImage}`
    : project.mainImage || "/images/placeholder.webp";

  return (
    <article className="group card-professional stagger-item overflow-hidden flex flex-col lg:flex-row">
      {/* Image Section */}
      <div className="lg:w-2/5 xl:w-1/3 relative h-56 lg:h-auto image-hover">
        <Link href={`/projelerim/${project.slug}`} className="block w-full h-full">
          <OptimizedImage
            src={imageUrl}
            alt={`${project.title} projesinin görseli`}
            fill
            sizes="(max-width: 1023px) 100vw, (max-width: 1279px) 40vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/10" />
        </Link>
      </div>
      
      {/* Content Section */}
      <div className="lg:w-3/5 xl:w-2/3 p-5 sm:p-6 flex flex-col">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
          <Link href={`/projelerim/${project.slug}`}>
            {project.title}
          </Link>
        </h3>
        
        <TagList 
          tags={project.technologies || []}
          limit={5}
          tagClassName="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-semibold"
        />
        
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed flex-grow line-clamp-3 sm:line-clamp-4 mb-4">
          {project.description}
        </p>
        
        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link 
            href={`/projelerim/${project.slug}`} 
            className="inline-flex items-center font-semibold text-brand-primary text-sm sm:text-base"
          >
            Daha Fazlasını Gör 
            <FaArrowRight className="ml-2 w-4 h-4" />
          </Link>
          
          <div className="flex items-center gap-3 sm:ml-auto">
            {project.liveDemo && (
              <a 
                href={project.liveDemo} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-expandable btn-demo bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300"
                aria-label="Canlı Demo"
              >
                <span className="btn-icon">
                  <FaExternalLinkAlt size={16} />
                </span>
                <span className="btn-text-expand">
                  <FaExternalLinkAlt size={14} />
                  <span className="ml-2">Canlı Demo</span>
                </span>
              </a>
            )}
            {project.githubRepo && (
              <a 
                href={project.githubRepo} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-expandable btn-github bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-all duration-300"
                aria-label="GitHub"
              >
                <span className="btn-icon">
                  <FaGithub size={16} />
                </span>
                <span className="btn-text-expand">
                  <FaGithub size={14} />
                  <span className="ml-2">Açık Kaynak</span>
                </span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
