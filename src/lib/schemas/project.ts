import { z } from 'zod';

export const TechnologiesSchema = z.array(
  z.string().min(1).max(50)
).min(1).max(20);

export const ProjectCreateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(100),
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

export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;