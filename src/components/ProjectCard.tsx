import Link from 'next/link';
import Image from 'next/image';
import { Project } from '@/types/content';
import { FaGithub, FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const imageUrl = project.mainImage || "/images/placeholder.webp";

  return (
    <div className="group bg-white dark:bg-dark-card rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col md:flex-row transform hover:-translate-y-1">
      <div className="md:w-1/3 relative h-56 md:h-auto">
        <Image
          src={imageUrl}
          alt={`${project.title} projesinin görseli`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          style={{ objectFit: 'cover' }}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-300"></div>
      </div>
      
      <div className="md:w-2/3 p-6 flex flex-col">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{project.title}</h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies?.slice(0, 4).map((tech) => (
            <span key={tech} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
              {tech}
            </span>
          ))}
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-5 text-sm flex-grow">{project.description}</p>
        
        <div className="flex flex-wrap items-center gap-4 mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link href={`/projelerim/${project.id}`} className="inline-flex items-center font-semibold text-brand-primary hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
            Daha Fazlasını Gör <FaArrowRight className="ml-2" />
          </Link>
          <div className="flex-grow"></div>
          {project.liveDemo && (
            <a href={project.liveDemo} target="_blank" rel="noopener noreferrer" title="Canlı Demo" className="text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 transition-colors">
              <FaExternalLinkAlt size={20} />
            </a>
          )}
          {project.githubRepo && (
            <a href={project.githubRepo} target="_blank" rel="noopener noreferrer" title="Kaynak Kodu" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              <FaGithub size={20} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
