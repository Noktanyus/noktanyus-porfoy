/**
 * Content Module — Repository Layer
 *
 * Blog, Project, Popup, About, HomeSettings, SeoSettings için
 * Prisma erişim katmanı. Servis katmanı buraya bağımlıdır.
 */

import { BaseRepository, SingletonRepository } from '../shared/repository';
import { prisma } from '@/lib/prisma';
import type { Blog, Project, Popup, About, HomeSettings, SeoSettings, Experience, Skill } from '@prisma/client';

// ============================================================
// Blog Repository
// ============================================================
export class BlogRepository extends BaseRepository<Blog> {
  protected get model() {
    return this.prisma.blog;
  }

  async findBySlug(slug: string): Promise<Blog | null> {
    return this.prisma.blog.findUnique({ where: { slug } });
  }

  async findPublished(opts?: { skip?: number; take?: number; category?: string }) {
    return this.prisma.blog.findMany({
      where: opts?.category ? { category: opts.category } : {},
      orderBy: { date: 'desc' },
      skip: opts?.skip,
      take: opts?.take ?? 20,
    });
  }
}

export const blogRepository = new BlogRepository();

// ============================================================
// Project Repository
// ============================================================
export class ProjectRepository extends BaseRepository<Project> {
  protected get model() {
    return this.prisma.project;
  }

  async findBySlug(slug: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { slug } });
  }

  async findFeatured(): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { featured: true },
      orderBy: { order: 'asc' },
    });
  }

  async findAllOrdered(): Promise<Project[]> {
    return this.prisma.project.findMany({ orderBy: { order: 'asc' } });
  }
}

export const projectRepository = new ProjectRepository();

// ============================================================
// Popup Repository
// ============================================================
export class PopupRepository extends BaseRepository<Popup> {
  protected get model() {
    return this.prisma.popup;
  }

  async findBySlug(slug: string): Promise<Popup | null> {
    return this.prisma.popup.findUnique({ where: { slug } });
  }

  async findActiveBySlug(slug: string): Promise<Popup | null> {
    return this.prisma.popup.findFirst({
      where: { slug, isActive: true },
    });
  }

  async findAllActive(): Promise<Popup[]> {
    return this.prisma.popup.findMany({ where: { isActive: true } });
  }
}

export const popupRepository = new PopupRepository();

// ============================================================
// About Repository (Singleton + Relations)
// ============================================================
export type AboutWithRelations = About & {
  experiences: Experience[];
  skills: Skill[];
};

export class AboutRepository {
  protected prisma = prisma;

  async get(): Promise<AboutWithRelations | null> {
    return this.prisma.about.findFirst({
      include: { experiences: true, skills: true },
    });
  }

  async upsert(data: Partial<About>): Promise<About> {
    const current = await this.prisma.about.findFirst();
    if (current) {
      return this.prisma.about.update({ where: { id: current.id }, data });
    }
    return this.prisma.about.create({ data: data as About });
  }

  async update(id: string, data: Partial<About>): Promise<About> {
    return this.prisma.about.update({ where: { id }, data });
  }

  async addExperience(
    aboutId: string,
    exp: { title: string; company: string; date: string; description: string }
  ): Promise<Experience> {
    return this.prisma.experience.create({ data: { ...exp, aboutId } });
  }

  async deleteExperience(id: string): Promise<void> {
    await this.prisma.experience.delete({ where: { id } });
  }

  async addSkill(
    aboutId: string,
    skill: { name: string; icon?: string | null }
  ): Promise<Skill> {
    return this.prisma.skill.create({ data: { ...skill, aboutId } });
  }

  async deleteSkill(id: string): Promise<void> {
    await this.prisma.skill.delete({ where: { id } });
  }
}

export const aboutRepository = new AboutRepository();

// ============================================================
// Home Settings Repository
// ============================================================
export class HomeSettingsRepository extends SingletonRepository<HomeSettings> {
  protected get model() {
    return this.prisma.homeSettings;
  }
}

export const homeSettingsRepository = new HomeSettingsRepository();

// ============================================================
// SEO Settings Repository
// ============================================================
export class SeoSettingsRepository extends SingletonRepository<SeoSettings> {
  protected get model() {
    return this.prisma.seoSettings;
  }
}

export const seoSettingsRepository = new SeoSettingsRepository();