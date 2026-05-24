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
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";

// Force dynamic rendering to prevent build-time database errors
export const dynamic = 'force-dynamic';

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
      <ErrorDisplay
        title="İçerik Yüklenemedi"
        message="Veritabanına bağlanılamıyor veya içerik bulunamadı. Lütfen daha sonra tekrar deneyin."
      />
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
