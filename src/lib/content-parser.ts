/**
 * @file İçerik yönetimi ve ayrıştırma işlemleri.
 * @description Bu modül, dosya sisteminden (content/ dizini) markdown ve JSON dosyalarını
 *              okumak, ayrıştırmak ve uygulamada kullanılabilir formatlara dönüştürmek için
 *              gerekli tüm fonksiyonları içerir.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { processMarkdown } from './markdown-processor'; // Merkezi remark işlemcisini içe aktar
import { 
  AboutData, Post, Project, Skill, Testimonial, SeoSettings, 
  Popup, Message, HomeSettings, Blog, Experience 
} from '@/types/content';

/** Projenin kök dizinindeki 'content' klasörünün yolu. */
const contentDirectory = path.join(process.cwd(), 'content');

/**
 * Belirtilen bir JSON dosyasını okur ve parse eder.
 * @template T Döndürülecek veri türü.
 * @param {string} fileName 'content' dizini içindeki dosyanın adı.
 * @param {T} defaultValue Hata durumunda döndürülecek varsayılan değer.
 * @returns {T} Okunan ve parse edilen veri veya hata durumunda varsayılan değer.
 */
function getJsonData<T>(fileName: string, defaultValue: T): T {
  const fullPath = path.join(contentDirectory, fileName);
  if (!fs.existsSync(fullPath)) {
    console.warn(`getJsonData -> Uyarı: İsteğe bağlı dosya bulunamadı: ${fullPath}. Varsayılan değer kullanılacak.`);
    return defaultValue;
  }
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error: any) {
    console.error(`getJsonData -> Hata: '${fileName}' dosyası okunurken veya parse edilirken bir hata oluştu. Varsayılan değer kullanılacak. Hata: ${error.message}`);
    return defaultValue;
  }
}

/**
 * Belirtilen türdeki tüm markdown içeriklerini (blog, projeler) sıralı bir şekilde getirir.
 * @template T 'Post' veya 'Project' türünden türetilmiş bir tip.
 * @param {'blog' | 'projects'} type İçerik türü.
 * @returns {T[]} Sıralanmış içeriklerin dizisi.
 */
export function getSortedContentData<T extends Post | Project>(type: 'blog' | 'projects'): T[] {
  const postsDirectory = path.join(contentDirectory, type);
  if (!fs.existsSync(postsDirectory)) {
    console.warn(`getSortedContentData -> Uyarı: '${type}' için içerik dizini bulunamadı: ${postsDirectory}`);
    return [];
  }
  
  try {
    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames
      .filter(fileName => fileName.endsWith('.md') || fileName.endsWith('.mdx'))
      .map(fileName => {
        const id = fileName.replace(/\.mdx?$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data } = matter(fileContents); // Sadece metadata'yı alıyoruz

        return { id, ...data } as T;
      });

    // Tarihe veya sıralama önceliğine göre sırala
    return allPostsData.sort((a, b) => {
      if ('order' in a && 'order' in b && typeof a.order === 'number' && typeof b.order === 'number') {
        return a.order - b.order;
      }
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });
  } catch (error: any) {
    console.error(`getSortedContentData -> Hata: '${type}' içerikleri okunurken bir hata oluştu. Hata: ${error.message}`);
    return [];
  }
}

/**
 * Belirtilen türdeki tek bir markdown içeriğini ve işlenmiş HTML'ini getirir.
 * @template T 'Post' veya 'Project' türünden türetilmiş bir tip.
 * @param {'blog' | 'projects'} type İçerik türü.
 * @param {string} id İçerik ID'si (dosya adı).
 * @returns {Promise<T & { contentHtml: string }>} İçerik verisi ve HTML içeriği.
 * @throws {Error} Dosya bulunamazsa veya işlenemezse hata fırlatır.
 */
export async function getContentData<T extends Post | Project>(type: 'blog' | 'projects', id: string): Promise<T & { contentHtml: string }> {
  const fullPath = path.join(contentDirectory, type, `${id}.md`);
  if (!fs.existsSync(fullPath)) {
    console.error(`getContentData -> Hata: İçerik dosyası bulunamadı: ${fullPath}`);
    throw new Error(`'${id}' adlı içerik bulunamadı.`);
  }
  
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Merkezi remark işlemcisini kullan
  const contentHtml = await processMarkdown(content);

  const result = {
    ...(data as object),
    id,
    contentHtml,
  };
  return result as unknown as T & { contentHtml: string };
}

// --- Spesifik İçerik Fonksiyonları ---

/**
 * 'Hakkımda' sayfasının verilerini ve işlenmemiş markdown içeriğini getirir.
 * @returns {Promise<AboutData>} Hakkımda sayfası verileri.
 */
export async function getAboutData(): Promise<AboutData> {
  const fullPath = path.join(contentDirectory, 'about.md');
  try {
    const fileContents = await fs.promises.readFile(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    return {
      ...(data as Omit<AboutData, 'content'>),
      content,
    };
  } catch (error) {
    console.error("getAboutData -> Hata: 'about.md' dosyası okunamadı. Varsayılan veriler kullanılıyor.", error);
    return {
      headerTitle: "Portföy", name: "İsim Soyisim", title: "Unvan",
      subTitle: "Alt Başlık", shortDescription: "Kısa açıklama.",
      profileImage: "/images/placeholder.webp", workingOn: [],
      content: "Hakkımda yazısı buraya gelecek.",
      experiences: [],
      social: { github: "", linkedin: "", twitter: "" }
    };
  }
}

/**
 * 'Hakkımda' sayfasının markdown içeriğini güvenli HTML'e dönüştürür.
 * @returns {Promise<string>} İşlenmiş HTML içeriği.
 */
export async function getAboutContentHtml(): Promise<string> {
  try {
    const aboutData = await getAboutData();
    // Merkezi remark işlemcisini kullan
    const contentHtml = await processMarkdown(aboutData.content);
    return contentHtml;
  } catch (error: any) {
    console.error(`getAboutContentHtml -> Hata: Hakkımda içeriği HTML'e dönüştürülemedi. Hata: ${error.message}`);
    return "<p>İçerik yüklenirken bir hata oluştu.</p>";
  }
}

/**
 * Tüm deneyim (experiences) verilerini getirir.
 * @returns {Experience[]} Deneyimler dizisi.
 */
export function getExperiences(): Experience[] {
  return getJsonData<Experience[]>('experiences.json', []);
}

/**
 * Tüm yetenek (skills) verilerini getirir.
 * @returns {Skill[]} Yetenekler dizisi.
 */
export function getSkills(): Skill[] {
  const skillsArray = getJsonData<string[]>('skills.json', []);
  return skillsArray.map(name => ({ name }));
}

/**
 * Tüm referans (testimonials) verilerini getirir.
 * @returns {Testimonial[]} Referanslar dizisi.
 */
export function getTestimonials(): Testimonial[] {
  return getJsonData<Testimonial[]>('testimonials.json', []);
}

/**
 * SEO ayarlarını getirir. Hata durumunda varsayılan ayarları döndürür.
 * @returns {SeoSettings} SEO ayarları nesnesi.
 */
export function getSeoSettings(): SeoSettings {
  const defaultSettings: SeoSettings = {
    siteTitle: "Portföy Sitesi",
    siteDescription: "Kişisel portföy web sitesi.",
    siteKeywords: ["web developer", "portfolio", "react"],
    canonicalUrl: "http://localhost:3000",
    robots: "index, follow",
    favicon: "/favicon.ico",
    og: {
      title: "Portföy Sitesi", description: "Kişisel portföy web sitesi.",
      image: "/og-image.png", type: "website", url: "http://localhost:3000",
      site_name: "Portföy"
    },
    twitter: {
      card: "summary_large_image", site: "@username", creator: "@username",
      title: "Portföy Sitesi", description: "Kişisel portföy web sitesi.",
      image: "/twitter-image.png"
    }
  };
  return getJsonData<SeoSettings>('seo-settings.json', defaultSettings);
}

/**
 * Ana sayfa ayarlarını getirir. Hata durumunda varsayılan ayarları döndürür.
 * @returns {HomeSettings} Ana sayfa ayarları nesnesi.
 */
export function getHomeSettings(): HomeSettings {
    const defaultSettings: HomeSettings = {
        featuredContent: {
            type: 'text',
            textTitle: 'Hoş Geldiniz!',
            textContent: 'Bu benim portföy sitem. Projelerimi ve hakkımdaki bilgileri burada bulabilirsiniz.'
        }
    };
    return getJsonData<HomeSettings>('home-settings.json', defaultSettings);
}

/**
 * Tüm popup verilerini getirir.
 * @returns {Popup[]} Pop-up'lar dizisi.
 */
export function getAllPopups(): Popup[] {
    const directory = path.join(contentDirectory, 'popups');
    if (!fs.existsSync(directory)) return [];
    try {
        const fileNames = fs.readdirSync(directory);
        return fileNames
            .filter(fileName => fileName.endsWith('.json'))
            .map(fileName => {
                const fullPath = path.join(directory, fileName);
                const fileContents = fs.readFileSync(fullPath, 'utf8');
                return JSON.parse(fileContents) as Popup;
            });
    } catch (error) {
        console.error(`getAllPopups -> Hata: Pop-up'lar okunurken bir hata oluştu.`, error);
        return [];
    }
}

/**
 * Tüm mesajları getirir.
 * @returns {Message[]} Mesajlar dizisi.
 */
export function getAllMessages(): Message[] {
    const directory = path.join(contentDirectory, 'messages');
    if (!fs.existsSync(directory)) return [];
    try {
        const fileNames = fs.readdirSync(directory);
        return fileNames
            .filter(fileName => fileName.endsWith('.json'))
            .map(fileName => {
                const fullPath = path.join(directory, fileName);
                const fileContents = fs.readFileSync(fullPath, 'utf8');
                return JSON.parse(fileContents) as Message;
            });
    } catch (error) {
        console.error(`getAllMessages -> Hata: Mesajlar okunurken bir hata oluştu.`, error);
        return [];
    }
}