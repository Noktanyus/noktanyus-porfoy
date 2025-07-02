/**
 * @file Projeleri listeleyen sayfalarda her bir proje için bir kart gösteren bileşen.
 * @description Bu bileşen, bir projenin başlığını, açıklamasını, ana görselini, kullanılan
 *              teknolojileri ve ilgili linkleri (detay, canlı demo, kaynak kodu) gösterir.
 */

import Link from 'next/link';
import Image from 'next/image';
import { Project } from '@/types/content';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

interface ProjectCardProps {
  /** Gösterilecek proje verileri. */
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  // Ana görselin URL'si mutlak bir URL değilse, base URL'i önüne ekle.
  const imageUrl = project.mainImage && !project.mainImage.startsWith('http')
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${project.mainImage}`
    : project.mainImage;

  return (
    <div className="project-card bg-light-bg dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 grid md:grid-cols-3 gap-6 items-center shadow-card-light dark:shadow-card-dark hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
      {/* Sol Taraf: Proje Görseli */}
      <div className="project-image relative h-48 md:col-span-1">
        <Image
          src={imageUrl || "/images/placeholder.webp"}
          alt={`${project.title} projesinin görseli`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          style={{ objectFit: 'cover' }}
          className="rounded-md"
        />
      </div>
      {/* Sağ Taraf: Proje Bilgileri */}
      <div className="md:col-span-2 flex flex-col h-full">
        <h3 className="text-xl font-bold text-light-text dark:text-white mb-2">{project.title}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {project.technologies?.slice(0, 5).map((tech) => (
            <span key={tech} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">
              {tech}
            </span>
          ))}
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm flex-grow">{project.description}</p>
        <div className="flex flex-wrap gap-3 mt-auto">
          <Link href={`/projelerim/${project.id}`} className="inline-flex items-center bg-brand-primary text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            Proje Detayları
          </Link>
          {project.liveDemo && (
            <Link href={project.liveDemo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-green-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm">
              <FaExternalLinkAlt className="mr-2" />
              Canlı Demo
            </Link>
          )}
          {project.githubRepo && (
            <Link href={project.githubRepo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-gray-700 text-white font-bold py-2 px-3 rounded-lg hover:bg-gray-800 transition-colors text-sm">
              <FaGithub className="mr-2" />
              Kaynak Kodu
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
