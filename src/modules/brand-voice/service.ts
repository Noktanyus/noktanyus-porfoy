/**
 * @file Brand Voice Service — Phase 2 A.1
 * @description
 *   Workspace bazinda marka ses/tonu egitim servisi. Kullanici orneklemlerini
 *   (title + features + AI aciklama + rating) AI'a ogretir, oradan "learned
 *   patterns" cikarir (tone/vocabulary/sentenceLength/ctaStyle/examples) ve
 *   DB'de saklar. Sonra applyBrandVoice() ile bu kalip herhangi bir base
 *   prompt'a inject edilir — boylece blog/product generation ciktilari
 *   markanin kendi sesinde uretilir.
 *
 *   Pattern reuse:
 *     - src/lib/ai-client.ts        (OpenAI-compatible provider)
 *     - src/modules/ai/service.ts   (mock fallback, system prompt style)
 *     - src/lib/planGate.ts         (consumeAiQuota)
 *     - src/lib/audit.ts            (logAudit)
 *     - src/lib/prisma.ts           (prisma client)
 *     - src/lib/logger.ts           (logger)
 */

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { consumeAiQuota } from '@/lib/planGate';
import {
  getAiClient,
  getActiveModel,
  getActiveProviderDisplayName,
  isAiConfigured,
  MAX_GENERATION_TOKENS,
} from '@/lib/ai-client';
import { estimateCostCents } from '@/modules/ai/types';

import {
  LearnedPatternsSchema,
  type LearnedPatterns,
  type TrainBrandVoiceInput,
  type TrainSample,
  type UpdateBrandVoiceInput,
  type BrandVoiceResponse,
} from './schemas';

// === Public types ===

export interface BrandVoiceServiceContext {
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AiServiceLikeContext extends BrandVoiceServiceContext {}

// === Default mock patterns (env yoksa fallback) ===

const DEFAULT_LEARNED_PATTERNS: LearnedPatterns = {
  tone: 'professional',
  vocabulary: ['kalite', 'guvenilir', 'profesyonel'],
  sentenceLength: 'medium',
  ctaStyle: 'soft',
  examples: [
    'Bu urun, profesyonel kullanicilarin ihtiyaclarini karsilamak icin titizlikle tasarlanmistir.',
    'Kalite ve guvenilirlik bir arada.',
  ],
};

// === Mappers ===

function toResponse(row: {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  model: string;
  trainedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sampleInputs: unknown;
  learnedPatterns: unknown;
}): BrandVoiceResponse {
  const parsedPatterns = LearnedPatternsSchema.safeParse(row.learnedPatterns);
  const samples = Array.isArray(row.sampleInputs) ? row.sampleInputs.length : 0;
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    description: row.description,
    model: row.model,
    trainedAt: row.trainedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    sampleCount: samples,
    patterns: parsedPatterns.success ? parsedPatterns.data : null,
  };
}

// === extractPatternsWithAI ===

/**
 * Brand voice orneklemlerinden "kalip" cikarir. JSON-only output beklenir.
 * AI konfigure degilse conservative default doner.
 *
 * Not: Bu fonksiyon disaridan da cagrilabilir (pure); DB yazmaz.
 */
export async function extractPatternsWithAI(
  samples: TrainSample[]
): Promise<LearnedPatterns> {
  if (!isAiConfigured()) {
    logger.warn('[BrandVoice] AI not configured — using default patterns', {
      sampleCount: samples.length,
    });
    return DEFAULT_LEARNED_PATTERNS;
  }

  try {
    const client = getAiClient();
    const model = getActiveModel() ?? 'unknown';
    const systemPrompt = buildExtractionSystemPrompt();
    const userMessage = buildExtractionUserMessage(samples);

    const completion = await client.chat.completions.create({
      model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const parsed = parsePatternsOutput(text);

    return parsed;
  } catch (error) {
    logger.error('[BrandVoice] extractPatternsWithAI failed, using defaults', { error });
    return DEFAULT_LEARNED_PATTERNS;
  }
}

function buildExtractionSystemPrompt(): string {
  return `Sen bir marka-sesi analistisin. Sana verilen orneklemlerden (urun/baslik + ozellikler + AI tarafindan uretilmis aciklama) markanin genel sesini, kelime dagarcigini ve yazi kalibini cikaracaksin.

Ciktini TAM OLARAK su JSON formatinda ver (baska metin YOK, sadece saf JSON):
{
  "tone": "professional" | "casual" | "technical" | "friendly" | "luxurious" | "playful" | ... (1 kelime/ifade, max 50 karakter),
  "vocabulary": ["kelime1", "kelime2", ...],  // max 30 adet — markanin sik kullandigi jargon/tarz kelimeler
  "sentenceLength": "short" | "medium" | "long",
  "ctaStyle": "soft" | "direct" | "storytelling" | "urgent" | (1 kelime/ifade, max 50 karakter),
  "examples": ["ornek cumle 1", "ornek cumle 2"]  // 2-4 adet — markanin gercek sesini yansitan en iyi cumleler
}

Kurallar:
- vocabulary gercek orneklemlerde gorulen, tekrarlayan veya ton belirleyici kelimeler olmali.
- sentenceLength: cumle ortanca uzunluguna gore sec (short < 12 kelime, long > 22 kelime).
- examples, orneklemlerden birebir alinabilir veya kucuk duzeltmelerle ozetlenebilir.

Sadece saf JSON dondur, markdown code block veya aciklama ekleme.`;
}

function buildExtractionUserMessage(samples: TrainSample[]): string {
  const parts: string[] = [`Toplam orneklem sayisi: ${samples.length}`];
  samples.slice(0, 30).forEach((s, i) => {
    parts.push(
      `--- Orneklem #${i + 1} ---\nBaslik: ${s.title}\nOzellikler: ${s.features.join('; ')}\nAciklama: ${s.generatedDescription.slice(0, 1200)}${
        s.rating ? `\nKullanici puani: ${s.rating}/5` : ''
      }`
    );
  });
  return parts.join('\n\n');
}

function parsePatternsOutput(text: string): LearnedPatterns {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;
  try {
    const raw = JSON.parse(jsonStr);
    const result = LearnedPatternsSchema.safeParse({
      tone: typeof raw.tone === 'string' ? raw.tone : 'professional',
      vocabulary: Array.isArray(raw.vocabulary)
        ? raw.vocabulary.map((v: unknown) => String(v)).slice(0, 30)
        : [],
      sentenceLength: ['short', 'medium', 'long'].includes(raw.sentenceLength)
        ? raw.sentenceLength
        : 'medium',
      ctaStyle: typeof raw.ctaStyle === 'string' ? raw.ctaStyle : 'soft',
      examples: Array.isArray(raw.examples)
        ? raw.examples.map((v: unknown) => String(v)).slice(0, 4)
        : [],
    });
    if (result.success) return result.data;
  } catch (err) {
    logger.warn('[BrandVoice] parsePatternsOutput JSON parse failed', { err, snippet: text.slice(0, 200) });
  }
  return DEFAULT_LEARNED_PATTERNS;
}

// === applyBrandVoice ===

/**
 * LearnedPatterns'i bir base prompt'a inject eder. Generation katmaninda
 * (blog/product) cagrilir; cikti olarak generation prompt'una eklenecek
 * talimat blogu doner.
 *
 * Davranis:
 *  - tone + sentenceLength + ctaStyle → tek satir system talimati
 *  - vocabulary → virgulle ayrilmis liste
 *  - examples → "Ornek ton:" blogu (few-shot)
 */
export function applyBrandVoice(
  brandVoice: { learnedPatterns: unknown } | null | undefined,
  basePrompt: string
): string {
  if (!brandVoice) return basePrompt;

  const parsed = LearnedPatternsSchema.safeParse(brandVoice.learnedPatterns);
  if (!parsed.success) {
    logger.warn('[BrandVoice] applyBrandVoice: invalid stored patterns, using base prompt only');
    return basePrompt;
  }

  const p = parsed.data;
  const sections: string[] = [];

  sections.push(
    `MARKA SESI KURALLARI:\n- Ton: ${p.tone}\n- Cumle uzunlugu: ${p.sentenceLength}\n- CTA yaklasimi: ${p.ctaStyle}`
  );

  if (p.vocabulary.length > 0) {
    sections.push(`TERCIH EDILEN KELIME DAGARCIGI: ${p.vocabulary.join(', ')}`);
  }

  if (p.examples.length > 0) {
    sections.push(
      `ORNEK TON (bu cumleleri yazim tarzi olarak referans al):\n${p.examples.map((e) => `- ${e}`).join('\n')}`
    );
  }

  sections.push(`\nASAGIDAKI GOREVI BU KURALLARA UYGUN YAZ:\n${basePrompt}`);

  return sections.join('\n\n');
}

// === trainBrandVoice ===

/**
 * Yeni brand voice training tetikler. AI'a orneklemleri gonderip kalip cikarir,
 * DB'ye yazar, audit log + quota consumption (egitim cagirisi AI token harcar).
 *
 * Workspace icinde ayni isimle aktif brand voice varsa hata firlatir.
 */
export async function trainBrandVoice(
  workspaceId: string,
  input: TrainBrandVoiceInput,
  ctx: BrandVoiceServiceContext
): Promise<BrandVoiceResponse> {
  // Ayni isimde aktif brand voice var mi?
  const existing = await prisma.brandVoice.findFirst({
    where: { workspaceId, name: input.name },
  });
  if (existing) {
    throw new Error(
      `Bu isimde bir marka sesi zaten mevcut: "${input.name}". Lutfen farkli bir isim secin veya mevcut olani guncelleyin.`
    );
  }

  const patterns = await extractPatternsWithAI(input.samples);

  // Token kullanildiysa quota consume et (mock modda tokens=0 → 0 cost)
  if (isAiConfigured()) {
    const inputTokens = Math.ceil(JSON.stringify(input.samples).length / 4);
    const outputTokens = Math.ceil(JSON.stringify(patterns).length / 4);
    const model = getActiveModel() ?? 'unknown';
    await consumeAiQuota({
      userId: ctx.userId,
      feature: 'brand_voice.train' as never,
      model,
      inputTokens,
      outputTokens,
      costCents: estimateCostCents(inputTokens, outputTokens, model),
      promptSummary: `brand-voice:${input.name} (${input.samples.length} samples)`,
      resourceType: 'BrandVoice',
    });
  }

  const row = await prisma.brandVoice.create({
    data: {
      workspaceId,
      name: input.name,
      description: input.description ?? null,
      sampleInputs: input.samples as unknown as Prisma.InputJsonValue,
      learnedPatterns: patterns as unknown as Prisma.InputJsonValue,
      model: getActiveModel() ?? 'mock',
      trainedAt: new Date(),
    },
  });

  logAudit({
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    action: 'AI_GENERATE',
    resource: 'brand_voice',
    resourceId: row.id,
    details: {
      action: 'train',
      workspaceId,
      name: input.name,
      sampleCount: input.samples.length,
      model: row.model,
      provider: getActiveProviderDisplayName(),
    },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  }).catch(() => undefined);

  return toResponse(row);
}

// === listBrandVoices ===

export async function listBrandVoices(workspaceId: string): Promise<BrandVoiceResponse[]> {
  const rows = await prisma.brandVoice.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(toResponse);
}

// === getBrandVoice ===

export async function getBrandVoice(
  workspaceId: string,
  id: string
): Promise<BrandVoiceResponse | null> {
  const row = await prisma.brandVoice.findFirst({
    where: { id, workspaceId },
  });
  return row ? toResponse(row) : null;
}

// === updateBrandVoice ===

/**
 * Brand voice'u gunceller. samples verilmisse yeniden training tetiklenir
 * (learnedPatterns yeniden hesaplanir).
 */
export async function updateBrandVoice(
  workspaceId: string,
  id: string,
  input: UpdateBrandVoiceInput,
  ctx: BrandVoiceServiceContext
): Promise<BrandVoiceResponse | null> {
  const existing = await prisma.brandVoice.findFirst({ where: { id, workspaceId } });
  if (!existing) return null;

  const data: Prisma.BrandVoiceUpdateInput = {};
  if (typeof input.name === 'string') data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  let newPatterns: LearnedPatterns | null = null;
  if (input.samples) {
    newPatterns = await extractPatternsWithAI(input.samples);
    data.sampleInputs = input.samples as unknown as Prisma.InputJsonValue;
    data.learnedPatterns = newPatterns as unknown as Prisma.InputJsonValue;
    data.trainedAt = new Date();

    // Training cagirisi oldu → quota consume
    if (isAiConfigured()) {
      const inputTokens = Math.ceil(JSON.stringify(input.samples).length / 4);
      const outputTokens = Math.ceil(JSON.stringify(newPatterns).length / 4);
      const model = getActiveModel() ?? 'unknown';
      await consumeAiQuota({
        userId: ctx.userId,
        feature: 'brand_voice.train' as never,
        model,
        inputTokens,
        outputTokens,
        costCents: estimateCostCents(inputTokens, outputTokens, model),
        promptSummary: `brand-voice:${input.name ?? existing.name} (${input.samples.length} samples)`,
        resourceId: id,
        resourceType: 'BrandVoice',
      });
    }
  }

  const row = await prisma.brandVoice.update({ where: { id }, data });

  logAudit({
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    action: 'UPDATE',
    resource: 'brand_voice',
    resourceId: row.id,
    details: {
      workspaceId,
      fields: Object.keys(data),
      retrained: Boolean(input.samples),
    },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  }).catch(() => undefined);

  return toResponse(row);
}

// === deleteBrandVoice ===

export async function deleteBrandVoice(
  workspaceId: string,
  id: string,
  ctx: BrandVoiceServiceContext
): Promise<boolean> {
  const existing = await prisma.brandVoice.findFirst({
    where: { id, workspaceId },
    select: { id: true, name: true },
  });
  if (!existing) return false;

  await prisma.brandVoice.delete({ where: { id } });

  logAudit({
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    action: 'DELETE',
    resource: 'brand_voice',
    resourceId: id,
    details: { workspaceId, name: existing.name },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  }).catch(() => undefined);

  return true;
}

export const brandVoiceService = {
  trainBrandVoice,
  extractPatternsWithAI,
  applyBrandVoice,
  listBrandVoices,
  getBrandVoice,
  updateBrandVoice,
  deleteBrandVoice,
};

// Internal exports for testing
export const __testables = {
  buildExtractionSystemPrompt,
  buildExtractionUserMessage,
  parsePatternsOutput,
  toResponse,
  DEFAULT_LEARNED_PATTERNS,
  MAX_GENERATION_TOKENS,
};
