import {
  getAbout,
  getHomeSettings,
  getSeoSettings,
  listProjects,
  listBlogs,
} from "@/services/contentService";
import { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import FeaturedContent from "@/components/home/FeaturedContent";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import LatestBlogs from "@/components/home/LatestBlogs";


export async function generateMetadata(): Promise<Metadata> {
  const seoSettings = await getSeoSettings();
  if (!seoSettings) {
    return {
      title: "Ana Sayfa",
      description: "Kişisel portfolyo sitesi.",
    };
  }
  return {
    title: seoSettings.siteTitle,
    description: seoSettings.siteDescription,
    keywords: seoSettings.siteKeywords,
    openGraph: {
      title: seoSettings.ogTitle || seoSettings.siteTitle,
      description: seoSettings.ogDescription || seoSettings.siteDescription,
      url: seoSettings.ogUrl || undefined,
      images: seoSettings.ogImage ? [{ url: seoSettings.ogImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: seoSettings.twitterTitle || seoSettings.siteTitle,
      description: seoSettings.twitterDescription || seoSettings.siteDescription,
      images: seoSettings.twitterImage ? [seoSettings.twitterImage] : [],
    },
  };
}

export default async function Home() {
  const [aboutData, homeSettings, allProjects, allBlogs] = await Promise.all([
    getAbout(),
    getHomeSettings(),
    listProjects(),
    listBlogs(),
  ]);

  if (!aboutData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="glass-card-premium p-10 flex flex-col items-center max-w-md">
          <div className="w-16 h-16 mb-6 rounded-2xl bg-yellow-100/50 dark:bg-yellow-900/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">İçerik Yüklenemedi</h2>
          <p className="text-gray-600 dark:text-gray-400">Lütfen daha sonra tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  const featuredProjects = allProjects.filter((p) => p.featured).slice(0, 3);
  const latestPosts = allBlogs.slice(0, 3);

  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center">
          <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1 animate-slide-in-left">
                <HeroSection aboutData={aboutData} />
              </div>
              <div className="order-1 lg:order-2 animate-slide-in-right" style={{animationDelay: '0.3s'}}>
                <FeaturedContent homeSettings={homeSettings} />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Projects */}
        <FeaturedProjects projects={featuredProjects} />

        {/* Latest Blogs */}
        <LatestBlogs blogs={latestPosts} />
      </div>
    </div>
  );
}
