/**
 * @file Hakkımda Sayfası (Modern Tasarım)
 * @description Bu bileşen, hakkımda bilgilerini, kariyer yolculuğunu ve yetenekleri
 *              SSG (Statik Site Oluşturma) ile oluşturarak modern ve temiz bir arayüzde sunar.
 *              İçerik güvenliği için DOMPurify kullanılmıştır.
 */
import { getAbout, getSeoSettings } from '@/services/contentService';
import Image from 'next/image';
import { FaBriefcase, FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'isomorphic-dompurify';
import { createElement } from 'react';
import { iconComponents } from '@/lib/icon-map';
import { Metadata } from 'next';

/**
 * Hakkımda sayfası için dinamik metadata oluşturur.
 */
export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout();
  const seo = await getSeoSettings();
  const title = `Hakkımda | ${about?.name || seo?.siteTitle || 'Portfolyo'}`;
  const description = about?.subTitle || 'Kariyer yolculuğum, yeteneklerim ve hakkımdaki diğer her şey.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: about?.aboutImage ? [{ url: about.aboutImage }] : [],
    },
    twitter: {
      title,
      description,
      images: about?.aboutImage ? [about.aboutImage] : [],
    },
  };
}

// Markdown-it ve DOMPurify'ı yapılandır
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrPush(['rel', 'noopener noreferrer']);
  return defaultRender(tokens, idx, options, env, self);
};

export default async function HakkimdaPage() {
  const aboutData = await getAbout();

  if (!aboutData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Hakkımda Bilgileri Yüklenemedi</h1>
        <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
          İçerik şu anda mevcut değil. Lütfen daha sonra tekrar kontrol edin.
        </p>
      </div>
    );
  }

  const dirtyHtml = md.render(aboutData.content);
  const cleanHtml = DOMPurify.sanitize(dirtyHtml);
  const { experiences, skills } = aboutData;

  const profileImageUrl = aboutData.aboutImage?.startsWith('/images/')
    ? `/api/static${aboutData.aboutImage}`
    : aboutData.aboutImage || "/images/profile.webp";

  return (
    <div className="bg-light-background dark:bg-dark-background min-h-screen font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        
        <header className="flex flex-col lg:flex-row items-center text-center lg:text-left mb-20 lg:mb-28">
          <div className="relative mb-8 lg:mb-0 lg:mr-12 flex-shrink-0">
            <Image
              src={profileImageUrl}
              alt={`${aboutData.name} - Profil Fotoğrafı`}
              width={200}
              height={200}
              priority
              className="rounded-full object-cover shadow-2xl border-8 border-white dark:border-gray-800 transform hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute bottom-2 right-4 w-10 h-10 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 animate-pulse" title="Müsait"></div>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-light-text dark:text-dark-text tracking-tight leading-tight">
              {aboutData.name}
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              {aboutData.title || 'Yazılım Geliştirici & Teknoloji Meraklısı'}
            </p>
            <div className="mt-8 flex justify-center lg:justify-start space-x-6">
              {aboutData.socialGithub && <a href={aboutData.socialGithub} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-primary transition-transform duration-300 hover:scale-125"><FaGithub size={28} /></a>}
              {aboutData.socialLinkedin && <a href={aboutData.socialLinkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-primary transition-transform duration-300 hover:scale-125"><FaLinkedin size={28} /></a>}
              {aboutData.socialInstagram && <a href={aboutData.socialInstagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-primary transition-transform duration-300 hover:scale-125"><FaInstagram size={28} /></a>}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-16">
          
          <main className="lg:col-span-8 space-y-16">
            <section className="bg-white dark:bg-dark-card p-8 rounded-xl shadow-subtle transition-shadow duration-300 hover:shadow-lg">
              <h2 className="text-3xl font-bold mb-6 text-light-text dark:text-dark-text border-b-2 border-gray-100 dark:border-gray-700 pb-4">
                Hakkımda
              </h2>
              <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: cleanHtml }} />
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-8 text-light-text dark:text-dark-text">
                Kariyer Yolculuğum
              </h2>
              <div className="relative border-l-3 border-brand-primary/20 dark:border-brand-primary/30 ml-5">
                {experiences.map((exp, index) => (
                  <div key={exp.id} className="relative pl-12 pb-12 last:pb-0">
                    <div className="absolute -left-[1.45rem] top-0 flex items-center justify-center w-12 h-12 bg-white dark:bg-dark-card rounded-full border-4 border-brand-primary/30">
                      <FaBriefcase className="text-brand-primary text-2xl" />
                    </div>
                    <p className="text-sm font-semibold text-brand-primary uppercase tracking-wider">{exp.date}</p>
                    <h3 className="text-2xl font-bold text-light-text dark:text-dark-text mt-1">{exp.title}</h3>
                    <p className="text-lg text-gray-500 dark:text-gray-400">{exp.company}</p>
                    <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
            <div className="bg-white dark:bg-dark-card p-8 rounded-xl shadow-subtle transition-shadow duration-300 hover:shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-light-text dark:text-dark-text border-b-2 border-gray-100 dark:border-gray-700 pb-4">
                Teknik Yetkinliklerim
              </h3>
              <div className="flex flex-wrap gap-3">
                {skills.map(skill => {
                  const isUrl = skill.icon && (skill.icon.startsWith('/') || skill.icon.startsWith('http'));
                  const IconComponent = !isUrl && skill.icon ? iconComponents[skill.icon] : null;
                  
                  let skillIconUrl = skill.icon;
                  if (isUrl && skill.icon?.startsWith('/images/')) {
                    skillIconUrl = `/api/static${skill.icon}`;
                  }

                  return (
                    <div key={skill.id} title={skill.name} className="bg-gray-100/80 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 text-base font-medium pl-3 pr-4 py-2 rounded-full flex items-center gap-2.5 transition-transform hover:scale-105 cursor-default">
                      {isUrl ? (
                        <Image src={skillIconUrl!} alt={skill.name} width={24} height={24} className="rounded-full object-contain" />
                      ) : IconComponent ? (
                        createElement(IconComponent, { className: "text-xl text-brand-primary" })
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600" />
                      )}
                      <span>{skill.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
