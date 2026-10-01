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
  digitalProduct: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => undefined) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { POST as createProduct } from '../route';
import { PUT as updateProduct } from '../[id]/route';

describe('Admin Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.current = {
      user: { id: 'admin-1', email: 'admin@noktanyus.com', role: 'admin' },
    };
  });

  it('admin olmayan kullanıcının ürün eklemesini engeller (403)', async () => {
    mockSession.current = {
      user: { id: 'user-1', email: 'user@example.com', role: 'user' },
    };

    const req = new NextRequest('http://localhost/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Ürün' }),
    });

    const res = await createProduct(req);
    expect(res.status).toBe(403);
  });

  it('sanal ürün / 3. parti lisans doğrulama ürünü başarıyla oluşturulur (dosya gerektirmez)', async () => {
    mockPrisma.digitalProduct.findUnique.mockResolvedValueOnce(null);
    mockPrisma.digitalProduct.create.mockResolvedValueOnce({
      id: 'prod-license-1',
      slug: 'masaustu-pos-lisansi',
      title: 'Masaüstü POS Lisansı',
      shortDescription: '3. parti POS uygulaması için doğrulama anahtarı',
      description: 'Harici masaüstü POS yazılımını aktifleştirmek için lisans anahtarı.',
      fileUrl: '',
      fileName: 'Lisans Doğrulama Anahtarı',
      fileSize: 0,
      priceCents: 150000,
      category: 'license',
      requirements: {
        deliveryType: 'license_only',
        licenseType: 'PERPETUAL',
        maxActivations: 2,
        validityDays: 0,
        thirdPartyAppName: 'Desktop POS Client',
      },
    });

    const payload = {
      slug: 'masaustu-pos-lisansi',
      title: 'Masaüstü POS Lisansı',
      shortDescription: '3. parti POS uygulaması için doğrulama anahtarı',
      description: 'Harici masaüstü POS yazılımını aktifleştirmek için lisans anahtarı. Detaylı açıklama en az 50 karakter olmalıdır ve lisans teslimi hakkında bilgi verir.',
      fileUrl: '',
      fileName: 'Lisans Doğrulama Anahtarı',
      fileSize: 0,
      priceCents: 150000,
      currency: 'try',
      category: 'license',
      requirements: {
        deliveryType: 'license_only',
        licenseType: 'PERPETUAL',
        maxActivations: 2,
        validityDays: 0,
        thirdPartyAppName: 'Desktop POS Client',
      },
    };

    const req = new NextRequest('http://localhost/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await createProduct(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.product.id).toBe('prod-license-1');
    expect(mockPrisma.digitalProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: 'license',
          fileName: 'Lisans Doğrulama Anahtarı',
          priceCents: 150000,
        }),
      })
    );
  });

  it('PUT ile lisans ayarlarını ve requirements nesnesini günceller', async () => {
    mockPrisma.digitalProduct.findUnique.mockResolvedValueOnce({
      id: 'prod-license-1',
      slug: 'masaustu-pos-lisansi',
      title: 'Masaüstü POS Lisansı',
    });

    mockPrisma.digitalProduct.update.mockResolvedValueOnce({
      id: 'prod-license-1',
      title: 'Masaüstü POS Lisansı v2',
      requirements: {
        deliveryType: 'license_only',
        maxActivations: 3,
      },
    });

    const req = new NextRequest('http://localhost/api/admin/products/prod-license-1', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Masaüstü POS Lisansı v2',
        requirements: {
          deliveryType: 'license_only',
          maxActivations: 3,
        },
      }),
    });

    const res = await updateProduct(req, { params: { id: 'prod-license-1' } });
    expect(res.status).toBe(200);
    expect(mockPrisma.digitalProduct.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prod-license-1' },
        data: expect.objectContaining({
          title: 'Masaüstü POS Lisansı v2',
          requirements: {
            deliveryType: 'license_only',
            maxActivations: 3,
          },
        }),
      })
    );
  });

  it('birden fazla süre ve fiyat paketi (30 gün 1.000 TL, 60 gün 1.800 TL) ile ürün kaydeder', async () => {
    mockPrisma.digitalProduct.findUnique.mockResolvedValueOnce(null);
    mockPrisma.digitalProduct.create.mockResolvedValueOnce({
      id: 'prod-tier-1',
      slug: 'multi-tier-app',
      title: 'Çoklu Süreli Lisanslı Uygulama',
    });

    const payload = {
      slug: 'multi-tier-app',
      title: 'Çoklu Süreli Lisanslı Uygulama',
      shortDescription: '30 gün veya 60 gün seçenekli lisans',
      description: 'Müşteriler diledikleri süre paketini seçerek satın alabilirler. Kapsamlı açıklama metni en az 50 karakter olmalıdır.',
      fileUrl: '',
      fileName: 'Lisans Doğrulama Anahtarı',
      fileSize: 0,
      priceCents: 100000,
      currency: 'try',
      category: 'license',
      requirements: {
        deliveryType: 'license_only',
        licenseType: 'SUBSCRIPTION',
        maxActivations: 1,
        pricingTiers: [
          { id: 'tier-30', days: 30, priceCents: 100000, label: '30 Günlük Lisans' },
          { id: 'tier-60', days: 60, priceCents: 180000, label: '60 Günlük Lisans (%10 İndirimli)' },
        ],
      },
    };

    const req = new NextRequest('http://localhost/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await createProduct(req);
    expect(res.status).toBe(201);
    expect(mockPrisma.digitalProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requirements: expect.objectContaining({
            pricingTiers: expect.arrayContaining([
              expect.objectContaining({ days: 30, priceCents: 100000 }),
              expect.objectContaining({ days: 60, priceCents: 180000 }),
            ]),
          }),
        }),
      })
    );
  });
});
