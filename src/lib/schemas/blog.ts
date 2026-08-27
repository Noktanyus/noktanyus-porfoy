import { z } from 'zod';

export const TagsSchema = z.array(
  z.string().min(1).max(50)
).max(10);

export const BlogCreateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir').min(1).max(100),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(500),
  thumbnail: z.string().url().optional().nullable(),
  author: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  tags: TagsSchema.default([]),
  content: z.string().min(50),
});

export type BlogCreateInput = z.infer<typeof BlogCreateSchema>;