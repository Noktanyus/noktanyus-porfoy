import { Suspense } from 'react';
import { getProject, listProjects } from '@/services/contentService';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaGithub, FaExternalLinkAlt, FaArrowLeft } from 'react-icons/fa';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'isomorphic-dompurify';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const md = new MarkdownIt({ html: true });

type PageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const project = await getProject(params.slug);

  if (!project) {
    return {
      title: "Proje Bulunamadı",
      description: "Aradığınız proje mevcut değil.",
    };
  }

  return {
    title: `${project.title} | Projelerim`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: project.mainImage ? [{ url: project.mainImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
      images: project.mainImage ? [project.mainImage] : [],
    },
  };
}

function ProjectPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-6">
      <LoadingSkeleton variant="detail" />
    </div>
  );
}

async function ProjectPageContent({ slug }: { slug: string }) {
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  const dirtyHtml = md.render(project.content);
  const cleanHtml = DOMPurify.sanitize(dirtyHtml);

  const imageUrl = project.mainImage?.startsWith('/images/')
    ? `/api/static${project.mainImage}`
    : project.mainImage || "/images/placeholder.webp";

  const techs = Array.isArray(project.technologies)
    ? project.technologies.filter((t): t is string => typeof t === 'string')
    : typeof project.technologies === 'string'
      ? project.technologies.split(',').map(t => t.trim()).filter(Boolean)
      : [];

  return (
    <article className="max-w-4xl mx-auto section-glass-hero bg-blob-decoration">
      <div className="relative z-10 space-y-6">
        {/* Back button */}
        <Link
          href="/projelerim"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-brand-primary transition-colors duration-300"
        >
          <FaArrowLeft className="w-3 h-3" />
          Projelere Dön
        </Link>

        {/* Header Card */}
        <div className="glass-card-premium p-6 sm:p-8">
          {/* Live indicator */}
          {project.isLive && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
              Canlı
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            {project.title}
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
            {project.description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-5">
            {project.liveDemo && (
              <a
                href={project.liveDemo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                <FaExternalLinkAlt size={13} />
                Canlı Demo
              </a>
            )}
            {project.githubRepo && (
              <a
                href={project.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-800 dark:bg-white/10 text-white hover:bg-gray-900 dark:hover:bg-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                <FaGithub size={15} />
                Kaynak Kodu
              </a>
            )}
          </div>

          {/* Technologies */}
          {techs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {techs.map((tech) => (
                <span key={tech} className="glass-tag">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Cover Image */}
        <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30">
          <Image
            src={imageUrl}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="glass-card-premium p-6 sm:p-8 md:p-10">
          <div
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-brand-primary prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        </div>
      </div>
    </article>
  );
}

export default function ProjectPage({ params }: PageProps) {
  return (
    <Suspense fallback={<ProjectPageSkeleton />}>
      <ProjectPageContent slug={params.slug} />
    </Suspense>
  );
}

export async function generateStaticParams() {
  try {
    const projects = await listProjects();
    return projects.map(project => ({
      slug: project.slug,
    }));
  } catch (error) {
    console.warn('generateStaticParams: Could not fetch projects, returning empty array. Build will use dynamic rendering.');
    return [];
  }
}
