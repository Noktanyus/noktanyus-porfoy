import { z } from 'zod';

// DOMPurify ile sanitize edilecek custom HTML
export const CustomHtmlSchema = z.string()
  .max(50000)
  .transform((val) => val.trim())
  .refine((val) => val.length === 0 || /^[\s\S]*$/.test(val), 'Geçersiz HTML');

export const SeoSettingsSchema = z.object({
  siteTitle: z.string().min(1).max(200),
  siteDescription: z.string().min(10).max(500),
  siteKeywords: z.string().max(500).default(''),
  canonicalUrl: z.string().url(),
  robots: z.string().max(100).default('index, follow'),
  favicon: z.string().url().optional().nullable(),
  // og
  ogTitle: z.string().max(200).optional().nullable(),
  ogDescription: z.string().max(500).optional().nullable(),
  ogImage: z.string().url().optional().nullable(),
  ogType: z.string().max(50).optional().nullable(),
  ogUrl: z.string().url().optional().nullable(),
  ogSiteName: z.string().max(200).optional().nullable(),
  // twitter
  twitterCard: z.string().max(50).optional().nullable(),
  twitterSite: z.string().max(100).optional().nullable(),
  twitterCreator: z.string().max(100).optional().nullable(),
  twitterTitle: z.string().max(200).optional().nullable(),
  twitterDescription: z.string().max(500).optional().nullable(),
  twitterImage: z.string().url().optional().nullable(),
});

export type SeoSettingsInput = z.infer<typeof SeoSettingsSchema>;