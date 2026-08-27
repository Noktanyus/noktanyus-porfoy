/**
 * A/B Testing Service Tests
 *
 * - Weighted random assignment (dagilim dogrulugu)
 * - Sticky variant atamasi (ayni session ayni variant)
 * - Exposure tracking (event yazma + config getirme)
 * - Conversion tracking
 * - getResults (exposure / conversion / conversion rate hesabi)
 * - DB hatasi toleransi
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prisma mock'u any tipli: include/select sonucu varyant testlerinde
// farkli sekiller dondurebiliyoruz (variants dahil / haric).
vi.mock('@/lib/prisma', () => ({
  prisma: {
    aBExperiment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    aBVariant: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    aBEvent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { abTestService } from '../abTestService';

const mockExperimentBase = {
  id: 'exp1',
  name: 'pricing-cta',
  description: 'CTA button color test',
  status: 'running',
  targetPage: '/',
  audienceFilter: null,
  startedAt: new Date(),
  endedAt: null,
  winnerVariantId: null,
  createdById: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockVariants = [
  { id: 'v1', experimentId: 'exp1', name: 'Control', weight: 50, config: { ctaColor: 'blue' }, isControl: true },
  { id: 'v2', experimentId: 'exp1', name: 'Variant A', weight: 50, config: { ctaColor: 'green' }, isControl: false },
];

describe('ABTestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assignVariant', () => {
    it('experiment bulunamazsa null doner', async () => {
      vi.mocked(prisma.aBExperiment.findFirst).mockResolvedValueOnce(null);
      const result = await abTestService.assignVariant('pricing-cta', 'session-1');
      expect(result).toBeNull();
    });

    it('experiment status running degilse findFirst null doner (status filter)', async () => {
      // assignVariant sorgusu sadece status='running' olanlari getirir.
      // status='draft' olan bir experiment DB tarafindan filtrelenir.
      // Bu test mock'un null dondugu durumda davranisi dogrular.
      vi.mocked(prisma.aBExperiment.findFirst).mockResolvedValueOnce(null);
      const result = await abTestService.assignVariant('pricing-cta', 'session-1');
      expect(result).toBeNull();
    });

    it('sticky: ayni session onceki variant\'i alir', async () => {
      vi.mocked(prisma.aBExperiment.findFirst).mockResolvedValueOnce({
        ...mockExperimentBase,
        variants: mockVariants,
      } as never);
      vi.mocked(prisma.aBEvent.findFirst).mockResolvedValueOnce({
        id: 'ev1',
        experimentId: 'exp1',
        variantId: 'v1',
        sessionId: 'session-sticky',
        userId: null,
        eventType: 'EXPOSURE',
        value: null,
        metadata: {},
        createdAt: new Date(),
      });
      const result = await abTestService.assignVariant('pricing-cta', 'session-sticky');
      expect(result).toBe('v1');
    });

    it('weighted random dagitim - 50/50 split', () => {
      // Pure logic testi - DB mock'suz
      const weights = [50, 50];
      const counts = [0, 0];
      for (let i = 0; i < 1000; i++) {
        const totalWeight = weights.reduce((s, w) => s + w, 0);
        let random = Math.random() * totalWeight;
        let chosen = 0;
        for (let j = 0; j < weights.length; j++) {
          random -= weights[j];
          if (random <= 0) {
            chosen = j;
            break;
          }
        }
        counts[chosen]++;
      }
      // Her variant ~500 olmali
      expect(Math.abs(counts[0] - counts[1])).toBeLessThan(150);
    });

    it('70/30 dagilim - kontrol variant daha fazla exposure alir', () => {
      const weights = [70, 30];
      const counts = [0, 0];
      for (let i = 0; i < 1000; i++) {
        const totalWeight = weights.reduce((s, w) => s + w, 0);
        let random = Math.random() * totalWeight;
        let chosen = 0;
        for (let j = 0; j < weights.length; j++) {
          random -= weights[j];
          if (random <= 0) {
            chosen = j;
            break;
          }
        }
        counts[chosen]++;
      }
      // Control variant (index 0) daha fazla olmali
      expect(counts[0]).toBeGreaterThan(counts[1]);
      // ~700/300 civari olmali
      expect(counts[0]).toBeGreaterThan(550);
      expect(counts[1]).toBeLessThan(450);
    });

    it('ilk kez gelen session weighted random ile variant atanir', async () => {
      vi.mocked(prisma.aBExperiment.findFirst).mockResolvedValueOnce({
        ...mockExperimentBase,
        variants: mockVariants,
      } as never);
      vi.mocked(prisma.aBEvent.findFirst).mockResolvedValueOnce(null);
      const result = await abTestService.assignVariant('pricing-cta', 'new-session');
      expect(result).toMatch(/^v[12]$/);
    });

    it('tum weight\'ler 0 ise ilk variant secilir', async () => {
      const zeroWeightVariants = [
        { id: 'v1', experimentId: 'exp1', name: 'Zero A', weight: 0, config: {}, isControl: false },
        { id: 'v2', experimentId: 'exp1', name: 'Zero B', weight: 0, config: {}, isControl: false },
      ];
      vi.mocked(prisma.aBExperiment.findFirst).mockResolvedValueOnce({
        ...mockExperimentBase,
        variants: zeroWeightVariants,
      } as never);
      vi.mocked(prisma.aBEvent.findFirst).mockResolvedValueOnce(null);
      const result = await abTestService.assignVariant('pricing-cta', 'sess-zero');
      expect(result).toBe('v1'); // fallback
    });
  });

  describe('trackExposure', () => {
    it('variant + config doner', async () => {
      vi.mocked(prisma.aBExperiment.findFirst).mockResolvedValueOnce({
        ...mockExperimentBase,
        variants: mockVariants,
      } as never);
      vi.mocked(prisma.aBEvent.findFirst).mockResolvedValueOnce(null); // sticky check
      vi.mocked(prisma.aBEvent.create).mockResolvedValueOnce({} as never);

      const result = await abTestService.trackExposure('pricing-cta', 'sess-1');
      expect(result).not.toBeNull();
      // weighted random v1 veya v2 doner; config uygun olmali
      expect(result?.variantId).toMatch(/^v[12]$/);
      expect(result?.config).toHaveProperty('ctaColor');
      expect(prisma.aBEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            experimentId: 'exp1',
            eventType: 'EXPOSURE',
            sessionId: 'sess-1',
          }),
        })
      );
    });

    it('idempotent: ayni session ikinci kez exposure yazmaz', async () => {
      vi.mocked(prisma.aBExperiment.findFirst).mockResolvedValueOnce({
        ...mockExperimentBase,
        variants: mockVariants,
      } as never);
      // sticky check -> mevcut event var
      vi.mocked(prisma.aBEvent.findFirst).mockResolvedValueOnce({
        id: 'ev1',
        experimentId: 'exp1',
        variantId: 'v1',
        sessionId: 'sess-dup',
        userId: null,
        eventType: 'EXPOSURE',
        value: null,
        metadata: {},
        createdAt: new Date(),
      });

      const result = await abTestService.trackExposure('pricing-cta', 'sess-dup');
      expect(result).not.toBeNull();
      expect(result?.variantId).toBe('v1');
      expect(result?.config).toEqual({ ctaColor: 'blue' });
      expect(prisma.aBEvent.create).not.toHaveBeenCalled();
    });

    it('experiment bulunamazsa null doner', async () => {
      vi.mocked(prisma.aBExperiment.findFirst).mockResolvedValueOnce(null);
      const result = await abTestService.trackExposure('unknown-exp', 'sess');
      expect(result).toBeNull();
    });

    it('DB hatasi durumunda null doner', async () => {
      vi.mocked(prisma.aBExperiment.findFirst).mockRejectedValueOnce(new Error('DB down'));
      const result = await abTestService.trackExposure('pricing-cta', 'sess');
      expect(result).toBeNull();
    });
  });

  describe('trackConversion', () => {
    it('variant\'a conversion event\'i ekler', async () => {
      // assignVariant icin: experiment + variants (with sticky existing event v1)
      vi.mocked(prisma.aBExperiment.findFirst).mockResolvedValueOnce({
        ...mockExperimentBase,
        variants: mockVariants,
      } as never);
      vi.mocked(prisma.aBEvent.findFirst).mockResolvedValueOnce({
        id: 'ev-sticky',
        experimentId: 'exp1',
        variantId: 'v1',
        sessionId: 'sess-conv',
        userId: null,
        eventType: 'EXPOSURE',
        value: null,
        metadata: {},
        createdAt: new Date(),
      });
      // trackConversion icin: experiment id select
      vi.mocked(prisma.aBExperiment.findFirst).mockResolvedValueOnce({
        id: 'exp1',
      } as never);
      vi.mocked(prisma.aBEvent.create).mockResolvedValueOnce({} as never);

      const ok = await abTestService.trackConversion('pricing-cta', 'sess-conv', 99.5, 'user-1');
      expect(ok).toBe(true);
      expect(prisma.aBEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            experimentId: 'exp1',
            variantId: 'v1',
            sessionId: 'sess-conv',
            userId: 'user-1',
            eventType: 'CONVERSION',
            value: 99.5,
          }),
        })
      );
    });

    it('experiment yoksa false doner', async () => {
      // assignVariant: experiment bulunamadi
      vi.mocked(prisma.aBExperiment.findFirst).mockResolvedValueOnce(null);
      const ok = await abTestService.trackConversion('unknown-exp', 'sess');
      expect(ok).toBe(false);
    });

    it('DB hatasi durumunda false doner (hata loglanir)', async () => {
      vi.mocked(prisma.aBExperiment.findFirst).mockRejectedValueOnce(new Error('DB down'));
      const ok = await abTestService.trackConversion('pricing-cta', 'sess');
      expect(ok).toBe(false);
    });
  });

  describe('getResults', () => {
    it('variant bazli conversion rate hesaplar', async () => {
      vi.mocked(prisma.aBVariant.findMany).mockResolvedValueOnce([
        {
          ...mockVariants[0],
          events: [
            { id: 'e1', eventType: 'EXPOSURE', value: null },
            { id: 'e2', eventType: 'EXPOSURE', value: null },
            { id: 'e3', eventType: 'CONVERSION', value: 100 },
          ],
        },
        {
          ...mockVariants[1],
          events: [
            { id: 'e4', eventType: 'EXPOSURE', value: null },
            { id: 'e5', eventType: 'CONVERSION', value: 50 },
          ],
        },
      ] as never);

      const results = await abTestService.getResults('exp1');
      expect(results).toHaveLength(2);
      // Variant 1: 2 exposures, 1 conversion -> 50%
      expect(results[0].exposures).toBe(2);
      expect(results[0].conversions).toBe(1);
      expect(results[0].conversionRate).toBe('50.00%');
      expect(results[0].totalValue).toBe(100);
      // Variant 2: 1 exposure, 1 conversion -> 100%
      expect(results[1].exposures).toBe(1);
      expect(results[1].conversions).toBe(1);
      expect(results[1].conversionRate).toBe('100.00%');
    });

    it('exposure yoksa 0 doner', async () => {
      vi.mocked(prisma.aBVariant.findMany).mockResolvedValueOnce([
        { ...mockVariants[0], events: [] },
      ] as never);

      const results = await abTestService.getResults('exp1');
      expect(results[0].exposures).toBe(0);
      expect(results[0].conversions).toBe(0);
      expect(results[0].conversionRate).toBe('0.00%');
    });
  });

  describe('createExperiment', () => {
    it('experiment + variantlari olusturur', async () => {
      vi.mocked(prisma.aBExperiment.create).mockResolvedValueOnce({
        ...mockExperimentBase,
        variants: [
          { id: 'v1', experimentId: 'exp1', name: 'Control', weight: 50, config: {}, isControl: true },
          { id: 'v2', experimentId: 'exp1', name: 'Variant A', weight: 50, config: {}, isControl: false },
        ],
      } as never);

      const result = await abTestService.createExperiment({
        name: 'test-exp',
        targetPage: '/',
        createdById: 'admin1',
        variants: [
          { name: 'Control', weight: 50, isControl: true },
          { name: 'Variant A', weight: 50 },
        ],
      });
      expect(result.experimentId).toBe('exp1');
      expect(result.variantIds).toHaveLength(2);
      expect(prisma.aBExperiment.create).toHaveBeenCalled();
    });
  });

  describe('setStatus', () => {
    it('status\'u running yapar ve startedAt set eder', async () => {
      vi.mocked(prisma.aBExperiment.update).mockResolvedValueOnce({} as never);
      await abTestService.setStatus('exp1', 'running');
      expect(prisma.aBExperiment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exp1' },
          data: expect.objectContaining({
            status: 'running',
            startedAt: expect.any(Date),
          }),
        })
      );
    });

    it('status\'u completed yapar ve endedAt set eder', async () => {
      vi.mocked(prisma.aBExperiment.update).mockResolvedValueOnce({} as never);
      await abTestService.setStatus('exp1', 'completed');
      expect(prisma.aBExperiment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'completed',
            endedAt: expect.any(Date),
          }),
        })
      );
    });
  });
});
