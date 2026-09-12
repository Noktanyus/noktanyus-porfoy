/**
 * Template Marketplace Service — Unit Tests
 *
 * Phase 3 B.1 kapsamında templateService fonksiyonlarının unit testleri.
 * Prisma, audit ve queue modülleri mock'lanmıştır.
 *
 * Kapsam:
 *  - createTemplateListing (admin auth + slug unique + DB insert)
 *  - listTemplates (filters + pagination + sort)
 *  - getTemplateBySlug / getTemplateById
 *  - updateTemplateListing
 *  - deleteTemplateListing (soft delete)
 *  - generateLicenseKey (32 byte hex, unique)
 *  - installTemplate (license verify + workspace scope + queue enqueue)
 *  - verifyLicenseKey (active / expired / revoked)
 *  - listUserLicenses (workspace filter)
 *  - recordPurchaseAndIssueLicense (idempotent)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =================== MOCKS ===================

// Prisma client error class — service `instanceof Prisma.PrismaClientKnownRequestError`
// ile P2002 unique violation'i ConflictError'a cevirir. Testlerde ayni class'i
// kullanabilmek icin mock'luyoruz.
vi.mock('@prisma/client', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      code: string;
      meta?: unknown;
      constructor(message: string, opts: { code: string; meta?: unknown }) {
        super(message);
        this.code = opts.code;
        this.meta = opts.meta;
        this.name = 'PrismaClientKnownRequestError';
      }
    },
  },
}));

// Prisma mock — sadece templateService'in dokundugu modelleri icerir
vi.mock('@/lib/prisma', () => {
  const templateListing = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const templateLicense = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const templateInstallation = {
    create: vi.fn(),
    findUnique: vi.fn(),
  };
  const templatePurchase = {
    findUnique: vi.fn(),
    create: vi.fn(),
  };
  const workspace = {
    findUnique: vi.fn(),
  };
  const workspaceMember = {
    findUnique: vi.fn(),
  };
  const auditLog = {
    create: vi.fn(),
  };

  return {
    prisma: {
      templateListing,
      templateLicense,
      templateInstallation,
      templatePurchase,
      workspace,
      workspaceMember,
      auditLog,
      $transaction: vi.fn(),
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/queue', () => ({
  queue: {
    add: vi.fn().mockResolvedValue(undefined),
    register: vi.fn(),
  },
  Jobs: {
    templateInstall: 'template.install',
    TemplateDemoDeploy: 'template.demo.deploy',
  },
}));

import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { queue } from '@/lib/queue';
import { Prisma } from '@prisma/client';
import {
  createTemplateListing,
  updateTemplateListing,
  deleteTemplateListing,
  listTemplates,
  getTemplateBySlug,
  getTemplateById,
  installTemplate,
  verifyLicenseKey,
  listUserLicenses,
  recordPurchaseAndIssueLicense,
  generateLicenseKey,
} from '../templateService';

// =================== HELPERS ===================

const admin = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin',
};

const userNonAdmin = {
  id: 'user-1',
  email: 'user@example.com',
  role: 'user',
};

const validCreateInput = {
  slug: 'my-portfolio',
  name: 'My Portfolio',
  tagline: 'A modern portfolio template for creatives',
  description: 'Beautiful modern portfolio with dark mode and gallery support',
  category: 'portfolio' as const,
  previewImages: ['https://cdn.example.com/img1.png'],
  priceCents: 4900,
  currency: 'USD' as const,
  licenseType: 'single' as const,
  features: ['Responsive design', 'Dark mode'],
  techStack: ['Next.js', 'TypeScript'],
  version: '1.0.0',
};

// =================== TESTS ===================

describe('generateLicenseKey', () => {
  it('returns 64-character hex string (32 bytes)', () => {
    const key = generateLicenseKey();
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces unique keys on each call', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateLicenseKey()));
    expect(keys.size).toBe(50);
  });
});

describe('createTemplateListing', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects non-admin users', async () => {
    await expect(
      createTemplateListing(userNonAdmin, validCreateInput)
    ).rejects.toThrow(/sadece admin/);
  });

  it('rejects when user is missing', async () => {
    await expect(
      createTemplateListing(null as any, validCreateInput)
    ).rejects.toThrow(/Oturum/);
  });

  it('throws ConflictError when slug is already in use', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce({ id: 'existing' } as any);

    await expect(
      createTemplateListing(admin, validCreateInput)
    ).rejects.toMatchObject({ name: 'ConflictError', statusCode: 409 });
  });

  it('creates listing, normalizes slug, audits and returns row', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce(null); // slug check
    const createdRow = {
      id: 'tpl-1',
      slug: 'my-portfolio',
      name: 'My Portfolio',
    };
    vi.mocked(prisma.templateListing.create).mockResolvedValueOnce(createdRow as any);

    const result = await createTemplateListing(admin, validCreateInput);

    expect(result).toEqual(createdRow);
    expect(prisma.templateListing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'my-portfolio',
          name: 'My Portfolio',
          author: { connect: { id: admin.id } },
        }),
        include: expect.objectContaining({ author: expect.any(Object) }),
      })
    );
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        resource: 'TemplateListing',
        resourceId: 'tpl-1',
        userId: admin.id,
      })
    );
  });

  it('converts Prisma P2002 unique violation into ConflictError', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce(null);
    const prismaErr = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: 'test',
    });
    vi.mocked(prisma.templateListing.create).mockRejectedValueOnce(prismaErr);

    await expect(
      createTemplateListing(admin, validCreateInput)
    ).rejects.toMatchObject({ name: 'ConflictError' });
  });
});

describe('updateTemplateListing', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects non-admin users', async () => {
    await expect(
      updateTemplateListing(userNonAdmin, 'tpl-1', { name: 'New Name' })
    ).rejects.toThrow();
  });

  it('throws NotFoundError when listing does not exist', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce(null);

    await expect(
      updateTemplateListing(admin, 'missing', { name: 'Updated' })
    ).rejects.toMatchObject({ name: 'NotFoundError', statusCode: 404 });
  });

  it('updates listing and logs audit with changed fields', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce({
      id: 'tpl-1',
      slug: 'my-portfolio',
    } as any);
    const updatedRow = { id: 'tpl-1', slug: 'my-portfolio', name: 'New Name' };
    vi.mocked(prisma.templateListing.update).mockResolvedValueOnce(updatedRow as any);

    const result = await updateTemplateListing(admin, 'tpl-1', {
      name: 'New Name',
      active: false,
    });

    expect(result).toEqual(updatedRow);
    expect(prisma.templateListing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tpl-1' },
        data: expect.objectContaining({
          name: 'New Name',
          active: false,
        }),
      })
    );
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        resource: 'TemplateListing',
        resourceId: 'tpl-1',
        details: expect.objectContaining({ fields: expect.any(Array) }),
      })
    );
  });
});

describe('deleteTemplateListing', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects non-admin users', async () => {
    await expect(
      deleteTemplateListing(userNonAdmin, 'tpl-1')
    ).rejects.toThrow();
  });

  it('throws NotFoundError when listing missing', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce(null);

    await expect(
      deleteTemplateListing(admin, 'missing')
    ).rejects.toMatchObject({ name: 'NotFoundError' });
  });

  it('soft-deletes by flipping active to false and audits', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce({
      id: 'tpl-1',
      active: true,
    } as any);
    vi.mocked(prisma.templateListing.update).mockResolvedValueOnce({
      id: 'tpl-1',
      slug: 'my-portfolio',
      active: false,
    } as any);

    const result = await deleteTemplateListing(admin, 'tpl-1');

    expect(result).toEqual({ id: 'tpl-1', slug: 'my-portfolio', active: false });
    expect(prisma.templateListing.update).toHaveBeenCalledWith({
      where: { id: 'tpl-1' },
      data: { active: false },
      select: expect.objectContaining({ id: true, slug: true, active: true }),
    });
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELETE',
        resource: 'TemplateListing',
        details: { soft: true },
      })
    );
  });
});

describe('listTemplates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('filters by category and search, sorts by newest by default', async () => {
    vi.mocked(prisma.templateListing.count).mockResolvedValueOnce(42);
    vi.mocked(prisma.templateListing.findMany).mockResolvedValueOnce([{ id: 't1' }] as any);

    const result = await listTemplates({
      category: 'saas',
      search: 'shop',
      sort: 'newest',
      page: 1,
      pageSize: 12,
    });

    expect(result.meta).toEqual({
      total: 42,
      page: 1,
      pageSize: 12,
      pageCount: 4,
    });
    expect(prisma.templateListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          active: true,
          category: 'saas',
          OR: expect.any(Array),
        }),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 12,
      })
    );
  });

  it('sorts by popular (downloads desc)', async () => {
    vi.mocked(prisma.templateListing.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.templateListing.findMany).mockResolvedValueOnce([]);

    await listTemplates({ sort: 'popular', page: 1, pageSize: 12 });

    expect(prisma.templateListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { downloads: 'desc' } })
    );
  });

  it('sorts by price ascending and descending', async () => {
    vi.mocked(prisma.templateListing.count).mockResolvedValue(0);
    vi.mocked(prisma.templateListing.findMany).mockResolvedValue([]);

    await listTemplates({ sort: 'price-asc', page: 1, pageSize: 12 });
    expect(prisma.templateListing.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ orderBy: { priceCents: 'asc' } })
    );

    await listTemplates({ sort: 'price-desc', page: 1, pageSize: 12 });
    expect(prisma.templateListing.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ orderBy: { priceCents: 'desc' } })
    );
  });

  it('skips and takes based on page/pageSize', async () => {
    vi.mocked(prisma.templateListing.count).mockResolvedValueOnce(100);
    vi.mocked(prisma.templateListing.findMany).mockResolvedValueOnce([]);

    await listTemplates({ sort: 'newest', page: 3, pageSize: 10 });

    expect(prisma.templateListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });

  it('returns pageCount >= 1 even when total is 0', async () => {
    vi.mocked(prisma.templateListing.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.templateListing.findMany).mockResolvedValueOnce([]);

    const result = await listTemplates({ sort: 'newest', page: 1, pageSize: 12 });

    expect(result.meta.pageCount).toBe(1);
  });
});

describe('getTemplateBySlug', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns template when active', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce({
      id: 't1',
      slug: 'my-portfolio',
      active: true,
    } as any);

    const result = await getTemplateBySlug('my-portfolio');
    expect(result.id).toBe('t1');
  });

  it('throws NotFoundError when template does not exist', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce(null);

    await expect(getTemplateBySlug('missing')).rejects.toMatchObject({
      name: 'NotFoundError',
    });
  });

  it('throws NotFoundError when template is inactive', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce({
      id: 't1',
      slug: 'archived',
      active: false,
    } as any);

    await expect(getTemplateBySlug('archived')).rejects.toMatchObject({
      name: 'NotFoundError',
    });
  });
});

describe('getTemplateById', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns inactive template for admin context', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce({
      id: 't1',
      active: false,
    } as any);

    const result = await getTemplateById('t1');
    expect(result.id).toBe('t1');
  });

  it('throws NotFoundError when id missing', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce(null);

    await expect(getTemplateById('missing')).rejects.toMatchObject({
      name: 'NotFoundError',
    });
  });
});

describe('verifyLicenseKey', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns license + template info for active license', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      licenseKey: 'k1',
      status: 'active',
      type: 'single',
      expiresAt: null,
      workspaceId: null,
      template: {
        id: 't1',
        slug: 'my-portfolio',
        name: 'My Portfolio',
        licenseType: 'single',
        version: '1.0.0',
      },
    } as any);

    const result = await verifyLicenseKey('k1');
    expect(result.status).toBe('active');
    expect(result.template.slug).toBe('my-portfolio');
  });

  it('throws NotFoundError when license missing', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce(null);

    await expect(verifyLicenseKey('missing')).rejects.toMatchObject({
      name: 'NotFoundError',
    });
  });

  it('throws ForbiddenError when license is revoked', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      licenseKey: 'k1',
      status: 'revoked',
      template: { id: 't1', slug: 's', name: 'n', licenseType: 'single', version: '1.0.0' },
    } as any);

    await expect(verifyLicenseKey('k1')).rejects.toMatchObject({
      name: 'ForbiddenError',
    });
  });

  it('throws ForbiddenError when license is expired', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      licenseKey: 'k1',
      status: 'expired',
      template: { id: 't1', slug: 's', name: 'n', licenseType: 'single', version: '1.0.0' },
    } as any);

    await expect(verifyLicenseKey('k1')).rejects.toMatchObject({
      name: 'ForbiddenError',
    });
  });

  it('throws ForbiddenError when expiresAt < now even if status is active', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      licenseKey: 'k1',
      status: 'active',
      expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      template: { id: 't1', slug: 's', name: 'n', licenseType: 'single', version: '1.0.0' },
    } as any);

    await expect(verifyLicenseKey('k1')).rejects.toMatchObject({
      name: 'ForbiddenError',
    });
  });
});

describe('listUserLicenses', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws ValidationError when workspaceId missing', async () => {
    await expect(listUserLicenses('')).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('returns active licenses scoped to workspace with installation counts', async () => {
    const licenses = [{ id: 'l1' }, { id: 'l2' }];
    vi.mocked(prisma.templateLicense.findMany).mockResolvedValueOnce(licenses as any);

    const result = await listUserLicenses('ws-1');
    expect(result).toEqual(licenses);
    expect(prisma.templateLicense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: 'ws-1', status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: expect.objectContaining({
          template: expect.any(Object),
          _count: expect.objectContaining({ select: { installations: true } }),
        }),
      })
    );
  });
});

describe('installTemplate', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws UnauthorizedError when user missing', async () => {
    await expect(
      installTemplate(null as any, { licenseKey: 'k1', workspaceId: 'ws-1' })
    ).rejects.toMatchObject({ name: 'UnauthorizedError' });
  });

  it('throws NotFoundError when license missing', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce(null);

    await expect(
      installTemplate(userNonAdmin, { licenseKey: 'k1', workspaceId: 'ws-1' })
    ).rejects.toMatchObject({ name: 'NotFoundError' });
  });

  it('throws ForbiddenError when license is not active', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      id: 'l1',
      licenseKey: 'k1',
      status: 'revoked',
      expiresAt: null,
      workspaceId: null,
      template: { id: 't1', slug: 's', name: 'n', active: true },
    } as any);

    await expect(
      installTemplate(userNonAdmin, { licenseKey: 'k1', workspaceId: 'ws-1' })
    ).rejects.toMatchObject({ name: 'ForbiddenError' });
  });

  it('throws ForbiddenError when license expired', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      id: 'l1',
      licenseKey: 'k1',
      status: 'active',
      expiresAt: new Date(Date.now() - 1000),
      workspaceId: null,
      template: { id: 't1', slug: 's', name: 'n', active: true },
    } as any);

    await expect(
      installTemplate(userNonAdmin, { licenseKey: 'k1', workspaceId: 'ws-1' })
    ).rejects.toMatchObject({ name: 'ForbiddenError' });
  });

  it('throws NotFoundError when workspace missing', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      id: 'l1',
      licenseKey: 'k1',
      status: 'active',
      expiresAt: null,
      workspaceId: null,
      template: { id: 't1', slug: 's', name: 'n', active: true },
    } as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce(null);

    await expect(
      installTemplate(userNonAdmin, { licenseKey: 'k1', workspaceId: 'ws-1' })
    ).rejects.toMatchObject({ name: 'NotFoundError' });
  });

  it('throws ForbiddenError when user is not owner or admin member', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      id: 'l1',
      licenseKey: 'k1',
      status: 'active',
      expiresAt: null,
      workspaceId: null,
      template: { id: 't1', slug: 's', name: 'n', active: true },
    } as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
      id: 'ws-1',
      ownerId: 'someone-else',
    } as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
      role: 'VIEWER',
    } as any);

    await expect(
      installTemplate(userNonAdmin, { licenseKey: 'k1', workspaceId: 'ws-1' })
    ).rejects.toMatchObject({ name: 'ForbiddenError' });
  });

  it('throws ConflictError when license bound to a different workspace', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      id: 'l1',
      licenseKey: 'k1',
      status: 'active',
      expiresAt: null,
      workspaceId: 'ws-other',
      template: { id: 't1', slug: 's', name: 'n', active: true },
    } as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
      id: 'ws-1',
      ownerId: 'user-1',
    } as any);

    await expect(
      installTemplate(userNonAdmin, { licenseKey: 'k1', workspaceId: 'ws-1' })
    ).rejects.toMatchObject({ name: 'ConflictError' });
  });

  it('installs: binds license to workspace, enqueues install job, increments downloads', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      id: 'l1',
      licenseKey: 'k1',
      status: 'active',
      expiresAt: null,
      workspaceId: null,
      template: { id: 't1', slug: 'my-portfolio', name: 'My Portfolio', active: true },
    } as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
      id: 'ws-1',
      ownerId: 'user-1',
    } as any);
    vi.mocked(prisma.templateLicense.update).mockResolvedValueOnce({} as any);
    vi.mocked(prisma.templateInstallation.create).mockResolvedValueOnce({
      id: 'inst-1',
      licenseId: 'l1',
      workspaceId: 'ws-1',
      status: 'pending',
    } as any);
    vi.mocked(prisma.templateListing.update).mockResolvedValueOnce({} as any);

    const result = await installTemplate(userNonAdmin, {
      licenseKey: 'k1',
      workspaceId: 'ws-1',
      config: { subdomain: 'demo' },
    });

    expect(result.id).toBe('inst-1');
    expect(prisma.templateLicense.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'l1' },
        data: expect.objectContaining({
          workspace: { connect: { id: 'ws-1' } },
        }),
      })
    );
    expect(queue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'template-install:inst-1',
        name: 'template.install',
        data: expect.objectContaining({
          installationId: 'inst-1',
          templateId: 't1',
          licenseId: 'l1',
          workspaceId: 'ws-1',
        }),
        attempts: 3,
      })
    );
    expect(prisma.templateListing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 't1' },
        data: { downloads: { increment: 1 } },
      })
    );
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        resource: 'TemplateInstallation',
        resourceId: 'inst-1',
      })
    );
  });

  it('still installs when downloads counter update fails', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      id: 'l1',
      licenseKey: 'k1',
      status: 'active',
      expiresAt: null,
      workspaceId: 'ws-1',
      template: { id: 't1', slug: 's', name: 'n', active: true },
    } as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
      id: 'ws-1',
      ownerId: 'user-1',
    } as any);
    vi.mocked(prisma.templateInstallation.create).mockResolvedValueOnce({
      id: 'inst-2',
      licenseId: 'l1',
      workspaceId: 'ws-1',
      status: 'pending',
    } as any);
    vi.mocked(prisma.templateListing.update).mockRejectedValueOnce(new Error('counter db down'));

    const result = await installTemplate(userNonAdmin, {
      licenseKey: 'k1',
      workspaceId: 'ws-1',
    });

    expect(result.id).toBe('inst-2');
    expect(queue.add).toHaveBeenCalled();
  });

  it('accepts workspace ADMIN member as authorized installer', async () => {
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValueOnce({
      id: 'l1',
      licenseKey: 'k1',
      status: 'active',
      expiresAt: null,
      workspaceId: null,
      template: { id: 't1', slug: 's', name: 'n', active: true },
    } as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
      id: 'ws-1',
      ownerId: 'someone-else',
    } as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
      role: 'ADMIN',
    } as any);
    vi.mocked(prisma.templateLicense.update).mockResolvedValueOnce({} as any);
    vi.mocked(prisma.templateInstallation.create).mockResolvedValueOnce({
      id: 'inst-3',
      licenseId: 'l1',
      workspaceId: 'ws-1',
      status: 'pending',
    } as any);
    vi.mocked(prisma.templateListing.update).mockResolvedValueOnce({} as any);

    const result = await installTemplate(userNonAdmin, {
      licenseKey: 'k1',
      workspaceId: 'ws-1',
    });

    expect(result.id).toBe('inst-3');
  });
});

describe('recordPurchaseAndIssueLicense', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns existing purchase when (source, externalId) idempotent match', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce({
      id: 't1',
      active: true,
      licenseType: 'single',
      priceCents: 4900,
      currency: 'USD',
    } as any);
    const existingPurchase = {
      id: 'p1',
      template: { slug: 's', name: 'n' },
    };
    vi.mocked(prisma.templatePurchase.findUnique).mockResolvedValueOnce(existingPurchase as any);

    const result = await recordPurchaseAndIssueLicense({
      templateId: 't1',
      buyerEmail: 'b@example.com',
      source: 'gumroad',
      externalId: 'sale-1',
      amountCents: 4900,
      currency: 'USD',
      status: 'completed',
    });

    expect(result).toBe(existingPurchase);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when template missing', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce(null);

    await expect(
      recordPurchaseAndIssueLicense({
        templateId: 'missing',
        buyerEmail: 'b@example.com',
        source: 'gumroad',
        externalId: 'sale-1',
        amountCents: 0,
        currency: 'USD',
        status: 'completed',
      })
    ).rejects.toMatchObject({ name: 'NotFoundError' });
  });

  it('throws ValidationError when template inactive', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce({
      id: 't1',
      active: false,
    } as any);

    await expect(
      recordPurchaseAndIssueLicense({
        templateId: 't1',
        buyerEmail: 'b@example.com',
        source: 'gumroad',
        externalId: 'sale-1',
        amountCents: 0,
        currency: 'USD',
        status: 'completed',
      })
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });

  it('creates purchase + license in transaction with generated license key', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce({
      id: 't1',
      active: true,
      licenseType: 'white-label',
      priceCents: 9900,
      currency: 'USD',
    } as any);
    vi.mocked(prisma.templatePurchase.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
      return fn({
        templatePurchase: { create: vi.fn().mockResolvedValueOnce({ id: 'p1' }) },
        templateLicense: {
          create: vi.fn().mockResolvedValueOnce({ id: 'l1', licenseKey: 'kkk' }),
        },
      });
    });

    const result = await recordPurchaseAndIssueLicense({
      templateId: 't1',
      buyerEmail: 'b@example.com',
      buyerName: 'Buyer',
      workspaceId: 'ws-1',
      source: 'lemonsqueezy',
      externalId: 'sale-1',
      amountCents: 9900,
      currency: 'USD',
      status: 'completed',
    });

    expect(result.id).toBe('p1');
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        resource: 'TemplateLicense',
      })
    );
  });

  it('retries on licenseKey P2002 collision up to 3 attempts', async () => {
    vi.mocked(prisma.templateListing.findUnique).mockResolvedValueOnce({
      id: 't1',
      active: true,
      licenseType: 'single',
      priceCents: 0,
      currency: 'USD',
    } as any);
    vi.mocked(prisma.templatePurchase.findUnique).mockResolvedValueOnce(null);

    // İlk iki denemede P2002, üçüncüde başarılı
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
    });
    vi.mocked(prisma.$transaction)
      .mockRejectedValueOnce(p2002)
      .mockRejectedValueOnce(p2002)
      .mockImplementationOnce(async (fn: any) =>
        fn({
          templatePurchase: { create: vi.fn().mockResolvedValueOnce({ id: 'p1' }) },
          templateLicense: {
            create: vi.fn().mockResolvedValueOnce({ id: 'l1', licenseKey: 'kkk' }),
          },
        })
      );

    const result = await recordPurchaseAndIssueLicense({
      templateId: 't1',
      buyerEmail: 'b@example.com',
      source: 'manual',
      externalId: 'sale-1',
      amountCents: 0,
      currency: 'USD',
      status: 'completed',
    });

    expect(result.id).toBe('p1');
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });
});
