/**
 * @file AI Service — Multi-language + SEO + Brand Voice Tests (Phase 2 A.3 + A.4 + A.1)
 * @description
 *   - generateProductDescription: 6 dil için mock provider, doğru system prompt
 *   - SEO keyword injection: keywords prompt'a eklenir
 *   - Brand voice: learnedPatterns prompt'a inject edilir (applyBrandVoice)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- OpenAI mock — provider call'ları capture edebilmek için custom impl ---

const openaiCreateMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiUsage: {
      create: vi.fn().mockResolvedValue({}),
      aggregate: vi.fn().mockResolvedValue({ _sum: { totalTokens: 0 } }),
      count: vi.fn().mockResolvedValue(0),
    },
    brandVoice: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(async () => undefined),
}));

vi.mock('@/lib/planGate', () => ({
  consumeAiQuota: vi.fn(async () => undefined),
  checkAiQuota: vi.fn(async () => ({ allowed: true })),
}));

// AI client — konfigüre edilmiş sayılır ki real provider path çalışsın
vi.mock('@/lib/ai-client', () => ({
  isAiConfigured: vi.fn(() => true),
  getAiClient: vi.fn(() => ({
    chat: {
      completions: {
        create: openaiCreateMock,
      },
    },
  })),
  getActiveModel: vi.fn(() => 'MiniMax-M3'),
  getActiveProviderDisplayName: vi.fn(() => 'MiniMax'),
  MAX_GENERATION_TOKENS: 4096,
}));

import { generateProductDescription } from '../service';
import { applyBrandVoice } from '@/modules/brand-voice/service';

const ctx = {
  userId: 'user-ml-1',
  userEmail: 'ml@example.com',
};

const LANGUAGES = [
  { code: 'tr', native: 'Türkçe' },
  { code: 'en', native: 'English' },
  { code: 'de', native: 'Deutsch' },
  { code: 'ar', native: 'العربية' },
  { code: 'fr', native: 'Français' },
  { code: 'es', native: 'Español' },
] as const;

beforeEach(() => {
  vi.clearAllMocks();
  // Real path tetiklensin — mock olmayan (provider) response dönmeli
  openaiCreateMock.mockResolvedValue({
    id: 'cmpl-test',
    model: 'MiniMax-M3',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify({
            shortDescription: 'Short mock description',
            description: 'Long description content for product.',
            tags: ['tag1', 'tag2', 'tag3'],
          }),
        },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
  });
});

describe('generateProductDescription — multi-language system prompt', () => {
  for (const lang of LANGUAGES) {
    it(`builds correct system prompt for language=${lang.code} (${lang.native})`, async () => {
      await generateProductDescription(
        {
          productName: 'Test Ürün',
          features: ['feature A', 'feature B'],
          variant: 'medium',
          language: lang.code,
        },
        ctx
      );

      // openai.chat.completions.create çağrıldı
      expect(openaiCreateMock).toHaveBeenCalled();
      const callArg = openaiCreateMock.mock.calls[0][0];

      // System prompt içinde doğru dil adı geçmeli
      const systemPrompt = callArg.messages.find(
        (m: { role: string }) => m.role === 'system'
      )?.content;
      expect(systemPrompt).toContain(lang.native);

      // Arapça (RTL) için ek not eklenmiş olmalı
      if (lang.code === 'ar') {
        expect(systemPrompt).toMatch(/sağdan sola|RTL/i);
      }

      // User message içinde language geçmiyor (sadece system prompt'ta), ama variant geçiyor
      const userMessage = callArg.messages.find(
        (m: { role: string }) => m.role === 'user'
      )?.content;
      expect(userMessage).toContain('Ürün adı:');
      expect(userMessage).toContain('feature A');
      expect(userMessage).toContain('medium');
    });
  }

  it('different languages produce different system prompts', async () => {
    await generateProductDescription(
      {
        productName: 'Test',
        features: ['x'],
        variant: 'short',
        language: 'en',
      },
      ctx
    );
    const enSystem = openaiCreateMock.mock.calls[0][0].messages.find(
      (m: { role: string }) => m.role === 'system'
    )?.content;

    openaiCreateMock.mockClear();

    await generateProductDescription(
      {
        productName: 'Test',
        features: ['x'],
        variant: 'short',
        language: 'de',
      },
      ctx
    );
    const deSystem = openaiCreateMock.mock.calls[0][0].messages.find(
      (m: { role: string }) => m.role === 'system'
    )?.content;

    expect(enSystem).not.toBe(deSystem);
    expect(enSystem).toContain('English');
    expect(deSystem).toContain('Deutsch');
  });

  it('uses correct max_tokens per length variant', async () => {
    await generateProductDescription(
      { productName: 'A', features: ['f'], variant: 'short', language: 'en' },
      ctx
    );
    expect(openaiCreateMock.mock.calls[0][0].max_tokens).toBe(600);

    openaiCreateMock.mockClear();
    await generateProductDescription(
      { productName: 'A', features: ['f'], variant: 'long', language: 'en' },
      ctx
    );
    expect(openaiCreateMock.mock.calls[0][0].max_tokens).toBe(3000);
  });
});

describe('generateProductDescription — SEO keyword injection', () => {
  it('includes SEO keywords in system prompt when provided', async () => {
    await generateProductDescription(
      {
        productName: 'Akıllı Telefon',
        features: ['5G', '128GB'],
        variant: 'medium',
        language: 'tr',
        keywords: ['en iyi telefon', '5G telefon', 'uzun pil ömrü'],
      },
      ctx
    );

    const systemPrompt = openaiCreateMock.mock.calls[0][0].messages.find(
      (m: { role: string }) => m.role === 'system'
    )?.content;
    expect(systemPrompt).toContain('en iyi telefon');
    expect(systemPrompt).toContain('5G telefon');
    expect(systemPrompt).toContain('uzun pil ömrü');
    expect(systemPrompt).toMatch(/anahtar kelime/i);
    expect(systemPrompt).toMatch(/H1|H2/i); // başlıkta geçmesi gerektiği

    // User message'da da keywords tekrarlanıyor
    const userMessage = openaiCreateMock.mock.calls[0][0].messages.find(
      (m: { role: string }) => m.role === 'user'
    )?.content;
    expect(userMessage).toContain('SEO anahtar kelimeler');
    expect(userMessage).toContain('en iyi telefon');
  });

  it('omits SEO keyword instruction when keywords not provided', async () => {
    await generateProductDescription(
      {
        productName: 'Ürün',
        features: ['f'],
        variant: 'short',
        language: 'tr',
      },
      ctx
    );

    const systemPrompt = openaiCreateMock.mock.calls[0][0].messages.find(
      (m: { role: string }) => m.role === 'system'
    )?.content;
    expect(systemPrompt).not.toMatch(/anahtar kelime yoğunluğu/i);
  });

  it('includes category and targetAudience in user message', async () => {
    await generateProductDescription(
      {
        productName: 'P',
        features: ['f'],
        variant: 'medium',
        language: 'tr',
        category: 'Elektronik',
        targetAudience: 'Geliştiriciler',
        existingShortDescription: 'Mevcut kısa açıklama',
      },
      ctx
    );

    const userMessage = openaiCreateMock.mock.calls[0][0].messages.find(
      (m: { role: string }) => m.role === 'user'
    )?.content;
    expect(userMessage).toContain('Kategori: Elektronik');
    expect(userMessage).toContain('Hedef kitle: Geliştiriciler');
    expect(userMessage).toContain('Mevcut kısa açıklama:');
  });
});

describe('Brand Voice integration (applyBrandVoice)', () => {
  it('injects learnedPatterns into base prompt (pure function)', () => {
    const brandVoice = {
      learnedPatterns: {
        tone: 'luxurious',
        vocabulary: ['premium', 'exclusive', 'elegant'],
        sentenceLength: 'long' as const,
        ctaStyle: 'storytelling',
        examples: [
          'Bu ürün, seçkin müşterilerimizin beklentilerini aşmak için tasarlandı.',
          'Zarif detaylar ve üstün işçilik bir arada.',
        ],
      },
    };

    const basePrompt = 'Bu ürün için açıklama yaz.';
    const result = applyBrandVoice(brandVoice, basePrompt);

    // Ton, sentence length, CTA inject edildi
    expect(result).toContain('Ton: luxurious');
    expect(result).toContain('Cumle uzunlugu: long');
    expect(result).toContain('CTA yaklasimi: storytelling');

    // Vocabulary inject edildi
    expect(result).toContain('TERCIH EDILEN KELIME DAGARCIGI');
    expect(result).toContain('premium, exclusive, elegant');

    // Examples (few-shot) inject edildi
    expect(result).toContain('ORNEK TON');
    expect(result).toContain('Bu ürün, seçkin müşterilerimizin beklentilerini aşmak için tasarlandı.');
    expect(result).toContain('Zarif detaylar ve üstün işçilik bir arada.');

    // Base prompt sonda
    expect(result).toContain('ASAGIDAKI GOREVI BU KURALLARA UYGUN YAZ');
    expect(result).toContain(basePrompt);
  });

  it('returns base prompt unchanged when brand voice is null', () => {
    expect(applyBrandVoice(null, 'task')).toBe('task');
  });

  it('returned prompt can be composed with the AI service flow (no throw)', async () => {
    const brandVoice = {
      learnedPatterns: {
        tone: 'friendly',
        vocabulary: ['kolay', 'hızlı'],
        sentenceLength: 'short' as const,
        ctaStyle: 'direct',
        examples: ['Sade ve kullanışlı.', 'Hızlı çözüm.'],
      },
    };

    // Simulate: generation katmanında applyBrandVoice → AI service
    const enhancedPrompt = applyBrandVoice(
      brandVoice,
      'Ürün için 2 cümle yaz.'
    );

    // enhancedPrompt'u kullanarak generate çağrısı yapılabilir
    // (gerçek entegrasyon api/saas/ai/describe/route.ts'te yapılıyor)
    expect(enhancedPrompt.length).toBeGreaterThan('Ürün için 2 cümle yaz.'.length);
    expect(enhancedPrompt).toContain('Ürün için 2 cümle yaz.');
  });
});