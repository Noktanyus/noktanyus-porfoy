/**
 * AI Service — Sprint 1.5: Provider-Agnostic
 *
 * OpenAI-compatible API kullanır. Mock fallback (env yoksa) + real provider call.
 * Token tracking + audit log + quota enforcement.
 *
 * .env konfigürasyonu:
 *   AI_BASE_URL="https://api.minimaxi.com/v1"   # veya başka OpenAI uyumlu endpoint
 *   AI_API_KEY="..."
 *   AI_MODEL="MiniMax-M3"                       # provider'a göre değişir
 *
 * NOT: Mock mode'da AiUsage kaydı atlanır (token yok, ücret yok).
 */

import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { consumeAiQuota } from '@/lib/planGate';
import {
  MAX_GENERATION_TOKENS,
  getAiClient,
  getActiveModel,
  getActiveProviderDisplayName,
  isAiConfigured,
} from '@/lib/ai-client';
import {
  AiWriteResponseSchema,
  AiDescribeResponseSchema,
  type AiWriteInput,
  type AiDescribeInput,
  type AiWriteResponse,
  type AiDescribeResponse,
  type AiLanguage,
} from './schemas';
import { estimateCostCents, type AiFeature } from './types';

export interface AiServiceContext {
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Length preset → max_tokens değeri.
 */
const LENGTH_TO_MAX_TOKENS = {
  short: 600,
  medium: 1500,
  long: 3000,
} as const;

/**
 * Multi-language support — Sprint 2 A.3
 * 6 dilde içerik üretimi için native dil adı + yazım yönü.
 */
const LANGUAGE_NAMES: Record<AiLanguage, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  ar: 'العربية',
  fr: 'Français',
  es: 'Español',
};

const LANGUAGE_DIRECTIONS: Record<AiLanguage, 'ltr' | 'rtl'> = {
  tr: 'ltr',
  en: 'ltr',
  de: 'ltr',
  fr: 'ltr',
  es: 'ltr',
  ar: 'rtl',
};

// === Blog Writer ===

export async function generateBlog(
  input: AiWriteInput,
  ctx: AiServiceContext
): Promise<AiWriteResponse> {
  if (!isAiConfigured()) {
    return mockBlogResponse(input, ctx);
  }

  try {
    const client = getAiClient();
    const model = getActiveModel() ?? 'unknown';
    const systemPrompt = buildBlogSystemPrompt(input);
    const userMessage = buildBlogUserMessage(input);

    const completion = await client.chat.completions.create({
      model,
      max_tokens: LENGTH_TO_MAX_TOKENS[input.length],
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const { title, description, content, tags } = parseBlogOutput(text, input);

    const inputTokens = completion.usage?.prompt_tokens ?? 0;
    const outputTokens = completion.usage?.completion_tokens ?? 0;

    await consumeAiQuota({
      userId: ctx.userId,
      feature: 'blog.write' as AiFeature,
      model: completion.model ?? model,
      inputTokens,
      outputTokens,
      costCents: estimateCostCents(inputTokens, outputTokens, completion.model ?? model),
      promptSummary: input.prompt.slice(0, 200),
    });

    logAudit({
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      action: 'AI_GENERATE',
      resource: 'ai.blog',
      details: {
        model: completion.model ?? model,
        provider: getActiveProviderDisplayName(),
        inputTokens,
        outputTokens,
        length: input.length,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    }).catch(() => undefined);

    return AiWriteResponseSchema.parse({
      title,
      description,
      content,
      tags,
      tokensUsed: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
      mock: false,
    });
  } catch (error) {
    logger.error('[AI] Blog generation failed, falling back to mock', { error });
    return mockBlogResponse(input, ctx);
  }
}

function buildBlogSystemPrompt(input: AiWriteInput): string {
  const langName = LANGUAGE_NAMES[input.language];
  const rtlNote =
    LANGUAGE_DIRECTIONS[input.language] === 'rtl'
      ? '\nNOT: Arapça için sağdan sola yazım kurallarına uygun içerik üret.'
      : '';
  return `Sen profesyonel bir ${input.tone} blog yazarısın. ${langName} olarak yazıyorsun.${rtlNote}
${input.length} varyant. SEO-uyumlu, okunabilir ve engaging Markdown blog yazıları üretiyorsun.
Çıktını TAM OLARAK şu JSON formatında ver (başka metin YOK):
{
  "title": "...",
  "description": "1-2 cümle SEO özeti (max 160 karakter)",
  "content": "Markdown formatında, başlıklar (##, ###), listeler, kod blokları. Minimum 800 kelime.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
Sadece saf JSON döndür, markdown code block veya açıklama ekleme.`;
}

function buildBlogUserMessage(input: AiWriteInput): string {
  const parts = [`Konu: ${input.prompt}`];
  if (input.existingTitle) parts.push(`Mevcut başlık (üzerine yazılabilir): ${input.existingTitle}`);
  if (input.existingDescription) parts.push(`Mevcut açıklama: ${input.existingDescription}`);
  if (input.keywords?.length) parts.push(`Anahtar kelimeler (SEO): ${input.keywords.join(', ')}`);
  parts.push(
    `Uzunluk: ${
      input.length === 'short' ? 'kısa (~400 kelime)' : input.length === 'medium' ? 'orta (~1000 kelime)' : 'uzun (~2000+ kelime)'
    }`
  );
  return parts.join('\n\n');
}

interface ParsedBlog {
  title: string;
  description: string;
  content: string;
  tags: string[];
}

function parseBlogOutput(text: string, input: AiWriteInput): ParsedBlog {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      title: String(parsed.title ?? input.existingTitle ?? 'AI tarafından üretildi'),
      description: String(parsed.description ?? '').slice(0, 200),
      content: String(parsed.content ?? ''),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: unknown) => String(t)).slice(0, 10) : [],
    };
  } catch {
    return {
      title: input.existingTitle ?? input.prompt.slice(0, 80),
      description: input.prompt.slice(0, 160),
      content: text,
      tags: [],
    };
  }
}

function mockBlogResponse(input: AiWriteInput, ctx: AiServiceContext): AiWriteResponse {
  logger.warn('[AI Mock] Returning mock blog content', {
    userId: ctx.userId,
    feature: 'blog.write',
    promptLength: input.prompt.length,
  });

  const title = input.existingTitle ?? `${input.prompt.slice(0, 60)} — AI Mock`;
  const description = `Mock AI tarafından üretildi. Gerçek yanıt için AI_BASE_URL + AI_API_KEY + AI_MODEL tanımlayın. Konu: ${input.prompt.slice(0, 100)}`;
  const content = `# ${title}\n\n> Bu bir **mock** içeriktir. Provider-agnostic AI entegrasyonu için .env'e şu 3 değeri ekleyin:\n>\n> \`AI_BASE_URL\`, \`AI_API_KEY\`, \`AI_MODEL\`\n\n## Konu\n\n${input.prompt}\n\n## Giriş\n\nBu bölüm AI tarafından otomatik üretilecek. ${input.tone} bir tonda, ${input.language === 'en' ? 'İngilizce' : 'Türkçe'} olarak, ~${input.length === 'short' ? '400' : input.length === 'medium' ? '1000' : '2000'} kelimelik içerik planlanıyor.\n\n## Ana Bölümler\n\n- Ana kavramların açıklanması\n- Örnekler ve kullanım senaryoları\n- Sektörel bağlam\n- Best practice önerileri\n\n## Sonuç\n\nProvider-agnostic AI: bugün MiniMax, yarın GPT-4o — sadece 3 env değiştir.\n`;

  return {
    title,
    description,
    content,
    tags: ['mock', 'ai-blog', input.tone, input.language, 'sprint-1.5'],
    tokensUsed: { input: 0, output: 0, total: 0 },
    mock: true,
  };
}

// === Product Description ===

export async function generateProductDescription(
  input: AiDescribeInput,
  ctx: AiServiceContext
): Promise<AiDescribeResponse> {
  if (!isAiConfigured()) {
    return mockProductDescription(input, ctx);
  }

  try {
    const client = getAiClient();
    const model = getActiveModel() ?? 'unknown';
    const systemPrompt = buildProductSystemPrompt(input);
    const userMessage = buildProductUserMessage(input);

    const completion = await client.chat.completions.create({
      model,
      max_tokens: LENGTH_TO_MAX_TOKENS[input.variant],
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const parsed = parseProductOutput(text, input);

    const inputTokens = completion.usage?.prompt_tokens ?? 0;
    const outputTokens = completion.usage?.completion_tokens ?? 0;

    await consumeAiQuota({
      userId: ctx.userId,
      feature: 'product.describe' as AiFeature,
      model: completion.model ?? model,
      inputTokens,
      outputTokens,
      costCents: estimateCostCents(inputTokens, outputTokens, completion.model ?? model),
      promptSummary: `${input.productName} (${input.features.length} features)`,
    });

    logAudit({
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      action: 'AI_GENERATE',
      resource: 'ai.product',
      details: {
        model: completion.model ?? model,
        provider: getActiveProviderDisplayName(),
        inputTokens,
        outputTokens,
        variant: input.variant,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    }).catch(() => undefined);

    return AiDescribeResponseSchema.parse({
      shortDescription: parsed.shortDescription,
      description: parsed.description,
      suggestedTags: parsed.tags,
      tokensUsed: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
      mock: false,
    });
  } catch (error) {
    logger.error('[AI] Product description failed, falling back to mock', { error });
    return mockProductDescription(input, ctx);
  }
}

function buildProductSystemPrompt(input: AiDescribeInput): string {
  const langName = LANGUAGE_NAMES[input.language];
  const rtlNote =
    LANGUAGE_DIRECTIONS[input.language] === 'rtl'
      ? '\nNOT: Arapça için sağdan sola yazım kurallarına uy.'
      : '';
  const keywordInstruction = input.keywords?.length
    ? `\nBu anahtar kelimeleri doğal akış içinde kullan: ${input.keywords.join(', ')}. Anahtar kelime yoğunluğu %1-2 olsun. Anahtar kelimeyi başlık (H1) ve en az 1 alt başlıkta (H2) kullan.`
    : '';
  return `Sen profesyonel bir e-ticaret copywriter'sın. ${langName} olarak yazıyorsun.${rtlNote}
${input.variant} varyant. SEO uyumlu Markdown üret.${keywordInstruction}
Çıktını TAM OLARAK şu JSON formatında ver (başka metin YOK):
{
  "shortDescription": "1-2 cümle (max 300 karakter) — landing page'de ürün kartında görünür.",
  "description": "Markdown formatında, 3-6 paragraf, başlıklar (##), bullet listeler, en az 600 kelime. SEO uyumlu.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
Sadece saf JSON döndür.`;
}

function buildProductUserMessage(input: AiDescribeInput): string {
  const parts = [
    `Ürün adı: ${input.productName}`,
    `Özellikler: ${input.features.join('; ')}`,
  ];
  if (input.category) parts.push(`Kategori: ${input.category}`);
  if (input.targetAudience) parts.push(`Hedef kitle: ${input.targetAudience}`);
  if (input.existingShortDescription) parts.push(`Mevcut kısa açıklama: ${input.existingShortDescription}`);
  if (input.keywords?.length) parts.push(`SEO anahtar kelimeleri: ${input.keywords.join(', ')}`);
  parts.push(`Varyant uzunluğu: ${input.variant}`);
  return parts.join('\n');
}

interface ParsedProduct {
  shortDescription: string;
  description: string;
  tags: string[];
}

function parseProductOutput(text: string, input: AiDescribeInput): ParsedProduct {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      shortDescription: String(parsed.shortDescription ?? '').slice(0, 300),
      description: String(parsed.description ?? ''),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: unknown) => String(t)).slice(0, 10) : [],
    };
  } catch {
    return {
      shortDescription: input.existingShortDescription ?? input.productName,
      description: text,
      tags: [],
    };
  }
}

function mockProductDescription(input: AiDescribeInput, ctx: AiServiceContext): AiDescribeResponse {
  logger.warn('[AI Mock] Returning mock product description', {
    userId: ctx.userId,
    feature: 'product.describe',
    productName: input.productName,
  });

  const shortDescription = `${input.productName} — Mock AI tarafından üretildi. .env'de AI_BASE_URL + AI_API_KEY + AI_MODEL tanımlayın.`;
  const description = `# ${input.productName}\n\n> Bu bir **mock** ürün açıklamasıdır.\n\n## Özellikler\n\n${input.features.map((f) => `- ${f}`).join('\n')}\n\n## Açıklama\n\n${input.productName}, ${input.category ?? 'genel'} kategorisinde, ${input.targetAudience ?? 'profesyonel kullanıcılar'} için tasarlanmış yüksek kaliteli bir üründür.\n\n## Kullanım Senaryoları\n\n- Günlük profesyonel iş akışları\n- Küçük ölçekli ekipler\n- Bireysel geliştiriciler\n\nProvider-agnostic AI: AI_BASE_URL/AI_API_KEY/AI_MODEL ile gerçek açıklama alabilirsiniz.\n`;

  return {
    shortDescription,
    description,
    suggestedTags: ['mock', 'ai-product', input.productName.toLowerCase().slice(0, 20)],
    tokensUsed: { input: 0, output: 0, total: 0 },
    mock: true,
  };
}

export const aiService = {
  generateBlog,
  generateProductDescription,
};
