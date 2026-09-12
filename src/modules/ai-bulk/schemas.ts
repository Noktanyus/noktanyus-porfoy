/**
 * AI Bulk Generation — Zod Schemas (Phase 2 A.2)
 *
 * CSV tabanlı toplu ürün açıklaması üretim işleri için input validation.
 * GenerationJob modeli ile birebir eşleşir.
 */

import { z } from 'zod';

// === Ortak ===

/** Brand voice + AI length ile uyumlu dil seti */
export const BulkLanguageSchema = z.enum(['tr', 'en', 'de', 'ar', 'fr', 'es']);
export type BulkLanguage = z.infer<typeof BulkLanguageSchema>;

/** Length preset → max_tokens eşlemesi ai/service.ts ile aynı. */
export const BulkLengthSchema = z.enum(['short', 'medium', 'long']);
export type BulkLength = z.infer<typeof BulkLengthSchema>;

// === Upload (CSV) ===

/**
 * startBulkGeneration input şeması:
 *   - csvPath: S3/R2 path ya da local fallback path
 *   - brandVoiceId: opsiyonel — workspace bazlı ton override
 *   - language: tüm satırlara uygulanır (CSV başına override yok)
 *   - length: kısa/orta/uzun varyant
 *   - keywords: SEO anahtar kelimeleri (tüm satırlara enjekte)
 */
export const BulkUploadSchema = z.object({
  csvPath: z.string().min(1, 'CSV path gerekli').max(500),
  brandVoiceId: z.string().min(1).max(100).optional(),
  language: BulkLanguageSchema.default('tr'),
  length: BulkLengthSchema.default('medium'),
  keywords: z.array(z.string().min(1).max(50)).max(20).optional(),
});
export type BulkUploadInput = z.infer<typeof BulkUploadSchema>;

// === CSV satır formatı ===

/**
 * CSV'den beklenen minimum kolon yapısı:
 *   title (zorunlu)
 *   features (zorunlu, noktalı virgülle ayrılmış: "özellik1;özellik2;...")
 *   category (opsiyonel)
 *   targetAudience (opsiyonel)
 *
 * İlk satır header olarak kabul edilir — kolon sırası sabit değildir,
 * başlıklardan eşleştirilir.
 */
export const CsvRowSchema = z.object({
  title: z.string().min(2).max(200),
  features: z.array(z.string().min(1).max(200)).min(1).max(20),
  category: z.string().max(100).optional(),
  targetAudience: z.string().max(200).optional(),
});
export type CsvRow = z.infer<typeof CsvRowSchema>;

// === Status / Job görüntüleme ===

export const GenerationJobStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
]);
export type GenerationJobStatus = z.infer<typeof GenerationJobStatusSchema>;

export const ListJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: GenerationJobStatusSchema.optional(),
});
export type ListJobsQuery = z.infer<typeof ListJobsQuerySchema>;
