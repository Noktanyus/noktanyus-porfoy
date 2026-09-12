/**
 * Template Marketplace — Zod Validation Schemas
 *
 * Phase 3 B.1 kapsamında template vitrin, lisans ve kurulum islemleri icin
 * input validation katmanı. Tum API route'ları once bu semalardan gecirilir
 * (withErrorHandling + ZodError -> 400 donusu zaten apiResponse.ts'te var).
 *
 * Modeller:
 *  - TemplateListing        → vitrin kaydi
 *  - TemplateLicense        → satin alim sonrasi lisans
 *  - TemplateInstallation   → workspace'e kurulum kaydi
 *  - TemplatePurchase       → 3rd party (gumroad/lemonsqueezy/stripe) webhook kaydi
 */

import { z } from 'zod';

// =================== CONSTANTS / ENUMS ===================

/** Template kategorileri — vitrin filtrelemesi + featured rotasyonu icin. */
export const TEMPLATE_CATEGORIES = [
  'ecommerce',
  'saas',
  'portfolio',
  'blog',
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

/** Lisans tipleri — kurulumun yeteneklerini (white-label, multi-domain) belirler. */
export const TEMPLATE_LICENSE_TYPES = [
  'single',
  'white-label',
  'agency',
] as const;
export type TemplateLicenseType = (typeof TEMPLATE_LICENSE_TYPES)[number];

/** Public vitrinde siralama secenekleri. */
export const TEMPLATE_SORTS = [
  'newest',
  'popular',
  'price-asc',
  'price-desc',
] as const;
export type TemplateSort = (typeof TEMPLATE_SORTS)[number];

/** Template lisans yasam dongusu. */
export const TEMPLATE_LICENSE_STATUSES = [
  'active',
  'expired',
  'revoked',
] as const;
export type TemplateLicenseStatus = (typeof TEMPLATE_LICENSE_STATUSES)[number];

/** Template kurulum durumu — worker tarafindan guncellenir. */
export const TEMPLATE_INSTALL_STATUSES = [
  'pending',
  'cloning',
  'ready',
  'failed',
] as const;
export type TemplateInstallStatus = (typeof TEMPLATE_INSTALL_STATUSES)[number];

/** Satin alma kaynaklari — TemplatePurchase.source icin. */
export const TEMPLATE_PURCHASE_SOURCES = [
  'gumroad',
  'lemonsqueezy',
  'stripe',
  'manual',
] as const;
export type TemplatePurchaseSource = (typeof TEMPLATE_PURCHASE_SOURCES)[number];

/** Para birimi (ISO 4217). Esnek tutuldu; backend validasyona tabi degil. */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY'] as const;

// =================== HELPERS ===================

/** Slug formati: kucuk harf, rakam, tire. Baslangic/bitis tire olamaz. */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** URL formati (opsiyonel query/fragment tolere edilir). */
const urlRegex = /^https?:\/\/.+/i;

/** Semver benzeri versiyon: en az 1.0.0 veya 0.1, patch opsiyonel. */
const versionRegex = /^\d+\.\d+(\.\d+)?$/;

/** URL listesi: en az 1, max 20. */
const urlArray = z
  .array(z.string().regex(urlRegex, 'Gecerli bir URL olmali'))
  .min(1, 'En az 1 gorsel/preview URL gerekli')
  .max(20, 'En fazla 20 URL');

// =================== TEMPLATE LISTING ===================

/**
 * Yeni template listing olusturma inputu.
 * Backend authorId'yi session/admin context'ten alir; slug unique kontrolu yapilir.
 */
export const CreateTemplateListingSchema = z.object({
  slug: z
    .string()
    .min(3, 'Slug en az 3 karakter')
    .max(80, 'Slug en fazla 80 karakter')
    .regex(slugRegex, 'Slug: kucuk harf, rakam ve tire (-). Baslangic/bitis tire olamaz'),

  name: z.string().min(3, 'Isim en az 3 karakter').max(120),
  tagline: z.string().min(10, 'Tagline en az 10 karakter').max(160),
  description: z.string().min(20, 'Aciklama en az 20 karakter').max(500),

  longDescription: z.string().max(8000).optional(),

  category: z.enum(TEMPLATE_CATEGORIES, {
    errorMap: () => ({ message: 'Kategori ecommerce | saas | portfolio | blog olmali' }),
  }),

  previewImages: urlArray,
  demoUrl: z.string().regex(urlRegex, 'Gecerli bir demo URL olmali').optional(),

  priceCents: z
    .number()
    .int('Fiyat tam sayi olmali (cent)')
    .min(0, 'Fiyat negatif olamaz')
    .max(100_000_00, 'Fiyat cok yuksek (max $100,000)'),

  currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),

  licenseType: z.enum(TEMPLATE_LICENSE_TYPES, {
    errorMap: () => ({ message: 'Lisans tipi single | white-label | agency olmali' }),
  }),

  features: z
    .array(z.string().min(1).max(200))
    .min(1, 'En az 1 ozellik')
    .max(50, 'En fazla 50 ozellik'),

  techStack: z
    .array(z.string().min(1).max(60))
    .min(1, 'En az 1 tech stack ogesi')
    .max(30, 'En fazla 30 tech stack ogesi'),

  version: z.string().regex(versionRegex, 'Versiyon formati: MAJOR.MINOR[.PATCH]'),
});
export type CreateTemplateListingInput = z.infer<typeof CreateTemplateListingSchema>;

/**
 * PATCH semasi — tum alanlar opsiyonel. updateTemplateListing icin.
 * En az 1 alan gonderilmelidir (object refinement ile zorlanir).
 */
export const UpdateTemplateListingSchema = z
  .object({
    name: z.string().min(3).max(120).optional(),
    tagline: z.string().min(10).max(160).optional(),
    description: z.string().min(20).max(500).optional(),
    longDescription: z.string().max(8000).nullable().optional(),
    category: z.enum(TEMPLATE_CATEGORIES).optional(),
    previewImages: urlArray.optional(),
    demoUrl: z.string().regex(urlRegex).nullable().optional(),
    priceCents: z.number().int().min(0).max(100_000_00).optional(),
    currency: z.enum(SUPPORTED_CURRENCIES).optional(),
    licenseType: z.enum(TEMPLATE_LICENSE_TYPES).optional(),
    features: z.array(z.string().min(1).max(200)).min(1).max(50).optional(),
    techStack: z.array(z.string().min(1).max(60)).min(1).max(30).optional(),
    version: z.string().regex(versionRegex).optional(),
    active: z.boolean().optional(),
    featured: z.boolean().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'En az 1 alan guncellemek icin gonderilmelidir' }
  );
export type UpdateTemplateListingInput = z.infer<typeof UpdateTemplateListingSchema>;

// =================== QUERY / LISTING ===================

/**
 * Public vitrin liste query'si. Tum alanlar opsiyonel; page/pageSize zorunlu
 * (default degerler parseQuery icinde set edilebilir; burada min(1) zorunlu).
 */
export const ListTemplatesQuerySchema = z.object({
  category: z.enum(TEMPLATE_CATEGORIES).optional(),

  /** Free-text arama: name, tagline, description icin case-insensitive ILIKE. */
  search: z.string().min(2, 'Arama icin en az 2 karakter').max(120).optional(),

  sort: z.enum(TEMPLATE_SORTS).default('newest'),

  page: z
    .number()
    .int('Sayfa numarasi tam sayi olmali')
    .min(1, 'Sayfa 1 veya ustu olmali')
    .max(1000)
    .default(1),

  pageSize: z
    .number()
    .int()
    .min(1)
    .max(48, 'Sayfa basina en fazla 48 sonuc')
    .default(12),
});
export type ListTemplatesQuery = z.infer<typeof ListTemplatesQuerySchema>;

// =================== INSTALL ===================

/**
 * Kullanici satin aldigi template'i workspace'e kurarken gonderir.
 * licenseKey verify edilir, workspace uyelik kontrolu yapilir.
 * config opsiyonel — template'in install adiminda kullandigi parametreler
 * (ornek: brand adı, primary renk, default locale).
 */
export const InstallTemplateSchema = z.object({
  licenseKey: z
    .string()
    .min(8, 'Gecersiz lisans anahtari')
    .max(128, 'Gecersiz lisans anahtari'),

  workspaceId: z
    .string()
    .min(1, 'workspaceId zorunlu'),

  config: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});
export type InstallTemplateInput = z.infer<typeof InstallTemplateSchema>;

// =================== RECORD PURCHASE (webhook / admin) ===================

/**
 * 3rd party satis kanali webhook'u ile gelen satin alma kaydi.
 * service tarafinda `(source, externalId)` unique constraint ile idempotent.
 */
export const RecordTemplatePurchaseSchema = z.object({
  templateId: z.string().min(1),
  buyerEmail: z.string().email(),
  buyerName: z.string().max(120).optional(),
  workspaceId: z.string().optional(),
  source: z.enum(TEMPLATE_PURCHASE_SOURCES),
  externalId: z.string().min(1, 'externalId (source sale id) zorunlu'),
  amountCents: z.number().int().min(0),
  currency: z.enum(SUPPORTED_CURRENCIES),
  status: z.enum(['completed', 'refunded', 'pending', 'failed']),
  webhookPayload: z.record(z.string(), z.unknown()).optional(),
});
export type RecordTemplatePurchaseInput = z.infer<typeof RecordTemplatePurchaseSchema>;

// =================== DEMO DEPLOY (Phase 3 B.6) ===================

/**
 * Demo deployment tetikleme inputu.
 *  - licenseKey: satin alma sonrasi kullaniciya verilen anahtar
 *  - subdomain: vercel.app subdomain (kebab-case, 3-32 karakter)
 */
export const DeployDemoSchema = z.object({
  licenseKey: z
    .string()
    .min(8, 'Gecersiz lisans anahtari')
    .max(128, 'Gecersiz lisans anahtari'),

  subdomain: z
    .string()
    .min(3, 'Subdomain en az 3 karakter')
    .max(32, 'Subdomain en fazla 32 karakter')
    .regex(
      /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/,
      'Subdomain: kucuk harf, rakam, tire; baslangic/bitis tire olamaz'
    ),
});
export type DeployDemoInput = z.infer<typeof DeployDemoSchema>;