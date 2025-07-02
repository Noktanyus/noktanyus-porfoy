/**
 * @file Hakkımda sayfasını oluşturan sunucu bileşeni.
 * @description Bu sayfa, `content-parser` kullanarak hakkımda, yetenekler ve
 *              tecrübelerle ilgili verileri çeker ve bunları kullanıcıya
 *              anlamlı bir düzende sunar.
 */

import { getAboutData, getAboutContentHtml, getSkills, getExperiences } from '@/lib/content-parser';
import Image from 'next/image';
import { FaCode, FaBriefcase } from 'react-icons/fa';

export default async function HakkimdaPage() {
  // Gerekli tüm verileri sunucu tarafında paralel olarak çek
  const [aboutData, contentHtml, skills, experiences] = await Promise.all([
    getAboutData(),
    getAboutContentHtml(),
    getSkills(),
    getExperiences()
  ]);

  return (
    <div className="space-y-16">
      {/* Üst Kısım: Profil Resmi ve Başlıklar */}
      <section className="text-center">
        <div className="inline-block w-40 h-40 rounded-full overflow-hidden mb-4 border-4 border-gray-200 dark:border-gray-700 shadow-lg">
          <Image
            src={aboutData.profileImage || "/images/profile.webp"}
            alt={`${aboutData.name} - Profil Fotoğrafı`}
            width={160}
            height={160}
            priority // LCP (Largest Contentful Paint) için önemli
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-light-text dark:text-dark-text">{aboutData.name}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mt-2">{aboutData.title}</p>
      </section>

      {/* Ana İçerik (Markdown'dan gelen) */}
      <section 
        className="prose dark:prose-invert max-w-none bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 md:p-8 shadow-md"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* İş Tecrübelerim */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8 text-light-text dark:text-dark-text">İş Tecrübelerim</h2>
        {/* Zaman çizgisi (timeline) yapısı */}
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
          {experiences.map((exp, index) => (
            <div key={index} className="relative pl-10">
              {/* Zaman çizgisi noktası */}
              <div className="absolute left-5 top-1 w-4 h-4 bg-brand-primary rounded-full border-4 border-white dark:border-dark-bg flex items-center justify-center">
                <FaBriefcase className="text-white text-xs" />
              </div>
              <h3 className="text-xl font-bold text-light-text dark:text-dark-text">{exp.title}</h3>
              <p className="text-md font-semibold text-gray-700 dark:text-gray-300">{exp.company}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{exp.date}</p>
              <p className="text-gray-600 dark:text-gray-400">{exp.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Yeteneklerim */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8 text-light-text dark:text-dark-text">Yeteneklerim</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {skills.map(skill => (
            <div key={skill.name} className="flex items-center bg-white dark:bg-dark-card shadow-lg rounded-lg p-4 transform hover:scale-105 transition-transform duration-300 border border-transparent hover:border-brand-primary">
              <FaCode className="text-brand-primary text-2xl mr-3" />
              <span className="text-lg font-semibold text-light-text dark:text-dark-text">{skill.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
