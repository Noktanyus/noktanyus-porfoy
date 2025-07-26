import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/types/content";

interface FeaturedProjectsProps {
  projects: Project[];
}

export default function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container-responsive">
        <div className="text-center mb-8 sm:mb-12 md:mb-16 fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-light-text dark:text-dark-text mb-3 sm:mb-4 slide-up stagger-1">
            Öne Çıkan Projeler
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed slide-up stagger-2">
            Geliştirdiğim en önemli projeler ve kullandığım teknolojiler. Her proje farklı zorluklar ve öğrenme deneyimleri sundu.
          </p>
        </div>
        
        {/* Projeler sayfasındaki gibi tek sütun layout */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-14">
          {projects.map((project, index) => (
            <div key={project.id} className={`slide-up stagger-${Math.min(index + 3, 5)}`}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
        
        {/* Tüm projeleri görme linki */}
        <div className="text-center mt-8 sm:mt-12 md:mt-16 scale-in stagger-5">
          <a 
            href="/projelerim" 
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-brand-primary text-white font-semibold rounded-xl sm:rounded-2xl hover:bg-blue-600 transition-all duration-300 ease-out text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-2 min-h-[48px] sm:min-h-[52px] btn-hover-fill hover-glow mobile-touch"
          >
            Tüm Projeleri Görüntüle
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}