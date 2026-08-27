import { z } from 'zod';

export const PopupButtonSchema = z.object({
  label: z.string().min(1).max(50),
  url: z.string().url(),
  style: z.enum(['primary', 'secondary', 'ghost']).default('primary'),
  openInNewTab: z.boolean().default(false),
});

export const ButtonsSchema = z.array(PopupButtonSchema).max(5);

export const PopupCreateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(100),
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(5000),
  imageUrl: z.string().url().optional().nullable(),
  youtubeEmbedUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
  buttons: ButtonsSchema.default([]),
});

export type PopupCreateInput = z.infer<typeof PopupCreateSchema>;