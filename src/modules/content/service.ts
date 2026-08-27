/**
 * Content Module — Service Layer
 *
 * Business logic: validation (Zod), business rules, repository orchestration.
 * API route'lar sadece bu katmana bağımlı olmalı.
 */

import {
  BlogCreateSchema,
  BlogUpdateSchema,
  ProjectCreateSchema,
  ProjectUpdateSchema,
  PopupCreateSchema,
  PopupUpdateSchema,
  AboutUpdateSchema,
  HomeSettingsSchema,
  SeoSettingsSchema,
} from './schemas';
import {
  blogRepository,
  projectRepository,
  popupRepository,
  aboutRepository,
  homeSettingsRepository,
  seoSettingsRepository,
} from './repository';
import { NotFoundError } from '@/modules/shared/errors';
import type { AboutWithRelations } from './repository';

export const contentService = {
  // ============================================================
  // Blog
  // ============================================================
  async getPublishedBlogs(opts?: { skip?: number; take?: number; category?: string }) {
    return blogRepository.findPublished(opts);
  },

  async listBlogs() {
    return blogRepository.findMany({ orderBy: { date: 'desc' } });
  },

  async getBlogBySlug(slug: string) {
    const blog = await blogRepository.findBySlug(slug);
    if (!blog) throw new NotFoundError('Blog yazısı');
    return blog;
  },

  async createBlog(input: unknown) {
    const validated = BlogCreateSchema.parse(input);
    return blogRepository.create({
      ...validated,
      tags: validated.tags,
      date: new Date(),
    });
  },

  async updateBlog(id: string, input: unknown) {
    const validated = BlogUpdateSchema.parse(input);
    return blogRepository.update(id, validated);
  },

  async upsertBlogBySlug(slug: string, data: unknown, content?: string) {
    const existing = await blogRepository.findBySlug(slug);
    if (existing) {
      const validated = BlogUpdateSchema.parse({ ...(data as object), content });
      return blogRepository.update(existing.id, validated);
    }
    const validated = BlogCreateSchema.parse({ ...(data as object), slug, content });
    return blogRepository.create({
      ...validated,
      tags: validated.tags,
      date: new Date(),
    });
  },

  async deleteBlogBySlug(slug: string) {
    const blog = await blogRepository.findBySlug(slug);
    if (!blog) throw new NotFoundError('Blog yazısı');
    return blogRepository.delete(blog.id);
  },

  // ============================================================
  // Project
  // ============================================================
  async getFeaturedProjects() {
    return projectRepository.findFeatured();
  },

  async listProjects() {
    return projectRepository.findAllOrdered();
  },

  async getProjectBySlug(slug: string) {
    const project = await projectRepository.findBySlug(slug);
    if (!project) throw new NotFoundError('Proje');
    return project;
  },

  async createProject(input: unknown) {
    const validated = ProjectCreateSchema.parse(input);
    return projectRepository.create(validated);
  },

  async updateProject(id: string, input: unknown) {
    const validated = ProjectUpdateSchema.parse(input);
    return projectRepository.update(id, validated);
  },

  async upsertProjectBySlug(slug: string, data: unknown, content?: string) {
    const existing = await projectRepository.findBySlug(slug);
    const payload = { ...(data as object), content: content ?? '' };
    if (existing) {
      const validated = ProjectUpdateSchema.parse(payload);
      return projectRepository.update(existing.id, validated);
    }
    const validated = ProjectCreateSchema.parse({ ...payload, slug });
    return projectRepository.create(validated);
  },

  async deleteProjectBySlug(slug: string) {
    const project = await projectRepository.findBySlug(slug);
    if (!project) throw new NotFoundError('Proje');
    return projectRepository.delete(project.id);
  },

  // ============================================================
  // Popup
  // ============================================================
  async getActivePopup(slug: string) {
    const popup = await popupRepository.findActiveBySlug(slug);
    if (!popup) throw new NotFoundError('Popup');
    return popup;
  },

  async getPopupBySlug(slug: string) {
    const popup = await popupRepository.findBySlug(slug);
    if (!popup) throw new NotFoundError('Popup');
    return popup;
  },

  async listPopups() {
    return popupRepository.findAllActive();
  },

  async createPopup(input: unknown) {
    const validated = PopupCreateSchema.parse(input);
    return popupRepository.create(validated);
  },

  async updatePopup(id: string, input: unknown) {
    const validated = PopupUpdateSchema.parse(input);
    return popupRepository.update(id, validated);
  },

  async upsertPopupBySlug(slug: string, data: unknown, content?: string) {
    const existing = await popupRepository.findBySlug(slug);
    const payload = { ...(data as object), content: content ?? '' };
    if (existing) {
      const validated = PopupUpdateSchema.parse(payload);
      return popupRepository.update(existing.id, validated);
    }
    const validated = PopupCreateSchema.parse({ ...payload, slug });
    return popupRepository.create(validated);
  },

  async deletePopupBySlug(slug: string) {
    const popup = await popupRepository.findBySlug(slug);
    if (!popup) throw new NotFoundError('Popup');
    return popupRepository.delete(popup.id);
  },

  // ============================================================
  // About (Singleton)
  // ============================================================
  async getAbout(): Promise<AboutWithRelations | null> {
    return aboutRepository.get();
  },

  async saveAbout(input: unknown): Promise<AboutWithRelations> {
    const validated = AboutUpdateSchema.parse(input);
    const current = await aboutRepository.get();
    if (current) {
      await aboutRepository.update(current.id, validated);
    } else {
      // create için en az zorunlu alanlar gerekir; burada validation bunu zorlar
      await aboutRepository.upsert(validated as any);
    }
    return (await aboutRepository.get())!;
  },

  // ============================================================
  // Settings (Singleton)
  // ============================================================
  async getHomeSettings() {
    return homeSettingsRepository.get();
  },

  async saveHomeSettings(input: unknown) {
    const validated = HomeSettingsSchema.parse(input);
    return homeSettingsRepository.upsert({
      ...validated,
      youtubeUrl: validated.youtubeUrl || null,
      textTitle: validated.textTitle ?? null,
      textContent: validated.textContent ?? null,
      customHtml: validated.customHtml ?? null,
    });
  },

  async getSeoSettings() {
    return seoSettingsRepository.get();
  },

  async saveSeoSettings(input: unknown) {
    const validated = SeoSettingsSchema.parse(input);
    return seoSettingsRepository.upsert(validated);
  },
};

// Backward-compatible named exports (eski contentService.ts'i kullanan API'ler için)
export const getAbout = contentService.getAbout;
export const listBlogs = contentService.listBlogs;
export const getBlog = contentService.getBlogBySlug;
export const listProjects = contentService.listProjects;
export const getProject = contentService.getProjectBySlug;
export const listPopups = contentService.listPopups;
export const getPopup = contentService.getPopupBySlug;
export const getHomeSettings = contentService.getHomeSettings;
export const getSeoSettings = contentService.getSeoSettings;
export const saveHomeSettings = contentService.saveHomeSettings;
export const saveSeoSettings = contentService.saveSeoSettings;
export const saveContent = async (
  type: string,
  slug: string,
  data: any,
  content?: string
) => {
  switch (type) {
    case 'blog':
      return contentService.upsertBlogBySlug(slug, data, content);
    case 'projects':
      return contentService.upsertProjectBySlug(slug, data, content);
    case 'popups':
      return contentService.upsertPopupBySlug(slug, data, content);
    case 'home-settings':
      return contentService.saveHomeSettings(data);
    case 'seo-settings':
      return contentService.saveSeoSettings(data);
    default:
      throw new Error(`'${type}' için kaydetme henüz desteklenmiyor`);
  }
};
export const deleteContent = async (type: string, slug: string) => {
  switch (type) {
    case 'blog':
      return contentService.deleteBlogBySlug(slug);
    case 'projects':
      return contentService.deleteProjectBySlug(slug);
    case 'popups':
      return contentService.deletePopupBySlug(slug);
    default:
      throw new Error(`'${type}' için silme henüz desteklenmiyor`);
  }
};
export const getContent = async (type: string, slug: string) => {
  switch (type) {
    case 'blog':
      return contentService.getBlogBySlug(slug);
    case 'projects':
      return contentService.getProjectBySlug(slug);
    case 'popups':
      return contentService.getPopupBySlug(slug);
    case 'about':
      return contentService.getAbout();
    case 'home-settings':
      return contentService.getHomeSettings();
    case 'seo-settings':
      return contentService.getSeoSettings();
    default:
      throw new Error(`'${type}' geçerli bir içerik tipi değil`);
  }
};
export const listContent = async (type: string) => {
  switch (type) {
    case 'blog':
      return contentService.listBlogs();
    case 'projects':
      return contentService.listProjects();
    case 'popups':
      return contentService.listPopups();
    case 'about': {
      const about = await contentService.getAbout();
      return about ? [about] : [];
    }
    default:
      throw new Error(`'${type}' listeleme desteklenmiyor`);
  }
};