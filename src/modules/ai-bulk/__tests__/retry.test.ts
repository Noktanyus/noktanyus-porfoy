/**
 * @file AI Bulk Retry Policy — Unit Tests (L4 / Phase Async/Compliance)
 * @description
 *   - classifyError: AI_RATE_LIMIT | NETWORK_ERROR | TIMEOUT | VALIDATION
 *   - isRetryableError: retryable vs fatal
 *   - deriveRowState: PENDING → RETRYING / DEAD_LETTER / COMPLETED
 *   - getBackoffMs: 0/1/2 retries + out-of-bounds fallback
 *   - processRowRetry: retryable → RETRYING, fatal → DEAD_LETTER, success → COMPLETED
 *   - manualRetryDeadLetter: resets retryCount + re-enqueues
 *
 * Prisma + queue + email mocklanır.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mock'lar ---

vi.mock('@/lib/prisma', () => ({
  prisma: {
    generationJob: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    generationResult: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    workspace: {
      findFirst: vi.fn(),
    },
    workspaceMember: {
      findFirst: vi.fn(),
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

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
}));

const queueAddMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('@/lib/queue', () => ({
  Jobs: {
    AiBulkGenerate: 'ai.bulk.generate',
    AiBulkRowRetry: 'ai.bulk.row.retry',
    AiBulkGenerateDeadLetter: 'ai.bulk.deadletter',
  },
  queue: {
    add: queueAddMock,
    register: vi.fn(),
    driver: 'memory',
    close: vi.fn(async () => undefined),
  },
}));

vi.mock('@/lib/planGate', () => ({
  checkAiQuota: vi.fn(async () => ({ allowed: true, reason: undefined })),
  consumeAiQuota: vi.fn(),
}));

vi.mock('@/lib/ai-client', () => ({
  isAiConfigured: vi.fn(() => false),
  getActiveModel: vi.fn(() => 'mock'),
}));

import { prisma } from '@/lib/prisma';
import { queue } from '@/lib/queue';
import {
  AI_BULK_ERROR_CODES,
  DEFAULT_RETRY_CONFIG,
  classifyError,
  deriveRowState,
  getBackoffMs,
  getNextRetryAt,
  isRetryableError,
} from '../retryPolicy';
import {
  appendToDeadLetter,
  enqueueDeadLetterNotification,
  enqueueRowRetry,
  manualRetryDeadLetter,
  processRowRetry,
} from '../service';

const mockPrisma = prisma as unknown as {
  generationJob: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  generationResult: {
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  workspace: { findFirst: ReturnType<typeof vi.fn> };
  workspaceMember: { findFirst: ReturnType<typeof vi.fn> };
};

const mockQueueAdd = queue.add as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// classifyError
// ============================================================================

describe('classifyError', () => {
  it('returns AI_RATE_LIMIT for { code: "AI_RATE_LIMIT" }', () => {
    expect(classifyError({ code: 'AI_RATE_LIMIT' })).toBe('AI_RATE_LIMIT');
  });

  it('returns NETWORK_ERROR for { code: "NETWORK_ERROR" }', () => {
    expect(classifyError({ code: 'NETWORK_ERROR' })).toBe('NETWORK_ERROR');
  });

  it('returns TIMEOUT for { code: "TIMEOUT" }', () => {
    expect(classifyError({ code: 'TIMEOUT' })).toBe('TIMEOUT');
  });

  it('returns VALIDATION for { code: "VALIDATION" }', () => {
    expect(classifyError({ code: 'VALIDATION' })).toBe('VALIDATION');
  });

  it('falls back to AI_RATE_LIMIT for "rate limit" in message', () => {
    expect(classifyError(new Error('rate limit exceeded'))).toBe('AI_RATE_LIMIT');
  });

  it('falls back to NETWORK_ERROR for ECONNRESET in message', () => {
    expect(classifyError(new Error('read ECONNRESET'))).toBe('NETWORK_ERROR');
  });

  it('falls back to TIMEOUT for "timeout" in message', () => {
    expect(classifyError(new Error('Request timeout'))).toBe('TIMEOUT');
  });

  it('falls back to VALIDATION for "invalid input" in message', () => {
    expect(classifyError(new Error('invalid input provided'))).toBe('VALIDATION');
  });

  it('returns UNKNOWN for unclassified errors', () => {
    expect(classifyError(new Error('something completely different'))).toBe('UNKNOWN');
  });

  it('returns UNKNOWN for non-Error throws', () => {
    expect(classifyError('plain string error')).toBe('UNKNOWN');
    expect(classifyError(null)).toBe('UNKNOWN');
    expect(classifyError(undefined)).toBe('UNKNOWN');
  });
});

// ============================================================================
// isRetryableError
// ============================================================================

describe('isRetryableError', () => {
  it('AI_RATE_LIMIT is retryable', () => {
    expect(isRetryableError({ code: 'AI_RATE_LIMIT' })).toBe(true);
  });

  it('NETWORK_ERROR is retryable', () => {
    expect(isRetryableError({ code: 'NETWORK_ERROR' })).toBe(true);
  });

  it('TIMEOUT is retryable', () => {
    expect(isRetryableError({ code: 'TIMEOUT' })).toBe(true);
  });

  it('VALIDATION is NOT retryable (fatal)', () => {
    expect(isRetryableError({ code: 'VALIDATION' })).toBe(false);
  });

  it('AUTH is NOT retryable (fatal)', () => {
    expect(isRetryableError({ code: 'AUTH' })).toBe(false);
  });

  it('QUOTA_EXCEEDED is NOT retryable (fatal)', () => {
    expect(isRetryableError({ code: 'QUOTA_EXCEEDED' })).toBe(false);
  });

  it('UNKNOWN is NOT retryable (safe default)', () => {
    expect(isRetryableError(new Error('totally unknown'))).toBe(false);
  });

  it('respects custom config — adds UNKNOWN to retryable list', () => {
    // UNKNOWN'u retryable yapmak için {code: 'UNKNOWN'} şeklinde geçmek gerekir
    // çünkü isRetryableError içindeki UNKNOWN dalı sadece retryable kabul eder.
    const config = {
      ...DEFAULT_RETRY_CONFIG,
      retryableErrors: [...DEFAULT_RETRY_CONFIG.retryableErrors, AI_BULK_ERROR_CODES.UNKNOWN],
    };
    expect(isRetryableError({ code: 'UNKNOWN' }, config)).toBe(true);
  });
});

// ============================================================================
// getBackoffMs
// ============================================================================

describe('getBackoffMs', () => {
  it('returns 1000ms for first retry', () => {
    expect(getBackoffMs(0)).toBe(1000);
  });

  it('returns 5000ms for second retry', () => {
    expect(getBackoffMs(1)).toBe(5000);
  });

  it('returns 30000ms for third retry', () => {
    expect(getBackoffMs(2)).toBe(30000);
  });

  it('caps at last backoff value when out-of-bounds', () => {
    expect(getBackoffMs(5)).toBe(30000);
    expect(getBackoffMs(99)).toBe(30000);
  });

  it('respects custom backoff table', () => {
    const custom = { ...DEFAULT_RETRY_CONFIG, retryBackoffMs: [100, 200, 400, 800] };
    expect(getBackoffMs(0, custom)).toBe(100);
    expect(getBackoffMs(3, custom)).toBe(800);
    expect(getBackoffMs(10, custom)).toBe(800);
  });
});

describe('getNextRetryAt', () => {
  it('returns Date object in the future', () => {
    const before = Date.now();
    const next = getNextRetryAt(0).getTime();
    const after = Date.now();
    expect(next).toBeGreaterThanOrEqual(before + 1000);
    expect(next).toBeLessThanOrEqual(after + 1100);
  });
});

// ============================================================================
// deriveRowState
// ============================================================================

describe('deriveRowState', () => {
  it('null error → COMPLETED', () => {
    expect(deriveRowState({ error: null, retryCount: 0 })).toBe('COMPLETED');
  });

  it('retryable error + retryCount 0 → RETRYING', () => {
    expect(deriveRowState({ error: { code: 'AI_RATE_LIMIT' }, retryCount: 0 })).toBe('RETRYING');
  });

  it('retryable error + retryCount=2 (max=3, next=3 OK) → RETRYING', () => {
    expect(deriveRowState({ error: { code: 'NETWORK_ERROR' }, retryCount: 2 })).toBe('RETRYING');
  });

  it('retryable error + retryCount=3 (next=4 > max=3) → DEAD_LETTER', () => {
    expect(deriveRowState({ error: { code: 'TIMEOUT' }, retryCount: 3 })).toBe('DEAD_LETTER');
  });

  it('fatal error (VALIDATION) → DEAD_LETTER regardless of retryCount', () => {
    expect(deriveRowState({ error: { code: 'VALIDATION' }, retryCount: 0 })).toBe('DEAD_LETTER');
    expect(deriveRowState({ error: { code: 'VALIDATION' }, retryCount: 1 })).toBe('DEAD_LETTER');
  });

  it('fatal error (AUTH) → DEAD_LETTER', () => {
    expect(deriveRowState({ error: { code: 'AUTH' }, retryCount: 0 })).toBe('DEAD_LETTER');
  });

  it('QUOTA_EXCEEDED → DEAD_LETTER', () => {
    expect(deriveRowState({ error: { code: 'QUOTA_EXCEEDED' }, retryCount: 0 })).toBe('DEAD_LETTER');
  });

  it('UNKNOWN error → DEAD_LETTER (safe default)', () => {
    expect(deriveRowState({ error: new Error('weird error'), retryCount: 0 })).toBe('DEAD_LETTER');
  });
});

// ============================================================================
// enqueueRowRetry
// ============================================================================

describe('enqueueRowRetry', () => {
  it('enqueues AiBulkRowRetry job with correct delay', async () => {
    await enqueueRowRetry('job-1', 5, 1000);
    expect(mockQueueAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ai.bulk.row.retry',
        data: { jobId: 'job-1', rowIndex: 5 },
        delay: 1000,
      })
    );
  });

  it('handles zero delay', async () => {
    await enqueueRowRetry('job-1', 0, 0);
    expect(mockQueueAdd).toHaveBeenCalledWith(
      expect.objectContaining({ delay: 0, data: { jobId: 'job-1', rowIndex: 0 } })
    );
  });
});

// ============================================================================
// enqueueDeadLetterNotification
// ============================================================================

describe('enqueueDeadLetterNotification', () => {
  it('enqueues DLQ job when not yet notified', async () => {
    mockPrisma.generationJob.findUnique.mockResolvedValue({
      deadLetterNotifiedAt: null,
    });
    await enqueueDeadLetterNotification('job-1');
    expect(mockQueueAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ai.bulk.deadletter',
        data: { jobId: 'job-1' },
      })
    );
  });

  it('does NOT enqueue when already notified', async () => {
    mockPrisma.generationJob.findUnique.mockResolvedValue({
      deadLetterNotifiedAt: new Date(),
    });
    await enqueueDeadLetterNotification('job-1');
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });
});

// ============================================================================
// appendToDeadLetter
// ============================================================================

describe('appendToDeadLetter', () => {
  it('appends new entry to existing deadLetterRows array', async () => {
    mockPrisma.generationJob.findUnique.mockResolvedValue({
      deadLetterRows: [{ rowIndex: 0, lastError: 'old', failedAt: '2024-01-01', attempts: 3 }],
    });
    mockPrisma.generationJob.update.mockResolvedValue({});

    await appendToDeadLetter('job-1', 5, 'new error', 4);

    expect(mockPrisma.generationJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1' },
        data: {
          deadLetterRows: expect.arrayContaining([
            expect.objectContaining({ rowIndex: 0, lastError: 'old' }),
            expect.objectContaining({ rowIndex: 5, lastError: 'new error', attempts: 4 }),
          ]),
        },
      })
    );
  });

  it('creates initial array if deadLetterRows is null/empty', async () => {
    mockPrisma.generationJob.findUnique.mockResolvedValue({ deadLetterRows: null });
    mockPrisma.generationJob.update.mockResolvedValue({});

    await appendToDeadLetter('job-1', 3, 'fail', 3);

    expect(mockPrisma.generationJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          deadLetterRows: [expect.objectContaining({ rowIndex: 3, lastError: 'fail' })],
        },
      })
    );
  });

  it('replaces existing entry for same rowIndex (no duplicates)', async () => {
    mockPrisma.generationJob.findUnique.mockResolvedValue({
      deadLetterRows: [{ rowIndex: 5, lastError: 'first', failedAt: '2024-01-01', attempts: 2 }],
    });
    mockPrisma.generationJob.update.mockResolvedValue({});

    await appendToDeadLetter('job-1', 5, 'second', 3);

    const updateCall = mockPrisma.generationJob.update.mock.calls[0][0];
    const rows = updateCall.data.deadLetterRows as Array<{ rowIndex: number }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].rowIndex).toBe(5);
  });
});

// ============================================================================
// processRowRetry
// ============================================================================

describe('processRowRetry', () => {
  it('returns SKIPPED when job not found', async () => {
    mockPrisma.generationJob.findUnique.mockResolvedValue(null);
    const result = await processRowRetry('job-1', 0);
    expect(result.status).toBe('SKIPPED');
  });

  it('returns SKIPPED when job already completed', async () => {
    mockPrisma.generationJob.findUnique.mockResolvedValue({ status: 'completed' });
    const result = await processRowRetry('job-1', 0);
    expect(result.status).toBe('SKIPPED');
  });

  it('returns SKIPPED when result not found', async () => {
    mockPrisma.generationJob.findUnique.mockResolvedValue({ status: 'processing' });
    mockPrisma.generationResult.findFirst.mockResolvedValue(null);
    const result = await processRowRetry('job-1', 0);
    expect(result.status).toBe('SKIPPED');
  });

  it('returns SKIPPED when result already COMPLETED', async () => {
    mockPrisma.generationJob.findUnique.mockResolvedValue({ status: 'processing' });
    mockPrisma.generationResult.findFirst.mockResolvedValue({ status: 'COMPLETED' });
    const result = await processRowRetry('job-1', 0);
    expect(result.status).toBe('SKIPPED');
  });
});

// ============================================================================
// manualRetryDeadLetter
// ============================================================================

describe('manualRetryDeadLetter', () => {
  it('throws when job not found or not in workspace', async () => {
    mockPrisma.generationJob.findFirst.mockResolvedValue(null);
    await expect(manualRetryDeadLetter('job-1', 'ws-1')).rejects.toThrow('bulunamadı');
  });

  it('returns 0 when no dead letter rows', async () => {
    mockPrisma.generationJob.findFirst.mockResolvedValue({
      id: 'job-1',
      deadLetterRows: [],
      status: 'completed',
    });
    const result = await manualRetryDeadLetter('job-1', 'ws-1');
    expect(result.retriedCount).toBe(0);
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });

  it('resets retryCount for dead letter rows + re-enqueues each', async () => {
    mockPrisma.generationJob.findFirst.mockResolvedValue({
      id: 'job-1',
      deadLetterRows: [
        { rowIndex: 2, lastError: 'err1', failedAt: '2024-01-01', attempts: 3 },
        { rowIndex: 5, lastError: 'err2', failedAt: '2024-01-01', attempts: 3 },
      ],
      status: 'failed',
    });
    mockPrisma.generationResult.updateMany.mockResolvedValue({ count: 2 });
    mockPrisma.generationJob.update.mockResolvedValue({});

    const result = await manualRetryDeadLetter('job-1', 'ws-1');

    expect(result.retriedCount).toBe(2);

    // retryCount reset
    expect(mockPrisma.generationResult.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobId: 'job-1', status: 'DEAD_LETTER' },
        data: expect.objectContaining({ retryCount: 0, status: 'PENDING' }),
      })
    );

    // Job counters reset
    expect(mockPrisma.generationJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deadLetterRows: [],
          retriesResetCount: { increment: 1 },
          failedRows: 0,
          status: 'pending',
        }),
      })
    );

    // 2 row retry enqueued
    expect(mockQueueAdd).toHaveBeenCalledTimes(2);
    expect(mockQueueAdd).toHaveBeenCalledWith(
      expect.objectContaining({ data: { jobId: 'job-1', rowIndex: 2 }, delay: 0 })
    );
    expect(mockQueueAdd).toHaveBeenCalledWith(
      expect.objectContaining({ data: { jobId: 'job-1', rowIndex: 5 }, delay: 0 })
    );
  });
});
