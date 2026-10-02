/**
 * @file route.test.ts
 * Tests for POST /api/user/licenses/[id]/rotate
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/modules/commerce/repository', () => ({
  licenseRepository: {
    generateKey: vi.fn().mockResolvedValue('NOKT-NEW1-NEW2-NEW3-NEW4'),
  },
}));

vi.mock('@/modules/marketplace/templateService', () => ({
  generateLicenseKey: vi.fn().mockReturnValue('TL-NEW-KEY-12345'),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    license: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    templateLicense: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { POST } from '../route';

describe('POST /api/user/licenses/[id]/rotate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('oturum yoksa 401 Unauthorized döner', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/user/licenses/lic_1/rotate', {
      method: 'POST',
    });
    const res = await POST(req, { params: { id: 'lic_1' } });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('lisans bulunamazsa 404 döner', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user_1', email: 'user@test.com' },
    } as any);

    vi.mocked(prisma.license.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.templateLicense.findUnique).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/user/licenses/lic_not_found/rotate', {
      method: 'POST',
    });
    const res = await POST(req, { params: { id: 'lic_not_found' } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
  });

  it('başkasına ait lisansı yenilemeye çalışırsa 403 Forbidden döner', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user_attacker', email: 'attacker@test.com', role: 'user' },
    } as any);

    vi.mocked(prisma.license.findUnique).mockResolvedValue({
      id: 'lic_victim',
      key: 'NOKT-OLD1-OLD2-OLD3-OLD4',
      userId: 'user_victim',
      status: 'active',
      customer: { userId: 'user_victim', email: 'victim@test.com' },
      product: { id: 'prod_1', title: 'Test App', slug: 'test-app', fileUrl: '' },
    } as any);

    const req = new NextRequest('http://localhost/api/user/licenses/lic_victim/rotate', {
      method: 'POST',
    });
    const res = await POST(req, { params: { id: 'lic_victim' } });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
  });

  it('lisans iptal edilmiş (revoked) ise 400 döner', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user_1', email: 'user@test.com', role: 'user' },
    } as any);

    vi.mocked(prisma.license.findUnique).mockResolvedValue({
      id: 'lic_1',
      key: 'NOKT-OLD1-OLD2-OLD3-OLD4',
      userId: 'user_1',
      status: 'revoked',
      customer: { userId: 'user_1', email: 'user@test.com' },
      product: { id: 'prod_1', title: 'Test App', slug: 'test-app', fileUrl: '' },
    } as any);

    const req = new NextRequest('http://localhost/api/user/licenses/lic_1/rotate', {
      method: 'POST',
    });
    const res = await POST(req, { params: { id: 'lic_1' } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.message).toContain('İptal edilmiş');
  });

  it('lisans süresi dolmuş (expired) ise 400 döner', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user_1', email: 'user@test.com', role: 'user' },
    } as any);

    vi.mocked(prisma.license.findUnique).mockResolvedValue({
      id: 'lic_1',
      key: 'NOKT-OLD1-OLD2-OLD3-OLD4',
      userId: 'user_1',
      status: 'expired',
      customer: { userId: 'user_1', email: 'user@test.com' },
      product: { id: 'prod_1', title: 'Test App', slug: 'test-app', fileUrl: '' },
    } as any);

    const req = new NextRequest('http://localhost/api/user/licenses/lic_1/rotate', {
      method: 'POST',
    });
    const res = await POST(req, { params: { id: 'lic_1' } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.message).toContain('Süresi dolmuş');
  });

  it('son 10 saniye içinde zaten yenilenmişse spam engellemek için 400 döner', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user_1', email: 'user@test.com', role: 'user' },
    } as any);

    vi.mocked(prisma.license.findUnique).mockResolvedValue({
      id: 'lic_1',
      key: 'NOKT-OLD1-OLD2-OLD3-OLD4',
      userId: 'user_1',
      status: 'active',
      customer: { userId: 'user_1', email: 'user@test.com' },
      product: { id: 'prod_1', title: 'Test App', slug: 'test-app', fileUrl: '' },
      metadata: {
        lastRotatedAt: new Date(Date.now() - 2000).toISOString(), // 2 saniye önce
      },
    } as any);

    const req = new NextRequest('http://localhost/api/user/licenses/lic_1/rotate', {
      method: 'POST',
    });
    const res = await POST(req, { params: { id: 'lic_1' } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.message).toContain('10 saniye');
  });

  it('başarılı rotasyonda yeni lisans anahtarı üretir, cihaz aktivasyonlarını sıfırlar ve 200 döner', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user_1', email: 'user@test.com', role: 'user' },
    } as any);

    vi.mocked(prisma.license.findUnique).mockResolvedValue({
      id: 'lic_1',
      key: 'NOKT-OLD1-OLD2-OLD3-OLD4',
      userId: 'user_1',
      status: 'active',
      currentActivations: 2,
      maxActivations: 3,
      customer: { userId: 'user_1', email: 'user@test.com' },
      product: { id: 'prod_1', title: 'Test Desktop App', slug: 'test-app', fileUrl: '' },
      metadata: {
        existingField: 'kept',
      },
    } as any);

    vi.mocked(prisma.license.update).mockResolvedValue({
      id: 'lic_1',
      key: 'NOKT-NEW1-NEW2-NEW3-NEW4',
      status: 'active',
      currentActivations: 0,
      maxActivations: 3,
      expiresAt: null,
      updatedAt: new Date(),
      product: { id: 'prod_1', title: 'Test Desktop App', slug: 'test-app', fileUrl: '' },
    } as any);

    const req = new NextRequest('http://localhost/api/user/licenses/lic_1/rotate', {
      method: 'POST',
    });
    const res = await POST(req, { params: { id: 'lic_1' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.license.key).toBe('NOKT-NEW1-NEW2-NEW3-NEW4');
    expect(json.data.license.currentActivations).toBe(0);

    // prisma update çağrısını doğrula
    expect(prisma.license.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lic_1' },
        data: expect.objectContaining({
          key: 'NOKT-NEW1-NEW2-NEW3-NEW4',
          currentActivations: 0,
          activations: [],
          metadata: expect.objectContaining({
            existingField: 'kept',
            previousKeys: expect.arrayContaining([
              expect.objectContaining({
                key: 'NOKT-OLD1-OLD2-OLD3-OLD4',
                activationsCountBeforeRotate: 2,
              }),
            ]),
          }),
        }),
      })
    );
  });
});
