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
    <section className="py-6 sm:py-8 md:py-10">
      <div className="container-responsive">
        <div className="text-center mb-4 sm:mb-6 md:mb-8 fade-in">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-light-text dark:text-dark-text mb-3 sm:mb-4 slide-up stagger-1">
            Öne Çıkan Projeler
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed slide-up stagger-2">
            Geliştirdiğim en önemli projeler ve kullandığım teknolojiler. Her proje farklı zorluklar ve öğrenme deneyimleri sundu.
          </p>
        </div>
        
        {/* Projeler sayfasındaki gibi tek sütun layout */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12">
          {projects.map((project, index) => (
            <div key={project.id} className={`slide-up stagger-${Math.min(index + 3, 5)}`}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
        
        {/* Tüm projeleri görme linki */}
        <div className="text-center mt-4 sm:mt-6 md:mt-8 scale-in stagger-5">
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