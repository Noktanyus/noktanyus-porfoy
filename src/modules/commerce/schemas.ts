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
  fileUrl: z.string().min(1),
  fileName: z.string().min(1).max(200),
  fileSize: z.number().int().min(0),
  priceCents: z.number().int().min(0),
  downloadCountMax: z.number().int().min(1).max(100).default(5),
  ttlHours: z.number().int().min(1).max(720).default(72),
  technologies: z.array(z.string()).default([]),
  category: z.string().min(1).max(50).default('general'),
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