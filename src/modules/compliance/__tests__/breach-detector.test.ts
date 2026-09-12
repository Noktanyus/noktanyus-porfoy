/**
 * Breach Detector — Unit Tests (Phase 4 C.6)
 *
 * Test coverage:
 *   - processBreachSignal: creates incident, audit, email, sentry
 *   - Workspace validation
 *   - Duplicate detection by sentryAlertId
 *   - Severity-based KVKK notification flag
 *   - handleSentryAlert: severity mapping from Sentry levels
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

const mockSentryCaptureMessage = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureMessage: (...args: unknown[]) => mockSentryCaptureMessage(...args),
}));

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      workspace: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      complianceSite: {
        findFirst: vi.fn(),
      },
      dataBreachIncident: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(
    async (): Promise<{ success: boolean; messageId?: string; error?: string }> => ({
      success: true,
      messageId: 'msg-1',
    })
  ),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
}));

// ============================================================================
// Imports
// ============================================================================

import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { processBreachSignal, handleSentryAlert } from '../breachDetector';
import type { BreachSignal } from '../breachDetector';

const mockPrisma = prisma as unknown as {
  workspace: { findUnique: ReturnType<typeof vi.fn> };
  user: { findUnique: ReturnType<typeof vi.fn> };
  complianceSite: { findFirst: ReturnType<typeof vi.fn> };
  dataBreachIncident: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

const mockLogAudit = logAudit as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ADMIN_EMAIL;
  delete process.env.SECURITY_EMAIL;
});

// ============================================================================
// processBreachSignal — workspace validation
// ============================================================================

describe('processBreachSignal — workspace validation', () => {
  it('throws WORKSPACE_NOT_FOUND when workspace missing', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValue(null);

    const signal: BreachSignal = {
      source: 'manual',
      severity: 'HIGH',
      title: 'Test Breach',
      description: 'Detailed breach description',
      workspaceId: 'ws-missing',
    };

    await expect(processBreachSignal(signal)).rejects.toMatchObject({
      code: 'WORKSPACE_NOT_FOUND',
    });
  });
});

// ============================================================================
// processBreachSignal — duplicate detection
// ============================================================================

describe('processBreachSignal — duplicate detection', () => {
  it('returns existing incident when sentryAlertId matches', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Test',
      ownerId: 'owner-1',
    });
    mockPrisma.dataBreachIncident.findFirst.mockResolvedValue({
      id: 'incident-existing',
      severity: 'HIGH',
      notifyKvkk: true,
    });

    const result = await processBreachSignal({
      source: 'sentry',
      severity: 'HIGH',
      title: 'Duplicate test',
      description: 'Already reported breach',
      workspaceId: 'ws-1',
      sentryAlertId: 'alert-123',
    });

    expect(result.duplicate).toBe(true);
    expect(result.incidentId).toBe('incident-existing');
    expect(result.severity).toBe('HIGH');
    expect(mockPrisma.dataBreachIncident.create).not.toHaveBeenCalled();
  });

  it('does not check duplicates when sentryAlertId missing', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Test',
      ownerId: 'owner-1',
    });
    mockPrisma.dataBreachIncident.create.mockResolvedValue({
      id: 'incident-new',
      detectedAt: new Date(),
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      email: 'owner@test.com',
    });

    await processBreachSignal({
      source: 'manual',
      severity: 'MEDIUM',
      title: 'No alert ID',
      description: 'Manual report',
      workspaceId: 'ws-1',
    });

    expect(mockPrisma.dataBreachIncident.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.dataBreachIncident.create).toHaveBeenCalled();
  });
});

// ============================================================================
// processBreachSignal — incident creation
// ============================================================================

describe('processBreachSignal — incident creation', () => {
  beforeEach(() => {
    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Test Workspace',
      ownerId: 'owner-1',
    });
    mockPrisma.dataBreachIncident.create.mockResolvedValue({
      id: 'incident-new',
      detectedAt: new Date(),
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      email: 'owner@test.com',
    });
  });

  it('creates incident with HIGH severity → notifyKvkk=true', async () => {
    const result = await processBreachSignal({
      source: 'manual',
      severity: 'HIGH',
      title: 'Test Breach',
      description: 'Detailed breach',
      workspaceId: 'ws-1',
    });

    expect(result.notifyKvkk).toBe(true);
    expect(result.incidentId).toBe('incident-new');
    expect(result.severity).toBe('HIGH');
    expect(mockPrisma.dataBreachIncident.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          severity: 'HIGH',
          notifyKvkk: true,
          title: 'Test Breach',
          workspaceId: 'ws-1',
        }),
      })
    );
  });

  it('CRITICAL severity → notifyKvkk=true', async () => {
    const result = await processBreachSignal({
      source: 'manual',
      severity: 'CRITICAL',
      title: 'Critical Breach',
      description: 'Critical',
      workspaceId: 'ws-1',
    });

    expect(result.notifyKvkk).toBe(true);
  });

  it('MEDIUM severity → notifyKvkk=false', async () => {
    const result = await processBreachSignal({
      source: 'manual',
      severity: 'MEDIUM',
      title: 'Medium Breach',
      description: 'Medium level',
      workspaceId: 'ws-1',
    });

    expect(result.notifyKvkk).toBe(false);
  });

  it('LOW severity → notifyKvkk=false', async () => {
    const result = await processBreachSignal({
      source: 'manual',
      severity: 'LOW',
      title: 'Low Breach',
      description: 'Low level',
      workspaceId: 'ws-1',
    });

    expect(result.notifyKvkk).toBe(false);
  });

  it('validates site belongs to workspace', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue(null);

    await expect(
      processBreachSignal({
        source: 'manual',
        severity: 'HIGH',
        title: 'Site Breach',
        description: 'Site level breach',
        workspaceId: 'ws-1',
        siteId: 'site-other-ws',
      })
    ).rejects.toMatchObject({
      code: 'SITE_WORKSPACE_MISMATCH',
    });
  });

  it('passes when site belongs to workspace', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({ id: 'site-1' });

    const result = await processBreachSignal({
      source: 'manual',
      severity: 'HIGH',
      title: 'Site Breach',
      description: 'Site level breach',
      workspaceId: 'ws-1',
      siteId: 'site-1',
    });

    expect(result.incidentId).toBe('incident-new');
  });
});

// ============================================================================
// processBreachSignal — Sentry capture
// ============================================================================

describe('processBreachSignal — Sentry integration', () => {
  beforeEach(() => {
    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Test',
      ownerId: 'owner-1',
    });
    mockPrisma.dataBreachIncident.create.mockResolvedValue({
      id: 'incident-new',
      detectedAt: new Date(),
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      email: 'owner@test.com',
    });
  });

  it('sends Sentry captureMessage with correct severity', async () => {
    const result = await processBreachSignal({
      source: 'manual',
      severity: 'CRITICAL',
      title: 'Critical Test',
      description: 'Critical breach test',
      workspaceId: 'ws-1',
    });

    expect(result.sentryCaptured).toBe(true);
    expect(mockSentryCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining('[DATA BREACH]'),
      expect.objectContaining({
        level: 'fatal',
        tags: expect.objectContaining({
          workspaceId: 'ws-1',
          severity: 'CRITICAL',
        }),
      })
    );
  });

  it('maps HIGH severity to "error" Sentry level', async () => {
    await processBreachSignal({
      source: 'manual',
      severity: 'HIGH',
      title: 'High Test',
      description: 'High severity',
      workspaceId: 'ws-1',
    });

    expect(mockSentryCaptureMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ level: 'error' })
    );
  });

  it('maps MEDIUM severity to "warning" Sentry level', async () => {
    await processBreachSignal({
      source: 'manual',
      severity: 'MEDIUM',
      title: 'Med Test',
      description: 'Medium',
      workspaceId: 'ws-1',
    });

    expect(mockSentryCaptureMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ level: 'warning' })
    );
  });

  it('does not crash when Sentry fails', async () => {
    mockSentryCaptureMessage.mockImplementationOnce(() => {
      throw new Error('Sentry down');
    });

    const result = await processBreachSignal({
      source: 'manual',
      severity: 'HIGH',
      title: 'Sentry Test',
      description: 'Test',
      workspaceId: 'ws-1',
    });

    expect(result.sentryCaptured).toBe(false);
    expect(result.incidentId).toBe('incident-new');
  });
});

// ============================================================================
// processBreachSignal — email notification
// ============================================================================

describe('processBreachSignal — email notification', () => {
  beforeEach(() => {
    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Test Workspace',
      ownerId: 'owner-1',
    });
    mockPrisma.dataBreachIncident.create.mockResolvedValue({
      id: 'incident-new',
      detectedAt: new Date(),
    });
  });

  it('sends email to workspace owner', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      email: 'owner@test.com',
    });

    const result = await processBreachSignal({
      source: 'manual',
      severity: 'HIGH',
      title: 'Email Test',
      description: 'Email test description',
      workspaceId: 'ws-1',
    });

    expect(result.emailSent).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.arrayContaining(['owner@test.com']),
        subject: expect.stringContaining('[DATA BREACH HIGH]'),
        html: expect.stringContaining('Email Test'),
      })
    );
  });

  it('includes admin email in recipients when env set', async () => {
    process.env.ADMIN_EMAIL = 'admin@company.com';
    mockPrisma.user.findUnique.mockResolvedValue({
      email: 'owner@test.com',
    });

    await processBreachSignal({
      source: 'manual',
      severity: 'HIGH',
      title: 'Multi-recipient',
      description: 'Multi',
      workspaceId: 'ws-1',
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.arrayContaining(['admin@company.com']),
      })
    );
  });

  it('includes security email when SECURITY_EMAIL set', async () => {
    process.env.SECURITY_EMAIL = 'security@company.com';
    mockPrisma.user.findUnique.mockResolvedValue({
      email: 'owner@test.com',
    });

    await processBreachSignal({
      source: 'manual',
      severity: 'HIGH',
      title: 'Security email test',
      description: 'Sec',
      workspaceId: 'ws-1',
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.arrayContaining(['security@company.com']),
      })
    );
  });

  it('updates reportedAt when email succeeds', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      email: 'owner@test.com',
    });

    await processBreachSignal({
      source: 'manual',
      severity: 'HIGH',
      title: 'Reported',
      description: 'Reported test',
      workspaceId: 'ws-1',
    });

    expect(mockPrisma.dataBreachIncident.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'incident-new' },
        data: { reportedAt: expect.any(Date) },
      })
    );
  });

  it('does not throw when email fails', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      email: 'owner@test.com',
    });
    mockSendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP error' });

    const result = await processBreachSignal({
      source: 'manual',
      severity: 'HIGH',
      title: 'Email fail',
      description: 'Email fail test',
      workspaceId: 'ws-1',
    });

    expect(result.emailSent).toBe(false);
    expect(result.incidentId).toBe('incident-new');
  });

  it('handles missing owner email gracefully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await processBreachSignal({
      source: 'manual',
      severity: 'HIGH',
      title: 'No owner',
      description: 'No owner',
      workspaceId: 'ws-1',
    });

    expect(result.emailSent).toBe(false);
    expect(result.incidentId).toBe('incident-new');
  });
});

// ============================================================================
// processBreachSignal — audit log
// ============================================================================

describe('processBreachSignal — audit log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Test',
      ownerId: 'owner-1',
    });
    mockPrisma.dataBreachIncident.findFirst.mockResolvedValue(null);
    mockPrisma.complianceSite.findFirst.mockResolvedValue(null);
    mockPrisma.dataBreachIncident.create.mockResolvedValue({
      id: 'incident-new',
      detectedAt: new Date(),
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);
  });

  it('writes CREATE audit log with all metadata', async () => {
    await processBreachSignal({
      source: 'manual',
      severity: 'HIGH',
      title: 'Audit Test',
      description: 'Audit test description',
      workspaceId: 'ws-1',
      affectedUsers: 100,
      dataCategories: ['email', 'phone'],
      sentryAlertId: 'alert-999',
    });

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        resource: 'DataBreachIncident',
        resourceId: 'incident-new',
        details: expect.objectContaining({
          workspaceId: 'ws-1',
          severity: 'HIGH',
          source: 'manual',
          title: 'Audit Test',
          notifyKvkk: true,
          sentryAlertId: 'alert-999',
        }),
      })
    );
  });
});

// ============================================================================
// handleSentryAlert — severity mapping
// ============================================================================

describe('handleSentryAlert — Sentry webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Test',
      ownerId: 'owner-1',
    });
    mockPrisma.dataBreachIncident.findFirst.mockResolvedValue(null);
    mockPrisma.complianceSite.findFirst.mockResolvedValue({ id: 'site-1' });
    mockPrisma.dataBreachIncident.create.mockResolvedValue({
      id: 'incident-from-sentry',
      detectedAt: new Date(),
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);
  });

  it('maps fatal level to CRITICAL', async () => {
    await handleSentryAlert('ws-1', {
      id: 'alert-fatal',
      level: 'fatal',
      title: 'Fatal error',
      message: 'Fatal message',
    });

    expect(mockPrisma.dataBreachIncident.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          severity: 'CRITICAL',
          sentryAlertId: 'alert-fatal',
        }),
      })
    );
  });

  it('maps error level to HIGH', async () => {
    await handleSentryAlert('ws-1', {
      id: 'alert-error',
      level: 'error',
      title: 'Error',
      message: 'Error message',
    });

    expect(mockPrisma.dataBreachIncident.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          severity: 'HIGH',
        }),
      })
    );
  });

  it('maps warning level to MEDIUM', async () => {
    await handleSentryAlert('ws-1', {
      id: 'alert-warn',
      level: 'warning',
      title: 'Warn',
      message: 'Warn message',
    });

    expect(mockPrisma.dataBreachIncident.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          severity: 'MEDIUM',
        }),
      })
    );
  });

  it('maps info level to LOW', async () => {
    await handleSentryAlert('ws-1', {
      id: 'alert-info',
      level: 'info',
      title: 'Info',
      message: 'Info message',
    });

    expect(mockPrisma.dataBreachIncident.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          severity: 'LOW',
        }),
      })
    );
  });

  it('defaults unknown level to MEDIUM', async () => {
    await handleSentryAlert('ws-1', {
      id: 'alert-unknown',
      level: 'debug',
      title: 'Debug',
      message: 'Debug message',
    });

    expect(mockPrisma.dataBreachIncident.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          severity: 'MEDIUM',
        }),
      })
    );
  });

  it('extracts siteId from payload tags', async () => {
    await handleSentryAlert('ws-1', {
      id: 'alert-site',
      level: 'error',
      title: 'Site error',
      message: 'Site-level error',
      tags: { siteId: 'site-99' },
    });

    expect(mockPrisma.dataBreachIncident.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          siteId: 'site-99',
        }),
      })
    );
  });

  it('extracts dataCategories from payload tags (comma-separated)', async () => {
    await handleSentryAlert('ws-1', {
      id: 'alert-cats',
      level: 'error',
      title: 'Cat error',
      message: 'Cat error',
      tags: { dataCategories: 'email, phone, address' },
    });

    expect(mockPrisma.dataBreachIncident.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dataCategories: ['email', 'phone', 'address'],
        }),
      })
    );
  });
});
