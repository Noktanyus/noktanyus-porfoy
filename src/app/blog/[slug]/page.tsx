/**
 * @file Tek bir blog gönderisinin detay sayfası.
 * @description Bu sayfa, dinamik olarak URL'den alınan 'slug' parametresine göre
 *              ilgili blog gönderisinin tüm içeriğini gösterir. `generateStaticParams`
 *              fonksiyonu ile tüm blog gönderileri için statik sayfalar oluşturulur.
 */

import { getContentData, getSortedContentData } from '@/lib/content-parser';
import { Blog } from '@/types/content';
import Image from 'next/image';
import { notFound } from 'next/navigation';

// Sayfanın alacağı parametrelerin tip tanımı
type Params = {
  params: {
    slug: string;
  };
};

/**
 * Belirtilen blog gönderisinin sayfasını oluşturan ana bileşen.
 * @param {Params} props - Sayfanın aldığı parametreler. `props.params.slug` gönderinin kimliğidir.
 */
export default async function BlogPostPage({ params }: Params) {
  try {
    // İçerik ayrıştırıcıyı kullanarak gönderi verilerini ve işlenmiş HTML içeriğini al
    const post = await getContentData<Blog>('blog', params.slug);

    return (
      <article className="bg-light-bg dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 md:p-8">
        {/* Gönderi Başlığı */}
        <h1 className="text-3xl md:text-4xl font-bold text-light-text dark:text-dark-text mb-4">
          {post.title}
        </h1>
        {/* Gönderi Meta Bilgileri (Tarih ve Yazar) */}
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Yayınlanma Tarihi: {new Date(post.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })} / Yazar: {post.author}
        </p>
        
        {/* Gönderi Küçük Resmi */}
        {post.thumbnail && (
          <div className="relative h-64 md:h-96 mb-8">
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              style={{objectFit: 'cover'}}
              className="rounded-md"
              priority // LCP (Largest Contentful Paint) için öncelikli yükle
            />
          </div>
        )}
        
        {/* Markdown'dan dönüştürülmüş HTML içeriği */}
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
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
 * Build sırasında tüm blog gönderileri için statik sayfalar oluşturur.
 * Bu, performansı artırır çünkü sayfalar istek anında değil, build sırasında render edilir.
 * @returns {Promise<{ slug: string }[]>} Statik olarak oluşturulacak yolların (slug'ların) bir dizisi.
 */
export async function generateStaticParams() {
  const posts = getSortedContentData<Blog>('blog');
  return posts.map(post => ({
    slug: post.id,
  }));
}
