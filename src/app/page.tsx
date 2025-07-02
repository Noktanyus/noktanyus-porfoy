import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import { getAboutData, getHomeSettings, getSortedContentData } from "@/lib/content-parser";
import { Project, Blog } from "@/types/content";
import ProjectCard from "@/components/ProjectCard";
import BlogCard from "@/components/BlogCard";
import Image from "next/image";
import ClientOnlyHtml from "@/components/ClientOnlyHtml";

// YouTube video ID'sini URL'den çıkaran yardımcı fonksiyon
const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default async function Home() {
  const aboutData = await getAboutData();
  const homeSettings = getHomeSettings();
  const featuredProjects = getSortedContentData<Project>("projects").filter(
    (p) => p.featured
  );
  const latestPosts = getSortedContentData<Blog>("blog").slice(0, 3);
  const featuredContent = homeSettings.featuredContent;
  
  const videoId = featuredContent?.type === 'video' && featuredContent.youtubeUrl ? getYouTubeId(featuredContent.youtubeUrl) : null;

  return (
    <div className="space-y-20 md:space-y-32">
      {/* Hero Section */}
      <section className="relative">
        <div className="container mx-auto px-4 pt-16 md:pt-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Sol Taraf: İsim, Başlık, Sosyal Medya */}
            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                  <Image
                    src={aboutData.profileImage || "/images/profile.webp"}
                    alt={`${aboutData.name} - Profil Fotoğrafı`}
                    fill
                    sizes="(max-width: 768px) 128px, 160px"
                    style={{objectFit: 'cover'}}
                    className="rounded-full border-4 border-gray-200 dark:border-gray-700 shadow-lg"
                    priority
                  />
                </div>
                <div className="flex-grow">
                  <h1 className="text-4xl md:text-6xl font-bold mb-2 text-light-text dark:text-dark-text">
                    {aboutData.name}
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-6">
                    {aboutData.title}
                  </p>
                  <div className="flex justify-center md:justify-start space-x-6">
                    <a href={aboutData.social.github} aria-label="GitHub" target="_blank" rel="noopener noreferrer"><FaGithub size={28} /></a>
                    <a href={aboutData.social.linkedin} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><FaLinkedin size={28} /></a>
                    <a href={aboutData.social.twitter} aria-label="Twitter" target="_blank" rel="noopener noreferrer"><FaTwitter size={28} /></a>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ Taraf: Uçan Kutu (Dinamik İçerik) */}
            <div className="relative flex items-center justify-center min-h-[250px]">
              {videoId && (
                <div className="w-full max-w-lg animate-float">
                  <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-2xl border-4 border-gray-300 dark:border-gray-700">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Öne Çıkan YouTube Videosu"
                    ></iframe>
                  </div>
                </div>
              )}
              {featuredContent?.type === 'text' && featuredContent.textTitle && (
                <div className="w-full max-w-lg p-8 bg-white dark:bg-dark-card rounded-xl shadow-2xl animate-float border border-gray-200 dark:border-dark-border">
                  <h3 className="text-2xl font-bold mb-3 text-center">{featuredContent.textTitle}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{featuredContent.textContent}</p>
                  {featuredContent.customHtml && (
                    <ClientOnlyHtml html={featuredContent.customHtml} className="mt-4" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Diğer Bölümler... */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Öne Çıkan Projeler</h2>
        <div className="grid grid-cols-1 gap-12">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Son Blog Yazıları</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
