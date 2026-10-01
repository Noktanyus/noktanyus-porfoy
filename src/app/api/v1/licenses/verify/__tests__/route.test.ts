import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockPrisma = vi.hoisted(() => ({
  license: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { POST as verifyLicense } from '../route';

describe('/api/v1/licenses/verify API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bulunamayan lisans için valid: false ve reason: not_found döner', async () => {
    mockPrisma.license.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/v1/licenses/verify', {
      method: 'POST',
      body: JSON.stringify({ key: 'NOKT-XXXX-YYYY-ZZZZ' }),
    });

    const res = await verifyLicense(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.valid).toBe(false);
    expect(json.data.reason).toBe('not_found');
  });

  it('aktif lisansı başarıyla doğrular', async () => {
    mockPrisma.license.findUnique.mockResolvedValueOnce({
      id: 'lic-1',
      key: 'NOKT-1111-2222-3333-4444',
      status: 'active',
      type: 'ONE_TIME',
      maxActivations: 2,
      currentActivations: 0,
      expiresAt: null,
      createdAt: new Date(),
      activations: [],
      product: {
        id: 'p-1',
        title: 'Masaüstü Stok Yönetimi',
        slug: 'stok-yonetimi',
        version: '1.0.0',
        active: true,
      },
    });

    const req = new NextRequest('http://localhost/api/v1/licenses/verify', {
      method: 'POST',
      body: JSON.stringify({ key: 'NOKT-1111-2222-3333-4444' }),
    });

    const res = await verifyLicense(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.valid).toBe(true);
    expect(json.data.product.title).toBe('Masaüstü Stok Yönetimi');
    expect(json.data.license.key).toBe('NOKT-1111-2222-3333-4444');
  });

  it('süresi dolmuş lisans için valid: false ve reason: expired döner', async () => {
    mockPrisma.license.findUnique.mockResolvedValueOnce({
      id: 'lic-expired',
      key: 'NOKT-EXPIRED-KEY',
      status: 'active',
      type: 'SUBSCRIPTION',
      maxActivations: 1,
      currentActivations: 0,
      expiresAt: new Date(Date.now() - 86400000), // Dün dolmuş
      activations: [],
      product: { id: 'p-1', title: 'App', slug: 'app', version: '1.0' },
    });

    const req = new NextRequest('http://localhost/api/v1/licenses/verify', {
      method: 'POST',
      body: JSON.stringify({ key: 'NOKT-EXPIRED-KEY' }),
    });

    const res = await verifyLicense(req);
    const json = await res.json();

    expect(json.data.valid).toBe(false);
    expect(json.data.reason).toBe('expired');
  });

  it('activate=true ile aktivasyon kaydeder ve sayacı artırır', async () => {
    mockPrisma.license.findUnique.mockResolvedValueOnce({
      id: 'lic-activate',
      key: 'NOKT-ACTIVATE-KEY',
      status: 'active',
      type: 'PERPETUAL',
      maxActivations: 3,
      currentActivations: 0,
      expiresAt: null,
      activations: [],
      product: { id: 'p-1', title: 'App', slug: 'app', version: '1.0' },
    });

    mockPrisma.license.update.mockResolvedValueOnce({
      id: 'lic-activate',
      currentActivations: 1,
    });

    const req = new NextRequest('http://localhost/api/v1/licenses/verify', {
      method: 'POST',
      body: JSON.stringify({
        key: 'NOKT-ACTIVATE-KEY',
        activate: true,
        machineId: 'MACHINE-UUID-1234',
      }),
    });

    const res = await verifyLicense(req);
    const json = await res.json();

    expect(json.data.valid).toBe(true);
    expect(mockPrisma.license.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lic-activate' },
        data: expect.objectContaining({
          currentActivations: { increment: 1 },
        }),
      })
    );
  });

  it('A Uygulaması için alınan lisans B Uygulaması (appId) ile sorgulandığında product_mismatch döner', async () => {
    mockPrisma.license.findUnique.mockResolvedValueOnce({
      id: 'lic-app-a',
      key: 'NOKT-APP-A-KEY',
      status: 'active',
      type: 'ONE_TIME',
      maxActivations: 1,
      currentActivations: 0,
      expiresAt: null,
      activations: [],
      product: {
        id: 'prod-a',
        title: 'A Uygulaması Pro',
        slug: 'app-a',
        version: '1.0.0',
        active: true,
        requirements: {
          appId: 'app-a',
        },
      },
    });

    // B Uygulaması 'app-b' kimliği ile bu lisansı doğrulamaya çalışıyor:
    const req = new NextRequest('http://localhost/api/v1/licenses/verify', {
      method: 'POST',
      body: JSON.stringify({
        key: 'NOKT-APP-A-KEY',
        appId: 'app-b',
      }),
    });

    const res = await verifyLicense(req);
    const json = await res.json();

    expect(json.data.valid).toBe(false);
    expect(json.data.reason).toBe('product_mismatch');
    expect(json.data.requiredAppId).toBe('app-a');
  });

  it('Doğru appId ile sorgulandığında lisansı doğrular', async () => {
    mockPrisma.license.findUnique.mockResolvedValueOnce({
      id: 'lic-app-a',
      key: 'NOKT-APP-A-KEY',
      status: 'active',
      type: 'ONE_TIME',
      maxActivations: 1,
      currentActivations: 0,
      expiresAt: null,
      activations: [],
      product: {
        id: 'prod-a',
        title: 'A Uygulaması Pro',
        slug: 'app-a',
        version: '1.0.0',
        active: true,
        requirements: {
          appId: 'app-a',
        },
      },
    });

    const req = new NextRequest('http://localhost/api/v1/licenses/verify', {
      method: 'POST',
      body: JSON.stringify({
        key: 'NOKT-APP-A-KEY',
        appId: 'app-a',
      }),
    });

    const res = await verifyLicense(req);
    const json = await res.json();

    expect(json.data.valid).toBe(true);
    expect(json.data.product.appId).toBe('app-a');
  });
});
