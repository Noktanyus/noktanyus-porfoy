
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

  const featuredProjects = allProjects.filter((p) => p.featured);
  const latestPosts = allBlogs.slice(0, 3);

  return (
    <div className="space-y-20 md:space-y-32">
      <section className="relative">
        <div className="container mx-auto px-4 pt-16 md:pt-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <HeroSection aboutData={aboutData} />
            <FeaturedContent homeSettings={homeSettings} />
          </div>
        </div>
      </section>
      <FeaturedProjects projects={featuredProjects} />
      <LatestBlogs blogs={latestPosts} />
    </div>
  );
}
