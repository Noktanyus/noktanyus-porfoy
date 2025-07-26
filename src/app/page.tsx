
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

/**
 * Ana sayfa için dinamik metadata oluşturur.
 * Bu fonksiyon, sunucu tarafında çalışır ve SEO ayarlarını veritabanından çeker.
 */
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

  if (!aboutData || !homeSettings) {
    return <div>İçerik yüklenemedi.</div>;
  }

  const featuredProjects = allProjects.filter((p) => p.featured).slice(0, 3); // Anasayfada maksimum 3 proje göster
  const latestPosts = allBlogs.slice(0, 3);

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 xl:space-y-14 smooth-scroll">
      <section className="relative fade-in">
        <div className="w-full pt-6 sm:pt-8 md:pt-10 lg:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10 items-center">
            <div className="order-2 lg:order-1">
              <HeroSection aboutData={aboutData} />
            </div>
            <div className="order-1 lg:order-2">
              <FeaturedContent homeSettings={homeSettings} />
            </div>
          </div>
        </div>
      </section>
      <FeaturedProjects projects={featuredProjects} />
      <LatestBlogs blogs={latestPosts} />
    </div>
  );
}
