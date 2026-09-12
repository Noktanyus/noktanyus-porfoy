/**
 * @file VERBİS / KVKK Breach — Unit Tests (L8)
 * @description
 *   - submitBreachNotification: VERBİS_NOT_CONFIGURED + HTTP success path
 *   - KVKK 72h deadline detection (computeMadde12Deadline)
 *   - notifyAffectedUsers: sends emails to all workspace members
 *   - Auto-escalation: processCheckBreaches escalates >60h unresolved HIGH/CRITICAL
 *   - maybeAutoSubmitToVerbis: severity-based decision matrix
 *
 * Prisma + queue + email + verbis HTTP fetch mocklanır.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/lib/prisma', () => ({
  prisma: {
    dataBreachIncident: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workspace: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    complianceSite: {
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

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

const mockSendEmail = vi.hoisted(() =>
  vi.fn(async () => ({ success: true, messageId: 'mock-1' }))
);
vi.mock('@/lib/email', () => ({
  sendEmail: () => mockSendEmail(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { prisma } from '@/lib/prisma';
import {
  computeMadde12Deadline,
  isDeadlineApproaching,
  shouldAutoEscalateToVerbis,
  submitBreachNotification,
  isVerbisConfigured,
} from '@/lib/verbis';
import {
  maybeAutoSubmitToVerbis,
  notifyAffectedUsers,
  processCheckBreaches,
} from '../breachDetector';

const mockPrisma = prisma as unknown as {
  dataBreachIncident: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  workspace: { findFirst: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  workspaceMember: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  user: { findUnique: ReturnType<typeof vi.fn> };
  complianceSite: { findFirst: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: VERBİS not configured
  delete process.env.VERBIS_API_URL;
  delete process.env.VERBIS_API_KEY;
  delete process.env.VERBIS_API_SECRET;
});

// ============================================================================
// VERBİS env config tests
// ============================================================================

describe('isVerbisConfigured', () => {
  it('returns false when env vars are missing', () => {
    delete process.env.VERBIS_API_URL;
    delete process.env.VERBIS_API_KEY;
    delete process.env.VERBIS_API_SECRET;
    expect(isVerbisConfigured()).toBe(false);
  });

  it('returns true when all env vars are set', () => {
    process.env.VERBIS_API_URL = 'https://verbis.example.com/api';
    process.env.VERBIS_API_KEY = 'key-123';
    process.env.VERBIS_API_SECRET = 'secret-456';
    expect(isVerbisConfigured()).toBe(true);
  });
});

// ============================================================================
// VERBİS helpers
// ============================================================================

describe('computeMadde12Deadline', () => {
  it('returns detectedAt + 72h by default', () => {
    const detected = new Date('2026-01-01T10:00:00Z');
    const deadline = computeMadde12Deadline(detected);
    const expected = new Date('2026-01-04T10:00:00Z');
    expect(deadline.toISOString()).toBe(expected.toISOString());
  });

  it('respects custom hour offset', () => {
    const detected = new Date('2026-01-01T10:00:00Z');
    const deadline = computeMadde12Deadline(detected, 48);
    const expected = new Date('2026-01-03T10:00:00Z');
    expect(deadline.toISOString()).toBe(expected.toISOString());
  });
});

describe('isDeadlineApproaching', () => {
  it('returns true when deadline is 12h away (threshold 24h)', () => {
    const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
    expect(isDeadlineApproaching(deadline, 24)).toBe(true);
  });

  it('returns false when deadline is 48h away', () => {
    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    expect(isDeadlineApproaching(deadline, 24)).toBe(false);
  });

  it('returns false when deadline is in the past', () => {
    const deadline = new Date(Date.now() - 60 * 60 * 1000);
    expect(isDeadlineApproaching(deadline, 24)).toBe(false);
  });
});

describe('shouldAutoEscalateToVerbis', () => {
  it('returns true when detectedAt is 65h ago (default 60h threshold)', () => {
    const detectedAt = new Date(Date.now() - 65 * 60 * 60 * 1000);
    expect(shouldAutoEscalateToVerbis(detectedAt)).toBe(true);
  });

  it('returns false when detectedAt is 30h ago', () => {
    const detectedAt = new Date(Date.now() - 30 * 60 * 60 * 1000);
    expect(shouldAutoEscalateToVerbis(detectedAt)).toBe(false);
  });
});

// ============================================================================
// submitBreachNotification
// ============================================================================

describe('submitBreachNotification', () => {
  it('returns FAILED when VERBİS is not configured', async () => {
    const result = await submitBreachNotification({
      workspaceId: 'ws-1',
      severity: 'CRITICAL',
      title: 'Test',
      description: 'Test desc',
      affectedUsers: 100,
      detectedAt: new Date(),
      deadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
      incidentId: 'inc-1',
    });
    expect(result.status).toBe('FAILED');
    expect(result.error).toBe('VERBIS_NOT_CONFIGURED');
  });

  it('submits successfully when VERBİS responds OK', async () => {
    // verbis.ts module-level env capture'ı nedeniyle resetModules + re-import.
    process.env.VERBIS_API_URL = 'https://verbis.example.com/api';
    process.env.VERBIS_API_KEY = 'key';
    process.env.VERBIS_API_SECRET = 'secret';

    vi.resetModules();
    const { submitBreachNotification: submitFn } = await import('@/lib/verbis');

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ notification_id: 'verbis-123', status: 'SUBMITTED' }),
    });

    const result = await submitFn({
      workspaceId: 'ws-1',
      severity: 'CRITICAL',
      title: 'Test breach',
      description: 'Açıklama',
      affectedUsers: 50,
      detectedAt: new Date('2026-01-01T10:00:00Z'),
      deadline: new Date('2026-01-04T10:00:00Z'),
      incidentId: 'inc-1',
    });

    expect(result.status).toBe('SUBMITTED');
    expect(result.notificationId).toBe('verbis-123');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const call = mockFetch.mock.calls[0];
    const url = call[0] as string;
    expect(url).toContain('/breach-notifications');
    const init = call[1] as RequestInit;
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Verbis-Api-Key']).toBe('key');
    expect(headers['X-Verbis-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it('handles VERBİS 5xx error', async () => {
    process.env.VERBIS_API_URL = 'https://verbis.example.com/api';
    process.env.VERBIS_API_KEY = 'key';
    process.env.VERBIS_API_SECRET = 'secret';

    vi.resetModules();
    const { submitBreachNotification: submitFn } = await import('@/lib/verbis');

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: 'server error' }),
    });

    const result = await submitFn({
      workspaceId: 'ws-1',
      severity: 'HIGH',
      title: 'X',
      description: 'Y',
      affectedUsers: 0,
      detectedAt: new Date(),
      deadline: new Date(),
      incidentId: 'inc-1',
    });
    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('500');
  });
});

// ============================================================================
// maybeAutoSubmitToVerbis
// ============================================================================

describe('maybeAutoSubmitToVerbis', () => {
  it('returns skipped when incident not found', async () => {
    mockPrisma.dataBreachIncident.findUnique.mockResolvedValue(null);
    const result = await maybeAutoSubmitToVerbis('non-existent');
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('INCIDENT_NOT_FOUND');
  });

  it('returns skipped when already submitted', async () => {
    mockPrisma.dataBreachIncident.findUnique.mockResolvedValue({
      id: 'inc-1',
      verbisSubmittedAt: new Date(),
      severity: 'CRITICAL',
      workspace: { id: 'ws-1', name: 'W', ownerId: 'u-1' },
      site: null,
    });
    const result = await maybeAutoSubmitToVerbis('inc-1');
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('ALREADY_SUBMITTED');
  });

  it('skips LOW severity entirely', async () => {
    mockPrisma.dataBreachIncident.findUnique.mockResolvedValue({
      id: 'inc-1',
      verbisSubmittedAt: null,
      severity: 'LOW',
      workspace: { id: 'ws-1', name: 'W', ownerId: 'u-1' },
      site: null,
    });
    const result = await maybeAutoSubmitToVerbis('inc-1');
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('LOW_SEVERITY');
  });

  it('skips MEDIUM (requires manual flag)', async () => {
    mockPrisma.dataBreachIncident.findUnique.mockResolvedValue({
      id: 'inc-1',
      verbisSubmittedAt: null,
      severity: 'MEDIUM',
      workspace: { id: 'ws-1', name: 'W', ownerId: 'u-1' },
      site: null,
    });
    const result = await maybeAutoSubmitToVerbis('inc-1');
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('MEDIUM_REQUIRES_MANUAL');
  });

  it('skips when VERBİS not configured (CRITICAL but no env)', async () => {
    mockPrisma.dataBreachIncident.findUnique.mockResolvedValue({
      id: 'inc-1',
      verbisSubmittedAt: null,
      severity: 'CRITICAL',
      workspace: { id: 'ws-1', name: 'W', ownerId: 'u-1' },
      site: null,
    });
    const result = await maybeAutoSubmitToVerbis('inc-1');
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('VERBIS_NOT_CONFIGURED');
  });
});

// ============================================================================
// notifyAffectedUsers
// ============================================================================

describe('notifyAffectedUsers', () => {
  it('throws when incident not found', async () => {
    mockPrisma.dataBreachIncident.findFirst.mockResolvedValue(null);
    await expect(notifyAffectedUsers('ws-1', 'inc-1')).rejects.toThrow('bulunamadı');
  });

  it('returns 0 counts when no members', async () => {
    mockPrisma.dataBreachIncident.findFirst.mockResolvedValue({
      id: 'inc-1',
      workspaceId: 'ws-1',
      title: 'Test',
      description: 'Desc',
      detectedAt: new Date(),
      dataCategories: null,
      workspace: { id: 'ws-1', name: 'WS', ownerId: 'u-owner' },
    });
    mockPrisma.workspaceMember.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await notifyAffectedUsers('ws-1', 'inc-1');
    expect(result.notified).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('sends emails to all workspace members + owner', async () => {
    mockPrisma.dataBreachIncident.findFirst.mockResolvedValue({
      id: 'inc-1',
      workspaceId: 'ws-1',
      title: 'Breach Title',
      description: 'Breach desc',
      detectedAt: new Date('2026-01-01T10:00:00Z'),
      dataCategories: ['email', 'phone'],
      workspace: { id: 'ws-1', name: 'Acme', ownerId: 'u-owner' },
    });
    mockPrisma.workspaceMember.findMany.mockResolvedValue([
      { user: { email: 'a@x.com', name: 'Alice' }, userEmail: 'a@x.com', userName: 'Alice' },
      { user: { email: 'b@x.com', name: 'Bob' }, userEmail: 'b@x.com', userName: 'Bob' },
    ]);
    mockPrisma.user.findUnique.mockResolvedValue({
      email: 'owner@x.com',
      name: 'Owner',
    });

    const result = await notifyAffectedUsers('ws-1', 'inc-1');

    expect(result.notified).toBe(3);
    expect(mockSendEmail).toHaveBeenCalledTimes(3);
    expect(mockPrisma.dataBreachIncident.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inc-1' },
        data: expect.objectContaining({ affectedUsersNotifiedAt: expect.any(Date) }),
      })
    );
  });

  it('counts failed sends correctly', async () => {
    mockPrisma.dataBreachIncident.findFirst.mockResolvedValue({
      id: 'inc-1',
      workspaceId: 'ws-1',
      title: 'T',
      description: 'D',
      detectedAt: new Date(),
      dataCategories: null,
      workspace: { id: 'ws-1', name: 'WS', ownerId: 'u-owner' },
    });
    mockPrisma.workspaceMember.findMany.mockResolvedValue([
      { user: { email: 'fail@x.com', name: 'Fail' }, userEmail: 'fail@x.com', userName: 'Fail' },
    ]);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    mockSendEmail.mockResolvedValueOnce({ success: false, error: 'bounce' } as never);

    const result = await notifyAffectedUsers('ws-1', 'inc-1');
    expect(result.notified).toBe(0);
    expect(result.failed).toBe(1);
  });
});

// ============================================================================
// processCheckBreaches
// ============================================================================

describe('processCheckBreaches', () => {
  it('processes escalatable HIGH/CRITICAL >60h', async () => {
    // First call: escalatable.findMany
    // Second call: reminders.findMany
    mockPrisma.dataBreachIncident.findMany
      .mockResolvedValueOnce([{ id: 'inc-1', workspaceId: 'ws-1', severity: 'CRITICAL', title: 'T' }])
      .mockResolvedValueOnce([]);

    // maybeAutoSubmitToVerbis called: returns FAILED (not configured)
    mockPrisma.dataBreachIncident.findUnique.mockResolvedValue({
      id: 'inc-1',
      verbisSubmittedAt: null,
      severity: 'CRITICAL',
      workspace: { id: 'ws-1', name: 'W', ownerId: 'u-1' },
      site: null,
    });

    const result = await processCheckBreaches();
    expect(result.processedCount).toBe(1);
    expect(result.escalatedCount).toBe(0); // not configured → not submitted
  });

  it('returns 0 escalated when no escalatable incidents', async () => {
    mockPrisma.dataBreachIncident.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await processCheckBreaches();
    expect(result.escalatedCount).toBe(0);
    expect(result.processedCount).toBe(0);
  });
});
