/**
 * Analytics Service Tests
 *
 * - getRevenueStats: aggregate matematigi, null toplam toleransi, ortalama yuvarlama
 * - getDailyRevenue: BigInt -> Number cevrimi, hata toleransi (bos seri)
 * - getFunnelStats: basamak donusum oranlari, sifira bolme korumasi
 * - getCLV: musteri bazli toplam, siralama, ortalama CLV
 * - normalizeDays: gecersiz gun degeri toleransi
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    userSubscription: {
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { analyticsService } from '../service';

// Prisma mock'lari any tipli: aggregate/count donusleri test bazinda degisiyor.
const mockPrisma = prisma as unknown as {
  order: { aggregate: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  user: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  userSubscription: { count: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('analyticsService.getRevenueStats', () => {
  it('aggregate sonuclarini dogru metriklere esler ve ortalamayi yuvarlar', async () => {
    mockPrisma.order.aggregate
      .mockResolvedValueOnce({ _sum: { totalCents: 500_000 } }) // toplam gelir
      .mockResolvedValueOnce({ _sum: { totalCents: 120_000 } }) // donem geliri
      .mockResolvedValueOnce({ _avg: { totalCents: 12_499.6 } }); // ortalama sepet
    mockPrisma.order.count
      .mockResolvedValueOnce(40) // toplam odenen siparis
      .mockResolvedValueOnce(10); // donem icinde odenen
    mockPrisma.userSubscription.count.mockResolvedValue(3);
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const stats = await analyticsService.getRevenueStats({ days: 30 });

    expect(stats.totalRevenueCents).toBe(500_000);
    expect(stats.monthRevenueCents).toBe(120_000);
    expect(stats.avgOrderValueCents).toBe(12_500); // 12499.6 -> yuvarlandi
    expect(stats.orderCount).toBe(40);
    expect(stats.paidInPeriod).toBe(10);
    expect(stats.churnedSubs).toBe(3);
    expect(stats.periodDays).toBe(30);
  });

  it('hic siparis yoksa null toplamlari 0 olarak dondurur', async () => {
    mockPrisma.order.aggregate
      .mockResolvedValueOnce({ _sum: { totalCents: null } })
      .mockResolvedValueOnce({ _sum: { totalCents: null } })
      .mockResolvedValueOnce({ _avg: { totalCents: null } });
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.userSubscription.count.mockResolvedValue(0);
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const stats = await analyticsService.getRevenueStats();

    expect(stats.totalRevenueCents).toBe(0);
    expect(stats.monthRevenueCents).toBe(0);
    expect(stats.avgOrderValueCents).toBe(0);
    expect(stats.dailyRevenue).toEqual([]);
  });

  it('gecersiz days degerini 30 gune sabitler', async () => {
    mockPrisma.order.aggregate
      .mockResolvedValueOnce({ _sum: { totalCents: 0 } })
      .mockResolvedValueOnce({ _sum: { totalCents: 0 } })
      .mockResolvedValueOnce({ _avg: { totalCents: 0 } });
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.userSubscription.count.mockResolvedValue(0);
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const stats = await analyticsService.getRevenueStats({ days: -5 });

    expect(stats.periodDays).toBe(30);
  });
});

describe('analyticsService.getDailyRevenue', () => {
  it('Postgres BigInt toplamlarini Number a cevirir ve tarihi ISO gune indirger', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { day: new Date('2026-08-01T00:00:00.000Z'), revenue: BigInt(25_000) },
      { day: new Date('2026-08-02T00:00:00.000Z'), revenue: BigInt(0) },
    ]);

    const series = await analyticsService.getDailyRevenue(7);

    expect(series).toEqual([
      { day: '2026-08-01', revenueCents: 25_000 },
      { day: '2026-08-02', revenueCents: 0 },
    ]);
    // JSON serialize edilebilir olmali (BigInt kalmamali)
    expect(() => JSON.stringify(series)).not.toThrow();
  });

  it('raw sorgu patlarsa bos seri dondurur (dashboard cokmez)', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('relation does not exist'));

    await expect(analyticsService.getDailyRevenue(30)).resolves.toEqual([]);
  });
});

describe('analyticsService.getFunnelStats', () => {
  it('her basamagi onceki basamaga gore oranlar', async () => {
    mockPrisma.user.count
      .mockResolvedValueOnce(1000) // visitors
      .mockResolvedValueOnce(200) // signups
      .mockResolvedValueOnce(50); // activated
    mockPrisma.order.count
      .mockResolvedValueOnce(20) // orders
      .mockResolvedValueOnce(10); // paid

    const { stages, period } = await analyticsService.getFunnelStats({ days: 30 });

    expect(period).toBe(30);
    expect(stages.map((s) => s.name)).toEqual([
      'Visitors',
      'Signups',
      'Activated',
      'Orders',
      'Paid',
    ]);
    expect(stages[0]).toMatchObject({ value: 1000, conversionRate: 100 });
    expect(stages[1]).toMatchObject({ value: 200, conversionRate: 20 }); // 200/1000
    expect(stages[2]).toMatchObject({ value: 50, conversionRate: 25 }); // 50/200
    expect(stages[3]).toMatchObject({ value: 20, conversionRate: 40 }); // 20/50
    expect(stages[4]).toMatchObject({ value: 10, conversionRate: 50 }); // 10/20
  });

  it('bos veritabaninda sifira bolmez, tum oranlar 0 olur', async () => {
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.order.count.mockResolvedValue(0);

    const { stages } = await analyticsService.getFunnelStats();

    expect(stages[0].conversionRate).toBe(100);
    for (const stage of stages.slice(1)) {
      expect(stage.conversionRate).toBe(0);
      expect(Number.isNaN(stage.conversionRate)).toBe(false);
    }
  });
});

describe('analyticsService.getCLV', () => {
  it('musteri basina toplami hesaplar, azalan siralar ve ortalamayi bulur', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: 'u1',
        name: 'Ali',
        email: 'ali@example.com',
        orders: [{ totalCents: 10_000 }, { totalCents: 5_000 }],
      },
      {
        id: 'u2',
        name: null,
        email: 'veli@example.com',
        orders: [{ totalCents: 30_000 }],
      },
    ]);

    const result = await analyticsService.getCLV();

    expect(result.customerCount).toBe(2);
    expect(result.totalCLVCents).toBe(45_000);
    expect(result.avgCLVCents).toBe(22_500);
    // En cok harcayan basta
    expect(result.customers[0]).toMatchObject({
      userId: 'u2',
      totalSpentCents: 30_000,
      orderCount: 1,
    });
    expect(result.customers[1]).toMatchObject({
      userId: 'u1',
      totalSpentCents: 15_000,
      orderCount: 2,
    });
  });

  it('musteri yoksa ortalama CLV 0 olur (NaN degil)', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);

    const result = await analyticsService.getCLV();

    expect(result.customers).toEqual([]);
    expect(result.avgCLVCents).toBe(0);
    expect(result.totalCLVCents).toBe(0);
    expect(result.customerCount).toBe(0);
  });

  it('limit parametresi kadar musteri dondurur', async () => {
    mockPrisma.user.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        id: `u${i}`,
        name: `User ${i}`,
        email: `u${i}@example.com`,
        orders: [{ totalCents: (i + 1) * 1000 }],
      }))
    );

    const result = await analyticsService.getCLV({ limit: 3 });

    expect(result.customers).toHaveLength(3);
    expect(result.customerCount).toBe(10); // toplam sayim limitten etkilenmez
    expect(result.customers[0].totalSpentCents).toBe(10_000); // en yuksek
  });
});
