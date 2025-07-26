import { prisma } from '@/lib/prisma';
import {
  About,
  Blog,
  Experience,
  HomeSettings,
  Popup,
  Project,
  SeoSettings,
  Skill,
  Testimonial,
  Message,
} from '@/types/content';
import { AboutWithRelations } from '@/types/content';



export async function getAbout(): Promise<AboutWithRelations | null> {
  return prisma.about.findFirst({
    include: { experiences: true, skills: true },
  });
}

export async function getHomeSettings(): Promise<HomeSettings | null> {
  return prisma.homeSettings.findFirst();
}

export async function getSeoSettings(): Promise<SeoSettings | null> {
  return prisma.seoSettings.findFirst();
}

export async function getBlog(slug: string): Promise<Blog | null> {
  return prisma.blog.findUnique({ where: { slug } });
}

export async function listBlogs(): Promise<Blog[]> {
  return prisma.blog.findMany({ orderBy: { date: 'desc' } });
}

export async function getProject(slug: string): Promise<Project | null> {
  return prisma.project.findUnique({ where: { slug } });
}

export async function listProjects(): Promise<Project[]> {
  return prisma.project.findMany({ orderBy: { order: 'asc' } });
}

export async function listExperiences(): Promise<Experience[]> {
  return prisma.experience.findMany();
}

export async function listSkills(): Promise<Skill[]> {
  return prisma.skill.findMany();
}

export async function listTestimonials(): Promise<Testimonial[]> {
  return prisma.testimonial.findMany();
}

export async function getPopup(slug: string): Promise<Popup | null> {
  return prisma.popup.findUnique({ where: { slug } });
}

export async function listPopups(): Promise<Popup[]> {
  return prisma.popup.findMany();
}

export async function listMessages(): Promise<Message[]> {
  return prisma.message.findMany({ orderBy: { timestamp: 'desc' } });
}

// Generic content functions (can be expanded)
export async function getContent(type: string, slug: string): Promise<any> {
  switch (type) {
    case 'blog':
      return getBlog(slug);
    case 'projects':
      return getProject(slug);
    case 'popups':
      return getPopup(slug);
    case 'about':
      return getAbout();
    case 'home-settings':
      return getHomeSettings();
    case 'seo-settings':
      return getSeoSettings();
    default:
      throw new Error(`'${type}' is not a valid content type.`);
  }
}

export async function listContent(type: string): Promise<any[]> {
  switch (type) {
    case 'blog':
      return listBlogs();
    case 'projects':
      return listProjects();
    case 'experiences':
      return listExperiences();
    case 'skills':
      return listSkills();
    case 'testimonials':
      return listTestimonials();
    case 'popups':
      return listPopups();
    case 'messages':
      return listMessages();
    case 'about':
      const aboutData = await getAbout();
      return aboutData ? [aboutData] : [];
    default:
      throw new Error(`'${type}' is not a valid content type for listing.`);
  }
}



export async function saveContent(type: string, slug: string, data: any, content?: string): Promise<any> {
  const payload = { ...data, content: content ?? '' };
  
  switch (type) {
    case 'blog':
      return prisma.blog.upsert({
        where: { slug },
        update: payload,
        create: { slug, ...payload, content: content ?? '' },
      });
    case 'projects':
      return prisma.project.upsert({
        where: { slug },
        update: payload,
        create: { slug, ...payload, content: content ?? '' },
      });
    case 'popups':
        return prisma.popup.upsert({
            where: { slug },
            update: payload,
            create: { slug, ...payload, content: content ?? '' },
        });
    case 'messages':
        // Messages genellikle ID ile güncellenir, slug ile değil
        // Bu durumda özel bir yaklaşım gerekebilir
        throw new Error('Message güncelleme işlemi henüz desteklenmiyor.');
    // Diğer "type" türleri için de benzer yapıları ekleyebilirsiniz.
    default:
      throw new Error(`'${type}' için kaydetme işlemi desteklenmiyor.`);
  }
}

export async function deleteContent(type: string, slug: string): Promise<any> {
  switch (type) {
    case 'blog':
      return prisma.blog.delete({ where: { slug } });
    case 'projects':
      return prisma.project.delete({ where: { slug } });
    case 'popups':
        return prisma.popup.delete({ where: { slug } });
    // Diğer "type" türleri için de benzer yapıları ekleyebilirsiniz.
    default:
      throw new Error(`'${type}' için silme işlemi desteklenmiyor.`);
  }
}

export async function saveHomeSettings(data: Omit<HomeSettings, 'id'>): Promise<HomeSettings> {
  const existingSettings = await prisma.homeSettings.findFirst();
  if (existingSettings) {
    return prisma.homeSettings.update({
      where: { id: existingSettings.id },
      data,
    });
  }
  // create metodu için 'data' nesnesinin HomeSettings'e uygun olması gerekir.
  // Ancak id'siz geldiği için, Prisma'nın otomatik id oluşturmasına güveniriz.
  return prisma.homeSettings.create({ data: data as HomeSettings });
}

export async function saveSeoSettings(data: Omit<SeoSettings, 'id'>): Promise<SeoSettings> {
  const existingSettings = await prisma.seoSettings.findFirst();
  if (existingSettings) {
    return prisma.seoSettings.update({
      where: { id: existingSettings.id },
      data,
    });
  }
  return prisma.seoSettings.create({ data: data as SeoSettings });
}