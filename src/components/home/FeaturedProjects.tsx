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
        <div className="section-header fade-in">
          <h2 className="section-title">Öne Çıkan Projeler</h2>
          <p className="section-subtitle">
            Geliştirdiğim en önemli projeler ve kullandığım teknolojiler. Her proje farklı zorluklar ve öğrenme deneyimleri sundu.
          </p>
        </div>
        
        {/* Projeler sayfasındaki gibi tek sütun layout */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12">
          {projects.map((project, index) => (
            <div key={project.id}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
        
        {/* Tüm projeleri görme linki */}
        <div className="text-center mt-8 fade-in" style={{animationDelay: '0.6s'}}>
          <a 
            href="/projelerim" 
            className="btn-animated inline-flex items-center group bg-brand-primary text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Tüm Projeleri Görüntüle
            <svg className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}