import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { AboutData, Post, Project, Skill, Testimonial, SeoSettings, Popup, Message, HomeSettings, Blog, Experience } from '@/types/content';

const contentDirectory = path.join(process.cwd(), 'content');

// Generic function to read and parse a single JSON file
function getJsonData<T>(fileName: string): T {
  const fullPath = path.join(contentDirectory, fileName);
  if (!fs.existsSync(fullPath)) {
    // İsteğe bağlı dosyalar için boş bir dizi döndür.
    if (['testimonials.json', 'experiences.json', 'skills.json'].includes(fileName)) {
        return [] as T;
    }
    const errorMessage = `Dosya bulunamadı: ${fullPath}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    const errorMessage = `${fileName} dosyası okunurken veya parse edilirken bir hata oluştu.`;
    console.error(errorMessage, error);
    // Hata durumunda boş bir nesne veya dizi döndürmek, uygulamanın çökmesini engeller.
    // Bu, dosyanın içeriğine bağlı olarak ayarlanmalıdır.
    if (fileName.endsWith('s.json')) { // Çoğul isimlendirme kuralına göre dizi döndür
        return [] as T;
    }
    return {} as T;
  }
}

// Generic function to get all items of a certain type (e.g., 'blog', 'projects')
export function getSortedPostsData<T extends Post | Project>(type: 'blog' | 'projects' | 'canli-projeler'): T[] {
  const postsDirectory = path.join(contentDirectory, type);
  if (!fs.existsSync(postsDirectory)) return [];
  
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md') || fileName.endsWith('.mdx'))
    .map(fileName => {
      const id = fileName.replace(/\.mdx?$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);

      return {
        id,
        ...matterResult.data,
      } as T;
    });

  // Sort posts by date or order
  return allPostsData.sort((a, b) => {
    if ('order' in a && 'order' in b && a.order && b.order) {
        return a.order > b.order ? 1 : -1;
    }
    if (a.date && b.date) {
        return a.date < b.date ? 1 : -1;
    }
    return 0;
  });
}

export function getLatestContent(type: 'blog', count: number): Blog[] {
  const allContent = getSortedPostsData(type);
  return allContent.slice(0, count) as Blog[];
}

// Generic function to get a single item's data and content with sanitized HTML
export async function getPostData<T extends Post | Project>(type: 'blog' | 'projects' | 'canli-projeler', id: string): Promise<T & { contentHtml: string }> {
  const fullPath = path.join(contentDirectory, type, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    contentHtml,
    ...(matterResult.data as T),
  };
}

// Specific functions for each content type
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
        console.error("about.md dosyası okunamadı. Varsayılan veriler kullanılıyor.", error);
        return {
            headerTitle: "Portföy",
            name: "İsim Soyisim",
            title: "Unvan",
            subTitle: "Alt Başlık",
            shortDescription: "Kısa açıklama.",
            profileImage: "/images/profile.webp",
            workingOn: [],
            experiences: [],
            content: "Hakkımda yazısı buraya gelecek.",
            social: {
                github: "",
                linkedin: "",
                twitter: ""
            }
        };
    }
}

export async function getAboutContentHtml(): Promise<string> {
    const aboutData = await getAboutData();
    const processedContent = await remark()
        .use(remarkRehype)
        .use(rehypeSanitize)
        .use(rehypeStringify)
        .process(aboutData.content);
    return processedContent.toString();
}


export function getExperiences(): Experience[] {
  return getJsonData<Experience[]>('experiences.json');
}

export function getSkills(): Skill[] {
  const skillsArray = getJsonData<string[]>('skills.json');
  return skillsArray.map(name => ({ name }));
}

export function getTestimonials(): Testimonial[] {
  return getJsonData<Testimonial[]>('testimonials.json');
}

export function getSeoSettings(): SeoSettings {
  try {
    return getJsonData<SeoSettings>('seo-settings.json');
  } catch (error) {
    console.error("seo-settings.json bulunamadı, varsayılan SEO ayarları kullanılıyor.", error);
    return {
      siteTitle: "Portföy Sitesi",
      siteDescription: "Kişisel portföy web sitesi.",
      siteKeywords: ["web developer", "portfolio", "react"],
      canonicalUrl: "http://localhost:3000",
      robots: "index, follow",
      favicon: "/favicon.ico",
      og: {
        title: "Portföy Sitesi",
        description: "Kişisel portföy web sitesi.",
        image: "/og-image.png",
        type: "website",
        url: "http://localhost:3000",
        site_name: "Portföy"
      },
      twitter: {
        card: "summary_large_image",
        site: "@username",
        creator: "@username",
        title: "Portföy Sitesi",
        description: "Kişisel portföy web sitesi.",
        image: "/twitter-image.png"
      }
    };
  }
}

export function getHomeSettings(): HomeSettings {
    try {
        return getJsonData<HomeSettings>('home-settings.json');
    } catch (error) {
        console.error("home-settings.json bulunamadı, varsayılan ana sayfa ayarları kullanılıyor.", error);
        return {
            featuredContent: {
                type: 'text',
                textTitle: 'Hoş Geldiniz!',
                textContent: 'Bu benim portföy sitem. Projelerimi ve hakkımdaki bilgileri burada bulabilirsiniz.'
            }
        };
    }
}

// Functions for Popups
export function getAllPopups(): Popup[] {
    const popupsDirectory = path.join(contentDirectory, 'popups');
    if (!fs.existsSync(popupsDirectory)) return [];

    const fileNames = fs.readdirSync(popupsDirectory);
    return fileNames
        .filter(fileName => fileName.endsWith('.json'))
        .map(fileName => {
            const fullPath = path.join(popupsDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            return JSON.parse(fileContents) as Popup;
        });
}

export function getPopupData(slug: string): Popup | null {
    const popupsDirectory = path.join(contentDirectory, 'popups');
    const fullPath = path.join(popupsDirectory, `${slug}.json`);
    if (!fs.existsSync(fullPath)) {
        return null;
    }
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(fileContents) as Popup;
}

// Functions for Messages
export function getAllMessages(): Message[] {
    const messagesDirectory = path.join(contentDirectory, 'messages');
    if (!fs.existsSync(messagesDirectory)) return [];

    const fileNames = fs.readdirSync(messagesDirectory);
    return fileNames
        .filter(fileName => fileName.endsWith('.json'))
        .map(fileName => {
            const fullPath = path.join(messagesDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            return JSON.parse(fileContents) as Message;
        });
}