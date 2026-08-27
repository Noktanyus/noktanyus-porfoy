/**
 * Content Module — Zod Schemas
 *
 * Blog, Project, Popup için validation şemaları.
 * Mevcut @/lib/schemas/* şemaları buraya consolidate edildi.
 */

import { z } from 'zod';

// ============================================================
// Blog
// ============================================================
export const TagsSchema = z
  .array(z.string().min(1).max(50))
  .max(10)
  .default([]);

export const BlogCreateSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir')
    .min(1)
    .max(100),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(500),
  thumbnail: z.string().url().optional().nullable(),
  author: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  tags: TagsSchema,
  content: z.string().min(50),
});

export const BlogUpdateSchema = BlogCreateSchema.partial();

export type BlogCreateInput = z.infer<typeof BlogCreateSchema>;
export type BlogUpdateInput = z.infer<typeof BlogUpdateSchema>;

// ============================================================
// Project
// ============================================================
export const TechnologiesSchema = z
  .array(z.string().min(1).max(50))
  .min(1)
  .max(20);

export const ProjectCreateSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(100),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(1000),
  mainImage: z.string().url().optional().nullable(),
  technologies: TechnologiesSchema,
  liveDemo: z.string().url().optional().nullable(),
  githubRepo: z.string().url().optional().nullable(),
  order: z.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  isLive: z.boolean().default(false),
  content: z.string().min(50),
  date: z.coerce.date().optional().nullable(),
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial();

export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>;

// ============================================================
// Popup
// ============================================================
export const PopupButtonSchema = z.object({
  label: z.string().min(1).max(50),
  url: z.string().url(),
  style: z.enum(['primary', 'secondary', 'ghost']).default('primary'),
  openInNewTab: z.boolean().default(false),
});

export const ButtonsSchema = z.array(PopupButtonSchema).max(5);

export const PopupCreateSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(100),
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(5000),
  imageUrl: z.string().url().optional().nullable(),
  youtubeEmbedUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
  buttons: ButtonsSchema.default([]),
});

export const PopupUpdateSchema = PopupCreateSchema.partial();

export type PopupCreateInput = z.infer<typeof PopupCreateSchema>;
export type PopupUpdateInput = z.infer<typeof PopupUpdateSchema>;
export type PopupButton = z.infer<typeof PopupButtonSchema>;

// ============================================================
// About (Singleton)
// ============================================================
export const ExperienceSchema = z.object({
  title: z.string().min(2).max(100),
  company: z.string().min(2).max(100),
  date: z.string().min(2).max(50),
  description: z.string().min(10).max(1000),
});

export const SkillSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().max(50).optional().nullable(),
});

export const AboutUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  title: z.string().min(2).max(200).optional(),
  subTitle: z.string().max(200).optional().nullable(),
  headerTitle: z.string().min(2).max(200).optional(),
  profileImage: z.string().url().optional().nullable(),
  aboutImage: z.string().url().optional().nullable(),
  content: z.string().min(50).optional(),
  contactEmail: z.string().email().optional().nullable(),
  socialGithub: z.string().url().optional().nullable(),
  socialLinkedin: z.string().url().optional().nullable(),
  socialInstagram: z.string().url().optional().nullable(),
  workingOn: z.string().max(200).optional(),
});

export type ExperienceInput = z.infer<typeof ExperienceSchema>;
export type SkillInput = z.infer<typeof SkillSchema>;
export type AboutUpdateInput = z.infer<typeof AboutUpdateSchema>;

// ============================================================
// Settings (Singleton)
// ============================================================
export const HomeSettingsSchema = z.object({
  featuredContentType: z.string().min(1),
  youtubeUrl: z.string().url().optional().nullable().or(z.literal('')),
  textTitle: z.string().optional().nullable(),
  textContent: z.string().optional().nullable(),
  customHtml: z.string().optional().nullable(),
});

export const SeoSettingsSchema = z.object({
  siteTitle: z.string().min(1).max(200),
  siteDescription: z.string().min(10).max(500),
  siteKeywords: z.string().max(500).default(''),
  canonicalUrl: z.string().url(),
  robots: z.string().max(100).default('index, follow'),
  favicon: z.string().url().optional().nullable(),
  ogTitle: z.string().max(200).optional().nullable(),
  ogDescription: z.string().max(500).optional().nullable(),
  ogImage: z.string().url().optional().nullable(),
  ogType: z.string().max(50).optional().nullable(),
  ogUrl: z.string().url().optional().nullable(),
  ogSiteName: z.string().max(200).optional().nullable(),
  twitterCard: z.string().max(50).optional().nullable(),
  twitterSite: z.string().max(100).optional().nullable(),
  twitterCreator: z.string().max(100).optional().nullable(),
  twitterTitle: z.string().max(200).optional().nullable(),
  twitterDescription: z.string().max(500).optional().nullable(),
  twitterImage: z.string().url().optional().nullable(),
});

export type HomeSettingsInput = z.infer<typeof HomeSettingsSchema>;
export type SeoSettingsInput = z.infer<typeof SeoSettingsSchema>;