import { Suspense } from 'react';
import { getContentData, getSortedContentData } from '@/lib/content-parser';
import { Project } from '@/types/content';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

type Params = {
  params: {
    slug: string;
  };
};

function ProjectPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
      <div className="relative h-96 mb-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}

async function ProjectPageContent({ slug }: { slug: string }) {
  try {
    const project = await getContentData<Project>('projects', slug);

    return (
      <article className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          {project.title}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">{project.description}</p>
        
        <div className="relative h-96 mb-8 shadow-2xl rounded-lg overflow-hidden">
          <Image
            src={project.mainImage || "/images/placeholder.webp"}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            style={{objectFit: 'cover'}}
            className="rounded-lg"
            priority
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-3">
            {project.liveDemo && (
              <a href={project.liveDemo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg">
                <FaExternalLinkAlt className="mr-2" />
                Canlı Demo
              </a>
            )}
            {project.githubRepo && (
              <a href={project.githubRepo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-black transition-all duration-300 shadow-md hover:shadow-lg">
                <FaGithub className="mr-2" />
                Kaynak Kodu
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mr-2">Teknolojiler:</span>
            {project.technologies?.map((tech) => (
              <span key={tech} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
                {tech}
              </span>
            ))}
          </div>
        </div>
        
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: project.contentHtml }}
        />
      </article>
    );
  } catch (error) {
    notFound();
  }
}

export default function ProjectPage({ params }: Params) {
  return (
    <Suspense fallback={<ProjectPageSkeleton />}>
      <ProjectPageContent slug={params.slug} />
    </Suspense>
  );
}

export async function generateStaticParams() {
  const projects = getSortedContentData<Project>('projects');
  return projects.map(project => ({
    slug: project.id,
  }));
}
