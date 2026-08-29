import {
  getAbout,
  getHomeSettings,
  getSeoSettings,
  listProjects,
  listBlogs,
} from "@/services/contentService";
import { Metadata } from "next";
import { AnimatedHero } from "@/components/landing/AnimatedHero";
import FeaturedContent from "@/components/home/FeaturedContent";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import LatestBlogs from "@/components/home/LatestBlogs";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import {
  JsonLd,
  personJsonLd,
  websiteJsonLd,
  getBaseUrl,
} from "@/components/seo/JsonLd";
import { safeMetadata } from "@/lib/pageMetadata";

// Force dynamic rendering to prevent build-time database errors
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return safeMetadata(
    async () => {
      const seoSettings = await getSeoSettings();
      if (!seoSettings) return null;

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
    },
    {
      title: 'Noktanyus | Kişisel Portfolyo',
      description: 'Kişisel portfolyo sitesi — projeler, blog ve daha fazlası.',
      path: '/',
    }
  );
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

  const baseUrl = getBaseUrl();

  // Person JSON-LD (portfolyö sahibi)
  const personLd = personJsonLd({
    name: aboutData?.name ?? 'Yunus Tuğhan',
    jobTitle:
      aboutData?.title ?? 'Software Developer',
    description:
      aboutData?.content ??
      'Akdeniz Üniversitesi Yazılım Geliştirici',
    image: aboutData?.profileImage ?? '/images/profile.webp',
    url: baseUrl,
    sameAs: [
      aboutData?.socialGithub || 'https://github.com/Noktanyus',
      aboutData?.socialLinkedin || 'https://linkedin.com/in/yunus-tughan',
      aboutData?.socialInstagram
        ? `https://instagram.com/${aboutData.socialInstagram.replace(/^@/, '')}`
        : undefined,
    ].filter(Boolean) as string[],
    email: aboutData?.contactEmail ?? undefined,
  });

  // WebSite JSON-LD (Knowledge Graph için)
  const websiteLd = websiteJsonLd();

  const githubUrl = aboutData?.socialGithub || 'https://github.com/Noktanyus';
  const linkedinUrl =
    aboutData?.socialLinkedin || 'https://linkedin.com/in/yunus-tughan';
  const instagramUrl = aboutData?.socialInstagram
    ? `https://instagram.com/${aboutData.socialInstagram.replace(/^@/, '')}`
    : undefined;

  return (
    <>
      <JsonLd data={[personLd, websiteLd]} />
      <div className="container-responsive bg-blob-decoration">
        <div className="relative z-10 space-responsive">
          {/* Animated Hero Section */}
          <AnimatedHero
            name={aboutData?.name ?? 'Yunus Tuğhan'}
            title={aboutData?.title ?? 'Software Developer'}
            subtitle={`// ${aboutData?.title ?? 'Yazılım Geliştirici'}`}
            description={
              aboutData?.content ?? 'Akdeniz Üniversitesi Yazılım Geliştirici'
            }
            githubUrl={githubUrl}
            linkedinUrl={linkedinUrl}
            instagramUrl={instagramUrl}
            email={aboutData?.contactEmail ?? undefined}
          />

          {/* Featured Content (sağ kolon) */}
          <section className="relative">
            <FeaturedContent homeSettings={homeSettings} />
          </section>

          {/* Featured Projects */}
          <FeaturedProjects projects={featuredProjects} />

          {/* Latest Blogs */}
          <LatestBlogs blogs={latestPosts} />
        </div>
      </div>
    </>
  );
}
