/**
 * @file refundEligibility.test.ts
 * 1 Günlük Koşulsuz Hak İadesi (Kredi & Abonelik) Uygunluk Testleri
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRefundEligibility } from '../refundEligibility';

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      order: {
        findUnique: vi.fn(),
      },
      apiCreditLedger: {
        findFirst: vi.fn(),
        count: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      apiKey: {
        findMany: vi.fn(),
      },
      apiKeyUsage: {
        count: vi.fn(),
      },
    },
  };
});

import { prisma } from '@/lib/prisma';

describe('checkRefundEligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sipariş bulunamadığında eligible: false döner', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const result = await checkRefundEligibility('ord_not_found');
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Sipariş bulunamadı');
  });

  it('sipariş zaten iade edilmişse eligible: false döner', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord_1',
      status: 'REFUNDED',
      createdAt: new Date(),
      metadata: { type: 'api_topup', credits: 1000 },
      licenses: [],
      items: [],
    } as any);

    const result = await checkRefundEligibility('ord_1');
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('zaten iade edilmiştir');
  });

  it('sipariş ne kredi ne abonelik ise (örn. dijital tema/ürün) eligible: false döner', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord_2',
      status: 'PAID',
      createdAt: new Date(),
      metadata: { type: 'digital_product' },
      notes: null,
      licenses: [],
      items: [],
    } as any);

    const result = await checkRefundEligibility('ord_2');
    expect(result.eligible).toBe(false);
    expect(result.orderType).toBe('other');
    expect(result.reason).toContain('yalnızca API kredi paketleri ve abonelikler için geçerlidir');
  });

  it('satın almanın üzerinden 24 saatten fazla geçmişse süresi dolduğu için eligible: false döner', async () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord_3',
      status: 'PAID',
      createdAt: twoDaysAgo,
      metadata: { type: 'api_topup', credits: 5000 },
      licenses: [],
      items: [],
    } as any);

    const result = await checkRefundEligibility('ord_3');
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('24 saat) dolmuştur');
    expect(result.hoursRemaining).toBe(0);
  });

  describe('API Kredi Siparişi Kontrolleri', () => {
    it('satın alımdan sonra api_call (kredi tüketimi) yapılmışsa iadeyi reddeder', async () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_credit_1',
        userId: 'user_1',
        status: 'PAID',
        createdAt: oneHourAgo,
        metadata: { type: 'api_topup', credits: 1000 },
        licenses: [],
        items: [],
      } as any);

      vi.mocked(prisma.apiCreditLedger.count).mockResolvedValue(5); // 5 istek yapılmış

      const result = await checkRefundEligibility('ord_credit_1', 'user_1');
      expect(result.eligible).toBe(false);
      expect(result.orderType).toBe('api_topup');
      expect(result.rightsUsed).toBe(5);
      expect(result.reason).toContain('kullanım yapıldığı için');
    });

    it('kullanıcının mevcut bakiyesi satın alınan paketin altındaysa iadeyi reddeder', async () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_credit_2',
        userId: 'user_1',
        status: 'PAID',
        createdAt: oneHourAgo,
        metadata: { type: 'api_topup', credits: 1000 },
        licenses: [],
        items: [],
      } as any);

      vi.mocked(prisma.apiCreditLedger.count).mockResolvedValue(0);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        apiCreditBalance: 400, // 1000 olması gerekirken 400 kalmış
      } as any);

      const result = await checkRefundEligibility('ord_credit_2', 'user_1');
      expect(result.eligible).toBe(false);
      expect(result.orderType).toBe('api_topup');
      expect(result.reason).toContain('satın alınan paketin altında olduğu için');
    });

    it('24 saat içinde ve 0 kullanım ile API kredi iadesine izin verir', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_credit_ok',
        userId: 'user_1',
        status: 'PAID',
        createdAt: twoHoursAgo,
        metadata: { type: 'api_topup', credits: 5000 },
        licenses: [],
        items: [],
      } as any);

      vi.mocked(prisma.apiCreditLedger.count).mockResolvedValue(0);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        apiCreditBalance: 5100, // yeterli bakiye
      } as any);

      const result = await checkRefundEligibility('ord_credit_ok', 'user_1');
      expect(result.eligible).toBe(true);
      expect(result.orderType).toBe('api_topup');
      expect(result.rightsUsed).toBe(0);
      expect(result.hoursRemaining).toBeGreaterThan(20);
    });
  });

  describe('Abonelik Siparişi Kontrolleri', () => {
    it('abonelik sonrası API anahtarıyla istek yapılmışsa iadeyi reddeder', async () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_sub_1',
        userId: 'user_sub_1',
        status: 'PAID',
        createdAt: threeHoursAgo,
        metadata: { type: 'subscription', planSlug: 'pro' },
        licenses: [],
        items: [],
      } as any);

      vi.mocked(prisma.apiKey.findMany).mockResolvedValue([{ id: 'key_1' }] as any);
      vi.mocked(prisma.apiKeyUsage.count).mockResolvedValue(12); // 12 API isteği yapılmış

      const result = await checkRefundEligibility('ord_sub_1', 'user_sub_1');
      expect(result.eligible).toBe(false);
      expect(result.orderType).toBe('subscription');
      expect(result.rightsUsed).toBe(12);
      expect(result.reason).toContain('API kullanımı yapıldığı için');
    });

    it('aboneliğe ait lisans aktive edilmişse iadeyi reddeder', async () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_sub_lic',
        userId: 'user_sub_1',
        status: 'PAID',
        createdAt: oneHourAgo,
        metadata: { type: 'subscription', planSlug: 'enterprise' },
        licenses: [{ id: 'lic_1', currentActivations: 1 }],
        items: [],
      } as any);

      vi.mocked(prisma.apiKey.findMany).mockResolvedValue([]);

      const result = await checkRefundEligibility('ord_sub_lic', 'user_sub_1');
      expect(result.eligible).toBe(false);
      expect(result.orderType).toBe('subscription');
      expect(result.reason).toContain('lisans anahtarı aktive edildiği için');
    });

    it('24 saat içinde ve 0 API çağrısı ile abonelik iadesine izin verir', async () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_sub_ok',
        userId: 'user_sub_1',
        status: 'PAID',
        createdAt: oneHourAgo,
        metadata: { type: 'subscription', planSlug: 'pro' },
        licenses: [],
        items: [],
      } as any);

      vi.mocked(prisma.apiKey.findMany).mockResolvedValue([{ id: 'key_1' }] as any);
      vi.mocked(prisma.apiKeyUsage.count).mockResolvedValue(0); // 0 istek

      const result = await checkRefundEligibility('ord_sub_ok', 'user_sub_1');
      expect(result.eligible).toBe(true);
      expect(result.orderType).toBe('subscription');
      expect(result.rightsUsed).toBe(0);
      expect(result.hoursRemaining).toBeGreaterThan(22);
    });
  });
});
