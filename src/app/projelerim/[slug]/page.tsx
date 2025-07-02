/**
 * @file Tek bir projenin detay sayfası.
 * @description Bu sayfa, dinamik olarak URL'den alınan 'slug' parametresine göre
 *              ilgili projenin tüm içeriğini gösterir. `generateStaticParams`
 *              fonksiyonu ile tüm projeler için statik sayfalar oluşturulur.
 */

import { getContentData, getSortedContentData } from '@/lib/content-parser';
import { Project } from '@/types/content';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

// Sayfanın alacağı parametrelerin tip tanımı
type Params = {
  params: {
    slug: string;
  };
};

/**
 * Belirtilen projenin sayfasını oluşturan ana bileşen.
 * @param {Params} props - Sayfanın aldığı parametreler. `props.params.slug` projenin kimliğidir.
 */
export default async function ProjectPage({ params }: Params) {
  try {
    // İçerik ayrıştırıcıyı kullanarak proje verilerini ve işlenmiş HTML içeriğini al
    const project = await getContentData<Project>('projects', params.slug);

    return (
      <article className="bg-light-bg dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 md:p-8">
        {/* Proje Başlığı */}
        <h1 className="text-3xl md:text-4xl font-bold text-light-text dark:text-dark-text mb-4">
          {project.title}
        </h1>
        
        {/* Proje Ana Görseli */}
        <div className="relative h-64 md:h-96 mb-8">
          <Image
            src={project.mainImage || "/images/placeholder.webp"}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            style={{objectFit: 'cover'}}
            className="rounded-md"
            priority // LCP (Largest Contentful Paint) için öncelikli yükle
          />
        </div>

        {/* Proje Linkleri ve Teknolojiler */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-3">
            {project.liveDemo && (
              <a href={project.liveDemo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm">
                <FaExternalLinkAlt className="mr-2" />
                Canlı Demo
              </a>
            )}
            {project.githubRepo && (
              <a href={project.githubRepo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm">
                <FaGithub className="mr-2" />
                Kaynak Kodu
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {project.technologies?.map((tech) => (
              <span key={tech} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>
        
        {/* Markdown'dan dönüştürülmüş HTML içeriği */}
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: project.contentHtml }}
        />
      </article>
    );
  } catch (error) {
    // Eğer `getContentData` fonksiyonu hata fırlatırsa (örn: dosya bulunamadı),
    // 404 sayfasını göster.
    notFound();
  }
}

/**
 * Build sırasında tüm projeler için statik sayfalar oluşturur.
 * Bu, performansı artırır çünkü sayfalar istek anında değil, build sırasında render edilir.
 * @returns {Promise<{ slug: string }[]>} Statik olarak oluşturulacak yolların (slug'ların) bir dizisi.
 */
export async function generateStaticParams() {
  const projects = getSortedContentData<Project>('projects');
  return projects.map(project => ({
    slug: project.id,
  }));
}
