/**
 * @file AI Bulk Generation Service — Unit Tests (Phase 2 A.2)
 * @description
 *   - parseCsv: valid CSV → rows, invalid → invalidRows
 *   - processBulkGeneration: per-row generate + quota check + result save
 *   - startBulkGeneration: job create + queue enqueue
 *   - getJobStatus, exportResultsCsv
 *
 *   Prisma + ai-service + queue + email mocklanır. CSV dosyaları tmp
 *   dizinine yazılır ve mutlak path ile parse edilir.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// --- Mock'lar (module import'tan önce) ---

vi.mock('@/lib/prisma', () => ({
  prisma: {
    generationJob: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    generationResult: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    brandVoice: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    aiUsage: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { totalTokens: 0 } }),
      count: vi.fn().mockResolvedValue(0),
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

vi.mock('@/lib/planGate', () => ({
  checkAiQuota: vi.fn(async () => ({ allowed: true, reason: undefined })),
  consumeAiQuota: vi.fn(async () => undefined),
}));

vi.mock('@/lib/ai-client', () => ({
  isAiConfigured: vi.fn(() => false),
  getActiveModel: vi.fn(() => 'mock'),
  getActiveProviderDisplayName: vi.fn(() => 'mock'),
  getAiClient: vi.fn(),
  MAX_GENERATION_TOKENS: 4096,
}));

const aiGenerateMock = vi.hoisted(() => vi.fn());

vi.mock('@/modules/ai/service', () => ({
  aiService: {
    generateProductDescription: aiGenerateMock,
  },
}));

// queue.add no-op (handler register edilmediği için job drop edilir, ama çağrılır)
vi.mock('@/lib/queue', () => ({
  Jobs: { AiBulkGenerate: 'ai.bulk.generate' },
  queue: {
    add: vi.fn(async () => undefined),
    register: vi.fn(),
    driver: 'memory',
    close: vi.fn(async () => undefined),
  },
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
}));

import { prisma } from '@/lib/prisma';
import { checkAiQuota } from '@/lib/planGate';
import { queue } from '@/lib/queue';
import { aiBulkService } from '../service';
import type { CsvRow } from '../schemas';

const mockPrisma = prisma as unknown as {
  generationJob: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  generationResult: { create: ReturnType<typeof vi.fn> };
  brandVoice: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
};

const mockCheckAiQuota = checkAiQuota as unknown as ReturnType<typeof vi.fn>;
const mockQueueAdd = queue.add as unknown as ReturnType<typeof vi.fn>;

let tmpDir = '';
let createdFiles: string[] = [];

beforeEach(async () => {
  vi.clearAllMocks();
  // Default checkAiQuota izin verir
  mockCheckAiQuota.mockResolvedValue({ allowed: true, reason: undefined });
  // Default AI generate success
  aiGenerateMock.mockResolvedValue({
    shortDescription: 'Mock short',
    description: 'Mock description content for product.',
    suggestedTags: ['mock', 'ai'],
    tokensUsed: { input: 5, output: 10, total: 15 },
    mock: true,
  });
  // tmp dir oluştur
  if (!tmpDir) {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-bulk-test-'));
  }
  createdFiles = [];
});

async function writeCsv(name: string, contents: string): Promise<string> {
  const filePath = path.join(tmpDir, name);
  await fs.writeFile(filePath, contents, 'utf-8');
  createdFiles.push(filePath);
  return filePath;
}

// ============================================================================
// parseCsv
// ============================================================================

describe('parseCsv', () => {
  it('parses valid CSV rows (header + N rows)', async () => {
    const csvPath = await writeCsv(
      'valid.csv',
      [
        'title,features,category',
        'Product A,"f1;f2;f3",electronics',
        'Product B,"f4;f5",home',
      ].join('\n')
    );

    const { rows, invalidRows } = await aiBulkService.parseCsv(csvPath);
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe('Product A');
    expect(rows[0].features).toEqual(['f1', 'f2', 'f3']);
    expect(rows[0].category).toBe('electronics');
    expect(invalidRows).toHaveLength(0);
  });

  it('extracts invalid rows when title or features missing', async () => {
    const csvPath = await writeCsv(
      'partial.csv',
      [
        'title,features,category',
        'Product A,"f1;f2",cat1',
        ',,cat2', // missing title + features
        'Product C,"only-feature"', // missing features separator
      ].join('\n')
    );

    const { rows, invalidRows } = await aiBulkService.parseCsv(csvPath);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(invalidRows.length).toBeGreaterThanOrEqual(1);
    // Invalid row index 1-based + raw data
    for (const inv of invalidRows) {
      expect(inv.index).toBeGreaterThan(0);
      expect(typeof inv.reason).toBe('string');
    }
  });

  it('supports semicolon OR pipe as feature separator', async () => {
    const csvPath = await writeCsv(
      'separators.csv',
      ['title,features', 'Product X,"a|b|c"'].join('\n')
    );
    const { rows, invalidRows } = await aiBulkService.parseCsv(csvPath);
    expect(rows).toHaveLength(1);
    expect(rows[0].features).toEqual(['a', 'b', 'c']);
    expect(invalidRows).toHaveLength(0);
  });

  it('handles Turkish alt-key headers (baslik, ozellikler)', async () => {
    const csvPath = await writeCsv(
      'tr-headers.csv',
      [
        'baslik,ozellikler,kategori',
        'Ürün A,"özellik 1;özellik 2",elektronik',
      ].join('\n')
    );
    const { rows } = await aiBulkService.parseCsv(csvPath);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Ürün A');
    expect(rows[0].category).toBe('elektronik');
  });
});

// ============================================================================
// startBulkGeneration
// ============================================================================

describe('startBulkGeneration', () => {
  it('creates a GenerationJob and enqueues to queue', async () => {
    const csvPath = await writeCsv(
      'job.csv',
      ['title,features', 'P1,"f1"', 'P2,"f2"'].join('\n')
    );

    mockPrisma.brandVoice.findFirst.mockResolvedValue(null); // no brand voice check fails
    mockPrisma.generationJob.create.mockResolvedValue({
      id: 'job-1',
      workspaceId: 'ws-1',
      totalRows: 2,
    });

    const result = await aiBulkService.startBulkGeneration({
      workspaceId: 'ws-1',
      userId: 'u-1',
      input: {
        csvPath,
        language: 'tr',
        length: 'medium',
      },
    });

    expect(result.jobId).toBe('job-1');
    expect(result.totalRows).toBe(2);

    // Job create çağrıldı
    expect(mockPrisma.generationJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          userId: 'u-1',
          status: 'pending',
          csvPath,
          totalRows: 2,
        }),
      })
    );

    // Queue'ya eklendi
    expect(mockQueueAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ai-bulk-job-1',
        name: 'ai.bulk.generate',
        data: { jobId: 'job-1', userId: 'u-1' },
      })
    );
  });

  it('rejects when brandVoiceId does not belong to workspace', async () => {
    const csvPath = await writeCsv('x.csv', 'title,features\nP,"f"');
    mockPrisma.brandVoice.findFirst.mockResolvedValue(null); // not found in workspace

    await expect(
      aiBulkService.startBulkGeneration({
        workspaceId: 'ws-1',
        userId: 'u-1',
        input: { csvPath, brandVoiceId: 'bv-x', language: 'tr', length: 'medium' },
      })
    ).rejects.toThrow(/Brand voice/);

    expect(mockPrisma.generationJob.create).not.toHaveBeenCalled();
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });

  it('rejects when CSV has no valid rows', async () => {
    const csvPath = await writeCsv('empty.csv', 'title,features\n,,');
    await expect(
      aiBulkService.startBulkGeneration({
        workspaceId: 'ws-1',
        userId: 'u-1',
        input: { csvPath, language: 'tr', length: 'medium' },
      })
    ).rejects.toThrow(/geçerli satır/);
  });

  it('throws QUOTA_EXCEEDED when quota check fails', async () => {
    // title >= 2 karakter gerekli (CsvRowSchema)
    const csvPath = await writeCsv('q.csv', 'title,features\nPX,"fa;fb"');
    mockCheckAiQuota.mockImplementationOnce(async () => ({
      allowed: false,
      reason: 'Token limit doldu',
    }));

    let caught: unknown = null;
    try {
      await aiBulkService.startBulkGeneration({
        workspaceId: 'ws-1',
        userId: 'u-1',
        input: { csvPath, language: 'tr', length: 'medium' },
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).not.toBeNull();
    expect((caught as { code?: string }).code).toBe('QUOTA_EXCEEDED');
    expect((caught as Error).message).toMatch(/Token limit/);
    expect(mockPrisma.generationJob.create).not.toHaveBeenCalled();
  });
});

// ============================================================================
// processBulkGeneration
// ============================================================================

describe('processBulkGeneration', () => {
  it('processes rows, writes results, updates counters', async () => {
    const csvPath = await writeCsv(
      'proc.csv',
      ['title,features', 'P1,"f1"', 'P2,"f2"'].join('\n')
    );

    const job = {
      id: 'job-1',
      workspaceId: 'ws-1',
      userId: 'u-1',
      status: 'pending',
      csvPath,
      brandVoiceId: null,
      options: { language: 'tr', length: 'medium', keywords: [] },
      user: { email: 'u@example.com', name: 'User' },
      brandVoice: null,
      totalRows: 0,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
    };
    mockPrisma.generationJob.findUnique.mockResolvedValue(job);
    mockPrisma.generationJob.update.mockResolvedValue(job);
    mockPrisma.generationResult.create.mockResolvedValue({});

    const result = await aiBulkService.processBulkGeneration('job-1', {
      bypassRateLimit: true,
    });

    expect(result.totalRows).toBe(2);
    expect(result.successfulRows).toBe(2);
    expect(result.failedRows).toBe(0);
    expect(result.skippedRows).toBe(0);

    // Her satır için result.create + progress update yapılmış olmalı
    expect(mockPrisma.generationResult.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.generationJob.update).toHaveBeenCalled();
  });

  it('returns early when job already completed', async () => {
    const csvPath = await writeCsv('done.csv', 'title,features\nP,"f"');
    mockPrisma.generationJob.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'completed',
      totalRows: 5,
      successfulRows: 5,
      failedRows: 0,
      csvPath,
      options: {},
      user: { email: null, name: null },
      brandVoice: null,
      userId: 'u-1',
      brandVoiceId: null,
      processedRows: 5,
    });

    const result = await aiBulkService.processBulkGeneration('job-1', {
      bypassRateLimit: true,
    });
    expect(result.successfulRows).toBe(5);
    expect(mockPrisma.generationResult.create).not.toHaveBeenCalled();
  });

  it('marks rows as skipped when quota exceeded (recheck)', async () => {
    const csvPath = await writeCsv(
      'skip.csv',
      ['title,features', 'P1,"f1"', 'P2,"f2"'].join('\n')
    );
    const job = {
      id: 'job-1',
      workspaceId: 'ws-1',
      userId: 'u-1',
      status: 'pending',
      csvPath,
      brandVoiceId: null,
      options: { language: 'tr', length: 'medium' },
      user: { email: null, name: null },
      brandVoice: null,
      totalRows: 0,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
    };
    mockPrisma.generationJob.findUnique.mockResolvedValue(job);
    mockPrisma.generationJob.update.mockResolvedValue(job);
    // processBulkGeneration içindeki TEK checkAiQuota call → denied
    mockCheckAiQuota.mockResolvedValueOnce({
      allowed: false,
      reason: 'Token limit doldu',
    });
    mockPrisma.generationResult.create.mockResolvedValue({});

    const result = await aiBulkService.processBulkGeneration('job-1', {
      bypassRateLimit: true,
    });

    expect(result.skippedRows).toBe(2);
    expect(result.successfulRows).toBe(0);
    // Result.create skipped için errorMessage ile çağrılmış olmalı
    const errorCalls = mockPrisma.generationResult.create.mock.calls.filter(
      (call) => {
        const args = call as unknown as [{ data: { errorMessage?: string } }];
        return Boolean(args[0]?.data?.errorMessage?.includes('Quota aşıldı'));
      }
    );
    expect(errorCalls.length).toBe(2);
  });

  it('records failed rows without aborting the job (resilience)', async () => {
    const csvPath = await writeCsv(
      'fail.csv',
      ['title,features', 'P1,"f1"', 'P2,"f2"'].join('\n')
    );
    const job = {
      id: 'job-1',
      workspaceId: 'ws-1',
      userId: 'u-1',
      status: 'pending',
      csvPath,
      brandVoiceId: null,
      options: { language: 'tr', length: 'medium' },
      user: { email: null, name: null },
      brandVoice: null,
      totalRows: 0,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
    };
    mockPrisma.generationJob.findUnique.mockResolvedValue(job);
    mockPrisma.generationJob.update.mockResolvedValue(job);

    // İlk satır başarısız, ikinci başarılı
    aiGenerateMock.mockRejectedValueOnce(new Error('AI provider down'));
    mockPrisma.generationResult.create.mockResolvedValue({});

    const result = await aiBulkService.processBulkGeneration('job-1', {
      bypassRateLimit: true,
    });

    expect(result.failedRows).toBe(1);
    expect(result.successfulRows).toBe(1);
    expect(result.errors[0].error).toContain('AI provider down');
  });
});

// ============================================================================
// getJobStatus
// ============================================================================

describe('getJobStatus', () => {
  it('returns job with results and brand voice (workspace-scoped)', async () => {
    mockPrisma.generationJob.findFirst.mockResolvedValue({
      id: 'job-1',
      workspaceId: 'ws-1',
      brandVoice: { id: 'bv-1', name: 'A' },
      results: [{ rowIndex: 0 }, { rowIndex: 1 }],
    });

    const result = await aiBulkService.getJobStatus('job-1', 'ws-1');
    expect(result?.id).toBe('job-1');
    expect(result?.results).toHaveLength(2);
    expect(result?.brandVoice?.name).toBe('A');
    expect(mockPrisma.generationJob.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1', workspaceId: 'ws-1' },
      })
    );
  });

  it('returns null when job not found or not in workspace', async () => {
    mockPrisma.generationJob.findFirst.mockResolvedValue(null);
    const result = await aiBulkService.getJobStatus('job-x', 'ws-1');
    expect(result).toBeNull();
  });
});

// ============================================================================
// exportResultsCsv
// ============================================================================

describe('exportResultsCsv', () => {
  it('writes CSV to local fallback path and returns public URL', async () => {
    mockPrisma.generationJob.findUnique.mockResolvedValue({
      id: 'job-1',
      workspaceId: 'ws-1',
      options: { language: 'tr', length: 'medium' },
      results: [
        {
          rowIndex: 0,
          inputTitle: 'P1',
          inputFeatures: 'f1',
          inputData: { category: 'cat1' },
          shortDescription: 'short',
          description: 'long description',
          tags: ['a', 'b'],
          inputTokens: 100,
          outputTokens: 200,
          costCents: 5,
          errorMessage: null,
        },
      ],
    });
    mockPrisma.generationJob.update.mockResolvedValue({});

    const url = await aiBulkService.exportResultsCsv('job-1');
    expect(url).toMatch(/^\/uploads\/ai-bulk-results\//);
    expect(mockPrisma.generationJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1' },
        data: expect.objectContaining({ outputCsvPath: url }),
      })
    );
  });

  it('throws when job does not exist', async () => {
    mockPrisma.generationJob.findUnique.mockResolvedValue(null);
    await expect(aiBulkService.exportResultsCsv('job-missing')).rejects.toThrow(
      /Job bulunamadı/
    );
  });
});