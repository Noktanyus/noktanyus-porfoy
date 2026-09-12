/**
 * Compliance Service — Unit Tests (Phase 4 C)
 *
 * Test coverage:
 *   - addComplianceSite: domain validation, duplicate detection
 *   - startScan: scan create + queue
 *   - getLatestScan: latest completed scan
 *   - updateSiteStatus: status transitions + audit log
 *   - scheduleNextScan: interval change + forceNow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// Mocks (must come before service imports)
// ============================================================================

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      workspace: {
        findUnique: vi.fn(),
      },
      complianceSite: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      cookieScan: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      dataBreachIncident: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          cookieScan: { update: vi.fn().mockResolvedValue({}) },
          complianceSite: { update: vi.fn().mockResolvedValue({}) },
        })
      ),
    },
  };
});

vi.mock('@/lib/queue', () => ({
  Jobs: {
    ComplianceScan: 'compliance.scan',
    ComplianceMonitor: 'compliance.monitor',
    MonitorCheck: 'monitor.check',
    NewsletterBroadcast: 'newsletter.broadcast',
    EmailSend: 'email.send',
    ImageOptimize: 'image.optimize',
    OrderExpire: 'order.expire',
    AiBulkGenerate: 'ai.bulk.generate',
    AiBrandVoiceTrain: 'ai.brand-voice.train',
    templateInstall: 'template.install',
    TemplateDemoDeploy: 'template.demo.deploy',
  },
  queue: {
    add: vi.fn().mockResolvedValue({ id: 'job-123' }),
  },
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@/lib/prisma';
import { queue } from '@/lib/queue';
import { logAudit } from '@/lib/audit';
import {
  addComplianceSite,
  startScan,
  getLatestScan,
  updateSiteStatus,
  scheduleNextScan,
  runComplianceAnalysis,
  listComplianceSites,
  getComplianceSite,
  deleteComplianceSite,
} from '../service';

const mockPrisma = prisma as unknown as {
  workspace: { findUnique: ReturnType<typeof vi.fn> };
  complianceSite: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  cookieScan: {
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  dataBreachIncident: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

const mockQueue = queue as unknown as { add: ReturnType<typeof vi.fn> };
const mockLogAudit = logAudit as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// addComplianceSite
// ============================================================================

describe('addComplianceSite', () => {
  const baseArgs = {
    workspaceId: 'ws-1',
    userId: 'user-1',
    input: {
      domain: 'example.com',
      name: 'Example Site',
      contactEmail: 'admin@example.com',
      country: 'TR',
      language: 'tr' as const,
      scanInterval: 'weekly' as const,
    },
  };

  it('creates a site successfully', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1' });
    mockPrisma.complianceSite.findUnique.mockResolvedValue(null);
    const created = {
      id: 'site-1',
      domain: 'example.com',
      workspaceId: 'ws-1',
      status: 'pending',
    };
    mockPrisma.complianceSite.create.mockResolvedValue(created);

    const result = await addComplianceSite(baseArgs);
    expect(result).toEqual(created);
    expect(mockPrisma.complianceSite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          domain: 'example.com',
          status: 'pending',
        }),
      })
    );
  });

  it('writes audit log after creation', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1' });
    mockPrisma.complianceSite.findUnique.mockResolvedValue(null);
    mockPrisma.complianceSite.create.mockResolvedValue({
      id: 'site-1',
      domain: 'example.com',
    });

    await addComplianceSite(baseArgs);

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        resource: 'ComplianceSite',
        resourceId: 'site-1',
      })
    );
  });

  it('throws WORKSPACE_NOT_FOUND if workspace missing', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValue(null);

    await expect(addComplianceSite(baseArgs)).rejects.toMatchObject({
      code: 'WORKSPACE_NOT_FOUND',
    });
  });

  it('throws DOMAIN_ALREADY_EXISTS for same workspace', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1' });
    mockPrisma.complianceSite.findUnique.mockResolvedValue({
      id: 'existing-site',
      workspaceId: 'ws-1',
    });

    await expect(addComplianceSite(baseArgs)).rejects.toMatchObject({
      code: 'DOMAIN_ALREADY_EXISTS',
    });
  });

  it('throws DOMAIN_ALREADY_EXISTS for different workspace', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1' });
    mockPrisma.complianceSite.findUnique.mockResolvedValue({
      id: 'existing-site',
      workspaceId: 'other-ws',
    });

    await expect(addComplianceSite(baseArgs)).rejects.toMatchObject({
      code: 'DOMAIN_ALREADY_EXISTS',
    });
  });

  it('rejects invalid domain via schema', async () => {
    await expect(
      addComplianceSite({
        ...baseArgs,
        input: {
          ...baseArgs.input,
          domain: 'invalid domain with spaces',
        },
      })
    ).rejects.toThrow();
  });

  it('lowercases and trims the domain', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1' });
    mockPrisma.complianceSite.findUnique.mockResolvedValue(null);
    mockPrisma.complianceSite.create.mockResolvedValue({ id: 'site-1' });

    await addComplianceSite({
      ...baseArgs,
      input: { ...baseArgs.input, domain: '  EXAMPLE.COM  ' },
    });

    expect(mockPrisma.complianceSite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          domain: 'example.com',
        }),
      })
    );
  });

  it('uppercases country code', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValue({ id: 'ws-1' });
    mockPrisma.complianceSite.findUnique.mockResolvedValue(null);
    mockPrisma.complianceSite.create.mockResolvedValue({ id: 'site-1' });

    await addComplianceSite({
      ...baseArgs,
      input: { ...baseArgs.input, country: 'tr' },
    });

    expect(mockPrisma.complianceSite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          country: 'TR',
        }),
      })
    );
  });
});

// ============================================================================
// startScan
// ============================================================================

describe('startScan', () => {
  const baseArgs = {
    siteId: 'site-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
  };

  it('creates scan and queues it', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({
      id: 'site-1',
      domain: 'example.com',
      status: 'pending',
    });
    mockPrisma.cookieScan.findFirst.mockResolvedValue(null);
    mockPrisma.complianceSite.update.mockResolvedValue({});
    const scan = {
      id: 'scan-1',
      status: 'running',
      startedAt: new Date(),
    };
    mockPrisma.cookieScan.create.mockResolvedValue(scan);

    const result = await startScan(baseArgs);
    expect(result.scanId).toBe('scan-1');
    expect(result.status).toBe('running');
    expect(mockQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'compliance.scan',
        data: { scanId: 'scan-1', siteId: 'site-1' },
      })
    );
  });

  it('sets site status to scanning', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({
      id: 'site-1',
      domain: 'example.com',
      status: 'pending',
    });
    mockPrisma.cookieScan.findFirst.mockResolvedValue(null);
    mockPrisma.cookieScan.create.mockResolvedValue({
      id: 'scan-1',
      status: 'running',
      startedAt: new Date(),
    });
    mockPrisma.complianceSite.update.mockResolvedValue({});

    await startScan(baseArgs);
    expect(mockPrisma.complianceSite.update).toHaveBeenCalledWith({
      where: { id: 'site-1' },
      data: { status: 'scanning' },
    });
  });

  it('throws SITE_NOT_FOUND when site missing', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue(null);

    await expect(startScan(baseArgs)).rejects.toMatchObject({
      code: 'SITE_NOT_FOUND',
    });
  });

  it('throws SCAN_ALREADY_RUNNING when running scan exists', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({
      id: 'site-1',
      domain: 'example.com',
      status: 'scanning',
    });
    mockPrisma.cookieScan.findFirst.mockResolvedValue({
      id: 'existing-scan',
      startedAt: new Date(),
    });

    await expect(startScan(baseArgs)).rejects.toMatchObject({
      code: 'SCAN_ALREADY_RUNNING',
    });
  });

  it('writes audit log', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({
      id: 'site-1',
      domain: 'example.com',
      status: 'pending',
    });
    mockPrisma.cookieScan.findFirst.mockResolvedValue(null);
    mockPrisma.cookieScan.create.mockResolvedValue({
      id: 'scan-1',
      status: 'running',
      startedAt: new Date(),
    });
    mockPrisma.complianceSite.update.mockResolvedValue({});

    await startScan(baseArgs);
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        resource: 'CookieScan',
        resourceId: 'scan-1',
      })
    );
  });
});

// ============================================================================
// getLatestScan
// ============================================================================

describe('getLatestScan', () => {
  it('returns latest completed scan', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({ id: 'site-1' });
    const scan = { id: 'scan-1', status: 'completed', completedAt: new Date() };
    mockPrisma.cookieScan.findFirst.mockResolvedValue(scan);

    const result = await getLatestScan('site-1', 'ws-1');
    expect(result).toEqual(scan);
  });

  it('returns null if site not in workspace', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue(null);
    const result = await getLatestScan('site-1', 'ws-1');
    expect(result).toBeNull();
    expect(mockPrisma.cookieScan.findFirst).not.toHaveBeenCalled();
  });

  it('queries by completed status with completedAt desc ordering', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({ id: 'site-1' });
    mockPrisma.cookieScan.findFirst.mockResolvedValue(null);

    await getLatestScan('site-1', 'ws-1');
    expect(mockPrisma.cookieScan.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { siteId: 'site-1', status: 'completed' },
        orderBy: { completedAt: 'desc' },
      })
    );
  });
});

// ============================================================================
// updateSiteStatus
// ============================================================================

describe('updateSiteStatus', () => {
  it('updates site status and writes audit log', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({
      id: 'site-1',
      status: 'pending',
    });
    const updated = { id: 'site-1', status: 'warning' };
    mockPrisma.complianceSite.update.mockResolvedValue(updated);

    const result = await updateSiteStatus('site-1', 'ws-1', {
      status: 'warning',
      userId: 'user-1',
    });

    expect(result).toEqual(updated);
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        resource: 'ComplianceSite',
        details: expect.objectContaining({
          previousStatus: 'pending',
          newStatus: 'warning',
        }),
      })
    );
  });

  it('throws SITE_NOT_FOUND if site missing', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue(null);

    await expect(
      updateSiteStatus('site-1', 'ws-1', { status: 'warning' })
    ).rejects.toMatchObject({ code: 'SITE_NOT_FOUND' });
  });

  it('rejects invalid status via schema', async () => {
    await expect(
      updateSiteStatus('site-1', 'ws-1', {
        status: 'INVALID_STATUS' as never,
      })
    ).rejects.toThrow();
  });
});

// ============================================================================
// scheduleNextScan
// ============================================================================

describe('scheduleNextScan', () => {
  it('updates scan interval and nextScanAt', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({
      id: 'site-1',
      scanInterval: 'weekly',
    });
    mockPrisma.complianceSite.update.mockResolvedValue({});

    const result = await scheduleNextScan('site-1', 'ws-1', {
      scanInterval: 'daily',
      forceNow: false,
    });

    expect(result.scanInterval).toBe('daily');
    expect(result.queuedImmediately).toBe(false);
    expect(mockPrisma.complianceSite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'site-1' },
        data: expect.objectContaining({
          scanInterval: 'daily',
          nextScanAt: expect.any(Date),
        }),
      })
    );
  });

  it('computes nextScanAt as Date.now() + intervalMs for daily', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({
      id: 'site-1',
      scanInterval: 'weekly',
    });
    mockPrisma.complianceSite.update.mockResolvedValue({});

    const before = Date.now();
    const result = await scheduleNextScan('site-1', 'ws-1', {
      scanInterval: 'daily',
      forceNow: false,
    });
    const after = Date.now();

    // daily = 24h = 86_400_000 ms
    const expectedMin = before + 24 * 60 * 60 * 1000;
    const expectedMax = after + 24 * 60 * 60 * 1000;
    expect(result.nextScanAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
    expect(result.nextScanAt.getTime()).toBeLessThanOrEqual(expectedMax);
  });

  it('throws SITE_NOT_FOUND if site missing', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue(null);

    await expect(
      scheduleNextScan('site-1', 'ws-1', { scanInterval: 'weekly', forceNow: false })
    ).rejects.toMatchObject({ code: 'SITE_NOT_FOUND' });
  });

  it('writes audit log with scanInterval change', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({
      id: 'site-1',
      scanInterval: 'weekly',
    });
    mockPrisma.complianceSite.update.mockResolvedValue({});

    await scheduleNextScan('site-1', 'ws-1', {
      scanInterval: 'monthly',
      forceNow: false,
      userId: 'user-1',
    });

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        resource: 'ComplianceSite',
        details: expect.objectContaining({
          scanInterval: 'monthly',
        }),
      })
    );
  });
});

// ============================================================================
// listComplianceSites & getComplianceSite & deleteComplianceSite
// ============================================================================

describe('listComplianceSites', () => {
  it('returns paginated list with filters', async () => {
    mockPrisma.complianceSite.findMany.mockResolvedValue([{ id: 'site-1' }]);
    mockPrisma.complianceSite.count.mockResolvedValue(1);

    const result = await listComplianceSites('ws-1', { page: 1, pageSize: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
  });

  it('applies status filter', async () => {
    mockPrisma.complianceSite.findMany.mockResolvedValue([]);
    mockPrisma.complianceSite.count.mockResolvedValue(0);

    await listComplianceSites('ws-1', {
      page: 1,
      pageSize: 20,
      status: 'critical',
    });
    expect(mockPrisma.complianceSite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'critical' }),
      })
    );
  });
});

describe('getComplianceSite', () => {
  it('returns site with scans and policies', async () => {
    const site = { id: 'site-1', workspaceId: 'ws-1' };
    mockPrisma.complianceSite.findFirst.mockResolvedValue(site);

    const result = await getComplianceSite('site-1', 'ws-1');
    expect(result).toEqual(site);
  });
});

describe('deleteComplianceSite', () => {
  it('deletes site and writes audit log', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue({
      id: 'site-1',
      domain: 'example.com',
    });
    mockPrisma.complianceSite.delete.mockResolvedValue({});

    await deleteComplianceSite('site-1', 'ws-1', { userId: 'user-1' });
    expect(mockPrisma.complianceSite.delete).toHaveBeenCalledWith({
      where: { id: 'site-1' },
    });
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELETE',
        resource: 'ComplianceSite',
      })
    );
  });

  it('throws SITE_NOT_FOUND if site missing', async () => {
    mockPrisma.complianceSite.findFirst.mockResolvedValue(null);

    await expect(
      deleteComplianceSite('site-1', 'ws-1', { userId: 'user-1' })
    ).rejects.toMatchObject({ code: 'SITE_NOT_FOUND' });
  });
});

// ============================================================================
// runComplianceAnalysis (pure function — no DB)
// ============================================================================

describe('runComplianceAnalysis (pure)', () => {
  it('returns cookies, scripts, forms, threats, score', () => {
    const result = runComplianceAnalysis({
      domain: 'example.com',
      cookieNames: ['_ga', '_fbp', 'session_id'],
      scripts: [
        { src: 'https://www.google-analytics.com/analytics.js' },
        { src: 'https://connect.facebook.net/en_US/fbevents.js' },
      ],
      forms: [],
      pageUrls: ['https://example.com'],
      hasPrivacyPolicyLink: true,
      hasCookiePolicyPage: true,
      hasCookieBanner: true,
    });

    expect(result.cookies.length).toBe(3);
    expect(result.trackingScripts.length).toBe(2);
    expect(result.forms).toHaveLength(0);
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('penalizes score when threats are detected', () => {
    const baseline = runComplianceAnalysis({
      domain: 'clean.com',
      cookieNames: ['session_id'],
      scripts: [],
      forms: [],
      pageUrls: ['https://clean.com'],
      hasPrivacyPolicyLink: true,
      hasCookiePolicyPage: true,
      hasCookieBanner: true,
    });

    const violation = runComplianceAnalysis({
      domain: 'bad.com',
      cookieNames: ['_ga'],
      scripts: [],
      forms: [],
      pageUrls: ['https://bad.com'],
      hasPrivacyPolicyLink: false,
      hasCookiePolicyPage: false,
      hasCookieBanner: false,
    });

    expect(violation.score).toBeLessThan(baseline.score);
  });
});
