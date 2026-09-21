/**
 * Commerce Module — Zod Schemas
 *
 * Stripe entegrasyonu için gerekli şemalar: cart, product, plan.
 */

import { z } from 'zod';

export const CartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  priceCents: z.number().int().min(0),
});

export const DigitalProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(100),
  title: z.string().min(3).max(200),
  shortDescription: z.string().min(10).max(300),
  description: z.string().min(50),
  thumbnail: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional(),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1).max(200),
  fileSize: z.number().int().min(0),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).default('try'),
  downloadCountMax: z.number().int().min(1).max(100).default(5),
  ttlHours: z.number().int().min(1).max(720).default(72),
  technologies: z.array(z.string()).default([]),
  category: z.string().min(1).max(50).default('general'),
  version: z.string().max(50).optional().nullable(),
  requirements: z.array(z.string()).optional().nullable(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const PlanSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(100),
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  stripePriceId: z.string().min(1),
  stripeProductId: z.string().min(1),
  interval: z.enum(['MONTH', 'YEAR', 'WEEK', 'DAY']).default('MONTH'),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).default('try'),
  features: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
});

/** Admin panelinden plan oluşturma / güncelleme. */
export const AdminPlanWriteSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(100),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  stripePriceId: z.string().min(1).max(120).optional().nullable(),
  stripeProductId: z.string().min(1).max(120).optional().nullable(),
  interval: z.enum(['MONTH', 'YEAR', 'WEEK', 'DAY']).default('MONTH'),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).default('try'),
  /** Vitrinde madde madde gösterilecek özellikler (satır satır). */
  marketingFeatures: z.array(z.string().min(1).max(200)).default([]),
  /** Aylık API istek kotası; boş bırakılırsa limits yazılmaz. */
  apiRequestsPerMonth: z.number().int().nonnegative().optional().nullable(),
  active: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  order: z.number().int().default(0),
  trialDays: z.number().int().min(0).max(365).default(14),
});

export type AdminPlanWriteInput = z.infer<typeof AdminPlanWriteSchema>;

/** Admin panelinden kupon oluşturma / güncelleme. */
export const AdminCouponWriteSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .transform((s) => s.toUpperCase().trim().replace(/\s+/g, '')),
  description: z.string().max(500).optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().int().positive(),
  minOrderCents: z.number().int().min(0).default(0),
  maxDiscountCents: z.number().int().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().default(1),
  /** HTML date (YYYY-MM-DD) veya ISO string */
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Yüzdelik indirim en fazla 100 olabilir',
      path: ['discountValue'],
    });
  }
});

export type AdminCouponWriteInput = z.infer<typeof AdminCouponWriteSchema>;

// Legacy placeholder (geriye uyumluluk)
export const ProductCreateSchema = DigitalProductSchema.partial().extend({
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).default('USD'),
  active: z.boolean().default(true),
  metadata: z.record(z.string()).optional().nullable(),
});

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;