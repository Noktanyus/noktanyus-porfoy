import { getAboutData, getAboutContentHtml, getSkills, getExperiences } from '@/lib/content-parser';
import Image from 'next/image';
import { Skill, Experience } from '@/types/content';

export default async function HakkimdaPage() {
  const aboutData = await getAboutData();
  const contentHtml = await getAboutContentHtml();
  const skills = getSkills();
  const experiences = getExperiences();

  return (
    <div className="space-y-12">
      <div className="text-center">
        <div className="inline-block w-40 h-40 rounded-full overflow-hidden mb-4 border-4 border-glass-border">
          <Image
            src={aboutData.profileImage || "/images/1751295333926-profile.webp"}
            alt="Profil Fotoğrafı"
            width={160}
            height={160}
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-4xl font-bold text-light-text dark:text-dark-text">{aboutData.name}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">{aboutData.title}</p>
      </div>
      <div
        className="prose dark:prose-invert max-w-none bg-light-bg dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-8"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
      <div>
        <h2 className="text-3xl font-bold text-center mb-8 text-light-text dark:text-dark-text">Tecrübelerim</h2>
        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <div key={index} className="bg-light-bg dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
              <h3 className="text-xl font-bold text-light-text dark:text-dark-text">{exp.title}</h3>
              <p className="text-md font-semibold text-gray-700 dark:text-gray-300">{exp.company}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{exp.date}</p>
              <p className="text-gray-600 dark:text-gray-400">{exp.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-bold text-center mb-8 text-light-text dark:text-dark-text">Yeteneklerim</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {skills.map(skill => (
            <div key={skill.name} className="bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text rounded-full px-4 py-2">
              <span className="text-lg font-semibold">{skill.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}