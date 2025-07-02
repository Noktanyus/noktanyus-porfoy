import { getContentData, getSortedContentData } from '@/lib/content-parser';
import { Project } from '@/types/content';
import Image from 'next/image';

type Params = {
  params: {
    slug: string;
  };
};

export default async function ProjectPage({ params }: Params) {
  const project = await getContentData<Project>('projects', params.slug);

  return (
    <div className="bg-light-bg dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-8">
      <h1 className="text-4xl font-bold text-light-text dark:text-dark-text mb-4">{project.title}</h1>
      <div className="relative h-96 mb-8">
        <Image
          src={project.mainImage || "/images/placeholder.webp"}
          alt={project.title}
          fill
          style={{objectFit: 'cover'}}
          className="rounded-md"
        />
      </div>
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: project.contentHtml }}
      />
    </div>
  );
}

export async function generateStaticParams() {
  const projects = getSortedContentData<Project>('projects');
  return projects.map(project => ({
    slug: project.id,
  }));
}