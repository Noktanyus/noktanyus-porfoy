import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSession = vi.hoisted(() => ({
  current: { user: { id: 'admin-1', email: 'admin@noktanyus.com', role: 'admin' } } as any,
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => mockSession.current),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

const mockPrisma = vi.hoisted(() => ({
  license: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  digitalProduct: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));

import { GET as getLicenses, POST as createLicense } from '../route';
import { PATCH as patchLicense } from '../[id]/route';

describe('Admin Licenses API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.current = {
      user: { id: 'admin-1', email: 'admin@noktanyus.com', role: 'admin' },
    };
  });

  it('admin olmayan kullanıcının erişimini engeller (403)', async () => {
    mockSession.current = {
      user: { id: 'user-1', email: 'user@example.com', role: 'user' },
    };

    const req = new NextRequest('http://localhost/api/admin/licenses');
    const res = await getLicenses(req);
    expect(res.status).toBe(403);
  });

  it('PATCH extend ile lisans süresini uzatır', async () => {
    const existing = {
      id: 'lic-1',
      key: 'NOKT-1111-2222-3333-4444',
      status: 'active',
      expiresAt: new Date(Date.now() + 5 * 86400000),
      currentActivations: 1,
      maxActivations: 1,
      customer: { email: 'customer@test.com' },
      product: { title: 'Masaüstü Bot' },
    };

    mockPrisma.license.findUnique.mockResolvedValue(existing);
    mockPrisma.license.update.mockImplementation(async ({ data }: any) => ({
      ...existing,
      ...data,
      order: null,
    }));

    const req = new NextRequest('http://localhost/api/admin/licenses/lic-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'extend', days: 30 }),
    });

    const res = await patchLicense(req, { params: { id: 'lic-1' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.license.update).toHaveBeenCalled();
  });

  it('PATCH suspend ile lisansı dondurur', async () => {
    const existing = {
      id: 'lic-1',
      key: 'NOKT-1111-2222-3333-4444',
      status: 'active',
      customer: { email: 'customer@test.com' },
      product: { title: 'Masaüstü Bot' },
    };

    mockPrisma.license.findUnique.mockResolvedValue(existing);
    mockPrisma.license.update.mockResolvedValue({
      ...existing,
      status: 'suspended',
      order: null,
    });

    const req = new NextRequest('http://localhost/api/admin/licenses/lic-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'suspend' }),
    });

    const res = await patchLicense(req, { params: { id: 'lic-1' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.license.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'suspended' }),
      })
    );
  });

  it('PATCH revoke ile lisansı iptal eder', async () => {
    const existing = {
      id: 'lic-1',
      key: 'NOKT-1111-2222-3333-4444',
      status: 'active',
      customer: { email: 'customer@test.com' },
      product: { title: 'Masaüstü Bot' },
    };

    mockPrisma.license.findUnique.mockResolvedValue(existing);
    mockPrisma.license.update.mockResolvedValue({
      ...existing,
      status: 'revoked',
      revokeReason: 'İade edildi',
      order: null,
    });

    const req = new NextRequest('http://localhost/api/admin/licenses/lic-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'revoke', reason: 'İade edildi' }),
    });

    const res = await patchLicense(req, { params: { id: 'lic-1' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.license.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'revoked',
          revokeReason: 'İade edildi',
        }),
      })
    );
  });

  it('PATCH reset_activations ile cihaz kayıtlarını sıfırlar', async () => {
    const existing = {
      id: 'lic-1',
      key: 'NOKT-1111-2222-3333-4444',
      status: 'active',
      currentActivations: 2,
      activations: [{ ip: '1.2.3.4' }],
      customer: { email: 'customer@test.com' },
      product: { title: 'Masaüstü Bot' },
    };

    mockPrisma.license.findUnique.mockResolvedValue(existing);
    mockPrisma.license.update.mockResolvedValue({
      ...existing,
      currentActivations: 0,
      activations: [],
      order: null,
    });

    const req = new NextRequest('http://localhost/api/admin/licenses/lic-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'reset_activations' }),
    });

    const res = await patchLicense(req, { params: { id: 'lic-1' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.license.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentActivations: 0,
          activations: [],
        }),
      })
    );
  });
});
