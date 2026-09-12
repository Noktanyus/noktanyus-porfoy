/**
 * @file Brand Voice Service — Unit Tests (Phase 2 A.1)
 * @description
 *   - trainBrandVoice: extractPatternsWithAI → DB insert
 *   - applyBrandVoice: base prompt injection
 *   - list/get/update/delete (CRUD + workspace isolation)
 *
 *   AI client ve prisma mocklanır; gerçek OpenAI call yapılmaz (vitest.setup.ts
 *   zaten `openai` paketini mockluyor, ayrıca brand-voice service AI
 *   konfigüre değilse default patterns döndürür).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mock'lar (module import'tan önce) ---

vi.mock('@/lib/prisma', () => ({
  prisma: {
    brandVoice: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    aiUsage: {
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

vi.mock('@/lib/ai-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai-client')>();
  return {
    ...actual,
    isAiConfigured: vi.fn(() => false),
    getActiveModel: vi.fn(() => 'mock'),
    getActiveProviderDisplayName: vi.fn(() => 'mock'),
    getAiClient: vi.fn(),
  };
});

import { prisma } from '@/lib/prisma';
import { consumeAiQuota } from '@/lib/planGate';
import { isAiConfigured } from '@/lib/ai-client';
import { logAudit } from '@/lib/audit';
import {
  applyBrandVoice,
  brandVoiceService,
  extractPatternsWithAI,
} from '../service';
import type { TrainSample, LearnedPatterns } from '../schemas';

const ctx = {
  userId: 'user-bv-1',
  userEmail: 'bv@example.com',
  ipAddress: '127.0.0.1',
  userAgent: 'vitest',
};

const baseSamples: TrainSample[] = [
  {
    title: 'Profesyonel Aydınlatma Seti',
    features: ['Stüdyo kalitesinde ışık', 'Tripod dahil'],
    generatedDescription:
      'Bu aydınlatma seti profesyonel stüdyo kullanımı için titizlikle tasarlanmıştır. Kalite ve güvenilirlik bir arada.',
    rating: 5,
  },
  {
    title: 'Hassas Ölçüm Cihazı',
    features: ['±0.01 hassasiyet', 'USB çıkış'],
    generatedDescription:
      'Hassas ölçüm cihazımız profesyonel laboratuvar ihtiyaçlarını karşılamak üzere tasarlanmıştır.',
    rating: 4,
  },
  {
    title: 'Ergonomik Çalışma Koltuğu',
    features: ['Bel desteği', 'Yükseklik ayarı'],
    generatedDescription:
      'Ergonomik tasarımıyla uzun çalışma saatlerinizde konfor sunar. Profesyonel kullanıcılar için ideal.',
    rating: 5,
  },
];

const fakeLearnedPatterns: LearnedPatterns = {
  tone: 'professional',
  vocabulary: ['kalite', 'profesyonel', 'güvenilir'],
  sentenceLength: 'medium',
  ctaStyle: 'soft',
  examples: [
    'Bu ürün profesyonel kullanıcılar için titizlikle tasarlanmıştır.',
    'Kalite ve güvenilirlik bir arada.',
  ],
};

const mockPrisma = prisma as unknown as {
  brandVoice: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const mockConsumeAiQuota = consumeAiQuota as unknown as ReturnType<typeof vi.fn>;
const mockIsAiConfigured = isAiConfigured as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  // Default: AI konfigüre DEĞİL → default patterns + quota consume YOK
  mockIsAiConfigured.mockReturnValue(false);
});

describe('extractPatternsWithAI (mock fallback)', () => {
  it('returns DEFAULT_LEARNED_PATTERNS when AI not configured', async () => {
    mockIsAiConfigured.mockReturnValue(false);
    const result = await extractPatternsWithAI(baseSamples);
    expect(result.tone).toBeTruthy();
    expect(result.vocabulary.length).toBeGreaterThan(0);
    expect(['short', 'medium', 'long']).toContain(result.sentenceLength);
    expect(result.examples.length).toBeGreaterThanOrEqual(2);
  });

  it('still returns valid LearnedPatterns shape even when given 0 samples', async () => {
    mockIsAiConfigured.mockReturnValue(false);
    const result = await extractPatternsWithAI([]);
    expect(result.tone).toBeTruthy();
    expect(Array.isArray(result.vocabulary)).toBe(true);
  });
});

describe('trainBrandVoice', () => {
  it('inserts a new brand voice row (AI not configured → default patterns, no quota)', async () => {
    mockIsAiConfigured.mockReturnValue(false);
    mockPrisma.brandVoice.findFirst.mockResolvedValue(null); // no duplicate
    const createdRow = {
      id: 'bv-1',
      workspaceId: 'ws-1',
      name: 'Profesyonel Ton',
      description: null,
      model: 'mock',
      trainedAt: new Date('2026-01-01'),
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      sampleInputs: baseSamples,
      learnedPatterns: {
        tone: 'professional',
        vocabulary: ['kalite', 'profesyonel'],
        sentenceLength: 'medium',
        ctaStyle: 'soft',
        examples: ['Örnek 1', 'Örnek 2'],
      },
    };
    mockPrisma.brandVoice.create.mockResolvedValue(createdRow);

    const result = await brandVoiceService.trainBrandVoice(
      'ws-1',
      {
        name: 'Profesyonel Ton',
        description: 'Marka için profesyonel ton',
        samples: baseSamples,
      },
      ctx
    );

    expect(result.id).toBe('bv-1');
    expect(result.workspaceId).toBe('ws-1');
    expect(result.name).toBe('Profesyonel Ton');
    expect(result.sampleCount).toBe(baseSamples.length);
    expect(result.patterns?.tone).toBe('professional');

    // Default AI modda quota consume edilmemeli
    expect(mockConsumeAiQuota).not.toHaveBeenCalled();

    // create çağrısı workspace + samples ile yapılmalı
    expect(mockPrisma.brandVoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          name: 'Profesyonel Ton',
          model: 'mock',
        }),
      })
    );

    // Audit log fire-and-forget çağrılmalı
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AI_GENERATE',
        resource: 'brand_voice',
        resourceId: 'bv-1',
      })
    );
  });

  it('throws when name already exists in workspace', async () => {
    mockPrisma.brandVoice.findFirst.mockResolvedValue({
      id: 'existing',
      workspaceId: 'ws-1',
      name: 'Profesyonel Ton',
    });

    await expect(
      brandVoiceService.trainBrandVoice(
        'ws-1',
        { name: 'Profesyonel Ton', samples: baseSamples },
        ctx
      )
    ).rejects.toThrow(/zaten mevcut/);

    expect(mockPrisma.brandVoice.create).not.toHaveBeenCalled();
  });
});

describe('applyBrandVoice', () => {
  it('returns base prompt unchanged when brandVoice is null', () => {
    const out = applyBrandVoice(null, 'Ürün açıklaması üret.');
    expect(out).toBe('Ürün açıklaması üret.');
  });

  it('returns base prompt when learnedPatterns fail schema validation', () => {
    const out = applyBrandVoice(
      { learnedPatterns: { tone: 'invalid' } }, // sentenceLength eksik
      'Görev'
    );
    expect(out).toBe('Görev');
  });

  it('injects tone + sentenceLength + ctaStyle rules into base prompt', () => {
    const out = applyBrandVoice(
      { learnedPatterns: fakeLearnedPatterns },
      'Bu ürün için açıklama yaz.'
    );
    expect(out).toContain('MARKA SESI KURALLARI');
    expect(out).toContain('Ton: professional');
    expect(out).toContain('Cumle uzunlugu: medium');
    expect(out).toContain('CTA yaklasimi: soft');
    expect(out).toContain('ASAGIDAKI GOREVI BU KURALLARA UYGUN YAZ');
    expect(out).toContain('Bu ürün için açıklama yaz.');
  });

  it('injects vocabulary list when present', () => {
    const out = applyBrandVoice(
      { learnedPatterns: fakeLearnedPatterns },
      'base'
    );
    expect(out).toContain('TERCIH EDILEN KELIME DAGARCIGI');
    expect(out).toContain('kalite, profesyonel, güvenilir');
  });

  it('injects examples as few-shot block', () => {
    const out = applyBrandVoice(
      { learnedPatterns: fakeLearnedPatterns },
      'base'
    );
    expect(out).toContain('ORNEK TON');
    expect(out).toContain('- Bu ürün profesyonel kullanıcılar için titizlikle tasarlanmıştır.');
  });
});

describe('listBrandVoices', () => {
  it('returns rows mapped via toResponse (scoped to workspaceId)', async () => {
    const rowA = {
      id: 'bv-a',
      workspaceId: 'ws-1',
      name: 'A',
      description: null,
      model: 'mock',
      trainedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      sampleInputs: baseSamples,
      learnedPatterns: fakeLearnedPatterns,
    };
    const rowB = { ...rowA, id: 'bv-b', name: 'B' };
    mockPrisma.brandVoice.findMany.mockResolvedValue([rowA, rowB]);

    const result = await brandVoiceService.listBrandVoices('ws-1');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('bv-a');
    expect(result[0].sampleCount).toBe(baseSamples.length);
    expect(mockPrisma.brandVoice.findMany).toHaveBeenCalledWith({
      where: { workspaceId: 'ws-1' },
      orderBy: { updatedAt: 'desc' },
    });
  });
});

describe('getBrandVoice', () => {
  it('returns single brand voice within workspace', async () => {
    const row = {
      id: 'bv-1',
      workspaceId: 'ws-1',
      name: 'A',
      description: null,
      model: 'mock',
      trainedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      sampleInputs: baseSamples,
      learnedPatterns: fakeLearnedPatterns,
    };
    mockPrisma.brandVoice.findFirst.mockResolvedValue(row);

    const result = await brandVoiceService.getBrandVoice('ws-1', 'bv-1');
    expect(result?.id).toBe('bv-1');
    expect(mockPrisma.brandVoice.findFirst).toHaveBeenCalledWith({
      where: { id: 'bv-1', workspaceId: 'ws-1' },
    });
  });

  it('returns null when not found in workspace (workspace isolation)', async () => {
    mockPrisma.brandVoice.findFirst.mockResolvedValue(null);
    const result = await brandVoiceService.getBrandVoice('ws-2', 'bv-x');
    expect(result).toBeNull();
    // Doğrulama: findFirst her iki alanı birden içeren where ile çağrılır
    expect(mockPrisma.brandVoice.findFirst).toHaveBeenCalledWith({
      where: { id: 'bv-x', workspaceId: 'ws-2' },
    });
  });
});

describe('updateBrandVoice', () => {
  it('updates description only (no retraining, no quota)', async () => {
    const existing = {
      id: 'bv-1',
      workspaceId: 'ws-1',
      name: 'A',
      description: null,
      model: 'mock',
      sampleInputs: baseSamples,
      learnedPatterns: fakeLearnedPatterns,
      trainedAt: new Date(),
    };
    mockPrisma.brandVoice.findFirst.mockResolvedValue(existing);
    mockPrisma.brandVoice.update.mockResolvedValue({
      ...existing,
      description: 'Yeni açıklama',
    });

    const result = await brandVoiceService.updateBrandVoice(
      'ws-1',
      'bv-1',
      { description: 'Yeni açıklama' },
      ctx
    );
    expect(result?.description).toBe('Yeni açıklama');
    expect(mockConsumeAiQuota).not.toHaveBeenCalled();
    expect(mockPrisma.brandVoice.update).toHaveBeenCalledWith({
      where: { id: 'bv-1' },
      data: expect.objectContaining({ description: 'Yeni açıklama' }),
    });
  });

  it('returns null when brand voice not found in workspace', async () => {
    mockPrisma.brandVoice.findFirst.mockResolvedValue(null);
    const result = await brandVoiceService.updateBrandVoice(
      'ws-1',
      'bv-missing',
      { description: 'x' },
      ctx
    );
    expect(result).toBeNull();
    expect(mockPrisma.brandVoice.update).not.toHaveBeenCalled();
  });

  it('re-trains when samples are provided (mock AI off → default patterns, no quota consume)', async () => {
    const existing = {
      id: 'bv-1',
      workspaceId: 'ws-1',
      name: 'A',
      description: null,
      model: 'mock',
      sampleInputs: baseSamples,
      learnedPatterns: fakeLearnedPatterns,
      trainedAt: new Date(),
    };
    mockPrisma.brandVoice.findFirst.mockResolvedValue(existing);
    mockPrisma.brandVoice.update.mockResolvedValue(existing);

    await brandVoiceService.updateBrandVoice(
      'ws-1',
      'bv-1',
      { samples: baseSamples },
      ctx
    );

    // AI off → quota consume edilmemeli
    expect(mockConsumeAiQuota).not.toHaveBeenCalled();
    // sampleInputs + learnedPatterns + trainedAt yenilenmiş olmalı
    const updateArg = mockPrisma.brandVoice.update.mock.calls[0][0];
    expect(updateArg.data).toHaveProperty('sampleInputs');
    expect(updateArg.data).toHaveProperty('learnedPatterns');
    expect(updateArg.data).toHaveProperty('trainedAt');
  });
});

describe('deleteBrandVoice', () => {
  it('deletes when row exists in workspace', async () => {
    mockPrisma.brandVoice.findFirst.mockResolvedValue({
      id: 'bv-1',
      name: 'A',
    });
    mockPrisma.brandVoice.delete.mockResolvedValue({});

    const ok = await brandVoiceService.deleteBrandVoice('ws-1', 'bv-1', ctx);
    expect(ok).toBe(true);
    expect(mockPrisma.brandVoice.delete).toHaveBeenCalledWith({ where: { id: 'bv-1' } });
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DELETE', resourceId: 'bv-1' })
    );
  });

  it('returns false when brand voice not in workspace', async () => {
    mockPrisma.brandVoice.findFirst.mockResolvedValue(null);
    const ok = await brandVoiceService.deleteBrandVoice('ws-1', 'bv-missing', ctx);
    expect(ok).toBe(false);
    expect(mockPrisma.brandVoice.delete).not.toHaveBeenCalled();
  });
});