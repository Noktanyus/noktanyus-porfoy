import { getSortedPostsData } from '@/lib/content-parser';
import ProjectList from '@/components/ProjectList';
import { Project } from '@/types/content';

export default function ProjelerimPage() {
  const allProjects = getSortedPostsData<Project>('projects');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-light-text dark:text-dark-text">Projelerim</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Yaptığım çalışmaları keşfedin.</p>
      </div>
      <ProjectList allProjects={allProjects} />
    </div>
  );
}
