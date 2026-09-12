/**
 * @file Brand Voice Module — Zod Schemas
 * @description Phase 2 A.1: Brand Voice Training + Bulk Generation.
 *
 * Brand voice training sistemi — kullanici orneklemleri verilen aciklamalari AI'a
 * ogretip "marka sesini" cikarir. Sonra bu ses tum generation promptlarina
 * (blog/product) inject edilir ve tutarli cikti uretilir.
 *
 * Schema genel bakis:
 *   - TrainSampleSchema:      1 adet egitim ornegi (title/features/output + rating)
 *   - TrainBrandVoiceSchema:  Training endpoint input
 *   - UpdateBrandVoiceSchema: Patch endpoint input
 *   - ApplyBrandVoiceSchema:  Yardimci — pattern'i base prompt'a enjekte etmek icin
 *   - LearnedPatternsSchema:  AI'dan donen ogrenilmis kalip (DB JSON shape)
 *
 * Not: BrandVoice DB'de JSON kolon olarak saklanir. BrandVoice.learnedPatterns
 * shape LearnedPatternsSchema ile eslesir. BrandVoice.sampleInputs shape
 * TrainSampleSchema[] ile eslesir (DB'ye yazmadan once zod ile dogrulanir).
 */

import { z } from 'zod';

// === Orneklem (1 adet egitim verisi) ===

/**
 * 1 adet egitim ornegi. Kullanici kendi marka sesini tanimlamak icin 3-30 ornek
 * verir: title + features + AI tarafindan onceden uretilmis aciklama + rating.
 * Rating opsiyonel (1-5). AI bu orneklemlerden "kalip" cikarir.
 */
export const TrainSampleSchema = z.object({
  title: z.string().min(2, 'Baslik en az 2 karakter olmali').max(200),
  features: z.array(z.string().min(1).max(300)).min(1).max(20),
  generatedDescription: z
    .string()
    .min(20, 'Olusturulmus aciklama en az 20 karakter olmali')
    .max(5000),
  rating: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
    .optional(),
});
export type TrainSample = z.infer<typeof TrainSampleSchema>;

// === Brand Voice training ===

/**
 * Training endpoint input. min 3, max 30 orneklem ile AI'a ogretim.
 * name workspace icinde unique olmali (uygulama katmaninda kontrol edilir).
 */
export const TrainBrandVoiceSchema = z.object({
  name: z
    .string()
    .min(2, 'Marka adi en az 2 karakter olmali')
    .max(100, 'Marka adi en fazla 100 karakter olabilir'),
  description: z.string().max(500).optional(),
  samples: z
    .array(TrainSampleSchema)
    .min(3, 'En az 3 orneklem gerekli (min 3, max 30)')
    .max(30, 'En fazla 30 orneklem kabul edilir'),
});
export type TrainBrandVoiceInput = z.infer<typeof TrainBrandVoiceSchema>;

// === Brand Voice update (PATCH) ===

/**
 * Patch endpoint input. Tum alanlar opsiyonel. samples guncellenirse yeni
 * training tetiklenir (learnedPatterns yeniden hesaplanir).
 */
export const UpdateBrandVoiceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  samples: z.array(TrainSampleSchema).min(3).max(30).optional(),
});
export type UpdateBrandVoiceInput = z.infer<typeof UpdateBrandVoiceSchema>;

// === Learned patterns (AI output + DB JSON shape) ===

/**
 * AI'in orneklemlerden cikardigi marka kalibi. DB'de JSON kolon olarak saklanir.
 * applyBrandVoice() bu kalibi base prompt'a inject eder.
 */
export const LearnedPatternsSchema = z.object({
  tone: z
    .string()
    .min(2)
    .max(50)
    .describe('Genel ton: "professional", "casual", "technical", "friendly", "luxurious", ...'),
  vocabulary: z
    .array(z.string().min(1).max(50))
    .max(30)
    .describe('Sik kullanilan anahtar kelimeler / jargon (max 30)'),
  sentenceLength: z.enum(['short', 'medium', 'long']).default('medium'),
  ctaStyle: z
    .string()
    .min(2)
    .max(50)
    .describe('Call-to-action yaklasimi: "soft", "direct", "storytelling", ...'),
  examples: z
    .array(z.string().min(5).max(300))
    .min(2)
    .max(4)
    .describe('2-4 ornek cumle (few-shot) — markanin gercek sesini yansitan'),
});
export type LearnedPatterns = z.infer<typeof LearnedPatternsSchema>;

// === Apply patterns to base prompt ===

/**
 * Yardimci sema. Service tarafindan kullanilir — applyBrandVoice() cagrisinda
 * base prompt + patterns birlestirilir. Bu sema public degil; service.ts icinde
 * type-safe calisma icin export edildi.
 */
export const ApplyBrandVoiceSchema = z.object({
  basePrompt: z.string().min(1),
  patterns: LearnedPatternsSchema,
});
export type ApplyBrandVoiceInput = z.infer<typeof ApplyBrandVoiceSchema>;

// === Response schemas (API contract) ===

export const BrandVoiceResponseSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  model: z.string(),
  trainedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  sampleCount: z.number().int().nonnegative(),
  patterns: LearnedPatternsSchema.nullable(),
});
export type BrandVoiceResponse = z.infer<typeof BrandVoiceResponseSchema>;
