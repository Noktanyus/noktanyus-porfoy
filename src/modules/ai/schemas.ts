/**
 * AI Module Zod Schemas — Sprint 1: AI Quick Wins
 *
 * Her endpoint için input validation. Türkçe hata mesajları, max sınırlar.
 */

import { z } from 'zod';

// === Ortak ===

export const AiToneSchema = z.enum(['professional', 'casual', 'technical', 'friendly']);
export type AiTone = z.infer<typeof AiToneSchema>;

export const AiLengthSchema = z.enum(['short', 'medium', 'long']);
export type AiLength = z.infer<typeof AiLengthSchema>;

export const AiLanguageSchema = z.enum(['tr', 'en', 'de', 'ar', 'fr', 'es']);
export type AiLanguage = z.infer<typeof AiLanguageSchema>;

// === AI Blog Writer ===

export const AiWriteSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Konu en az 10 karakter olmalı')
    .max(5000, 'Konu en fazla 5000 karakter olabilir'),
  tone: AiToneSchema.default('professional'),
  length: AiLengthSchema.default('medium'),
  language: AiLanguageSchema.default('tr'),
  keywords: z.array(z.string().min(1).max(50)).max(20).optional(),
  existingTitle: z.string().max(200).optional(),
  existingDescription: z.string().max(500).optional(),
});
export type AiWriteInput = z.infer<typeof AiWriteSchema>;

export const AiWriteResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  tokensUsed: z.object({
    input: z.number(),
    output: z.number(),
    total: z.number(),
  }),
  mock: z.boolean(),
});
export type AiWriteResponse = z.infer<typeof AiWriteResponseSchema>;

// === AI Product Description ===

export const AiDescribeSchema = z.object({
  productName: z.string().min(2).max(200),
  features: z.array(z.string().min(1).max(200)).min(1).max(20),
  variant: AiLengthSchema.default('medium'),
  language: AiLanguageSchema.default('tr'),
  keywords: z.array(z.string().min(1).max(50)).max(20).optional(),
  category: z.string().max(100).optional(),
  targetAudience: z.string().max(200).optional(),
  existingShortDescription: z.string().max(300).optional(),
});
export type AiDescribeInput = z.infer<typeof AiDescribeSchema>;

export const AiDescribeResponseSchema = z.object({
  shortDescription: z.string(),
  description: z.string(),
  suggestedTags: z.array(z.string()).optional(),
  tokensUsed: z.object({
    input: z.number(),
    output: z.number(),
    total: z.number(),
  }),
  mock: z.boolean(),
});
export type AiDescribeResponse = z.infer<typeof AiDescribeResponseSchema>;
