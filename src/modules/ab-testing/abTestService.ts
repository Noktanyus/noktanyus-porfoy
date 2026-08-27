/**
 * A/B Testing (Bucket Experiment) Servisi.
 *
 * - Sticky variant atamasi (sessionId bazli): ayni session hep ayni variant'i gorur.
 * - Weighted random dagitim: weight degerlerine gore orantili secim.
 * - EXPOSURE tracking: variant goruntulenince event kaydedilir.
 * - CONVERSION tracking: istenen aksiyon (alis, signup, vb.) gerceklesince event kaydedilir.
 * - getResults: variant bazli exposures / conversions / conversion rate hesaplar.
 *
 * Phase "Multi-currency + Tax + A/B Testing" kapsaminda eklendi.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

type AssignmentResult = {
  variantId: string;
  config: Record<string, unknown>;
};

export const abTestService = {
  /**
   * Sticky variant atamasi yapar.
   * Daha once EXPOSURE event'i kaydedilmis session'lar ayni variant'i alir.
   * Ilk kez gelen session'lar weighted random ile dagitilir.
   */
  async assignVariant(experimentName: string, sessionId: string): Promise<string | null> {
    const experiment = await prisma.aBExperiment.findFirst({
      where: { name: experimentName, status: 'running' },
      include: { variants: true },
    });

    if (!experiment || experiment.variants.length === 0) {
      return null;
    }

    // Sticky check: bu session daha once variant'a atanmis mi?
    const existingEvent = await prisma.aBEvent.findFirst({
      where: {
        experimentId: experiment.id,
        sessionId,
        eventType: 'EXPOSURE',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (existingEvent) {
      return existingEvent.variantId;
    }

    // Weighted random assignment
    const totalWeight = experiment.variants.reduce((sum, v) => sum + Math.max(0, v.weight), 0);
    if (totalWeight <= 0) {
      // Tum weight'ler 0 ise ilk variant'i sec (guvenli fallback)
      return experiment.variants[0].id;
    }

    let random = Math.random() * totalWeight;
    let chosenVariant = experiment.variants[0];

    for (const variant of experiment.variants) {
      const w = Math.max(0, variant.weight);
      random -= w;
      if (random <= 0) {
        chosenVariant = variant;
        break;
      }
    }

    return chosenVariant.id;
  },

  /**
   * Variant goruntuleme (exposure) tracking.
   * Ilk cagirildiginda variant atar, sticky olarak session'a baglar.
   * Tek sorguyle experiment + variants alip tekrar DB hit etmez.
   */
  async trackExposure(
    experimentName: string,
    sessionId: string,
    userId?: string
  ): Promise<AssignmentResult | null> {
    try {
      const experiment = await prisma.aBExperiment.findFirst({
        where: { name: experimentName, status: 'running' },
        include: { variants: true },
      });

      if (!experiment || experiment.variants.length === 0) {
        return null;
      }

      // Sticky check
      const existingEvent = await prisma.aBEvent.findFirst({
        where: {
          experimentId: experiment.id,
          sessionId,
          eventType: 'EXPOSURE',
        },
        orderBy: { createdAt: 'asc' },
      });

      let variantId: string;
      if (existingEvent) {
        variantId = existingEvent.variantId;
      } else {
        // Weighted random selection
        const totalWeight = experiment.variants.reduce((sum, v) => sum + Math.max(0, v.weight), 0);
        let chosenVariant = experiment.variants[0];

        if (totalWeight > 0) {
          let random = Math.random() * totalWeight;
          for (const variant of experiment.variants) {
            const w = Math.max(0, variant.weight);
            random -= w;
            if (random <= 0) {
              chosenVariant = variant;
              break;
            }
          }
        }
        variantId = chosenVariant.id;

        // Idempotent: ayni session icin duplicate exposure yazma.
        try {
          await prisma.aBEvent.create({
            data: {
              experimentId: experiment.id,
              variantId,
              sessionId,
              userId,
              eventType: 'EXPOSURE',
            },
          });
        } catch {
          // Duplicate (race condition) tolere edilir.
        }
      }

      // Variant + config'i bul
      const variant = experiment.variants.find((v) => v.id === variantId);
      return {
        variantId,
        config: (variant?.config as Record<string, unknown>) ?? {},
      };
    } catch (error) {
      logger.error('AB test exposure tracking failed', {
        experimentName,
        sessionId,
        error: String(error),
      });
      return null;
    }
  },

  /**
   * Conversion (donusum) tracking.
   * Ayni session'in mevcut sticky variant'ina CONVERSION event'i ekler.
   */
  async trackConversion(
    experimentName: string,
    sessionId: string,
    value?: number,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const variantId = await this.assignVariant(experimentName, sessionId);
      if (!variantId) return false;

      // assignVariant icinden experiment id'yi almak icin tekrar sorgu gerekmez.
      // Bu sorgu sadece id'yi almak icin var (experiment mevcut olmali)
      const experiment = await prisma.aBExperiment.findFirst({
        where: { name: experimentName, status: 'running' },
        select: { id: true },
      });
      if (!experiment) return false;

      await prisma.aBEvent.create({
        data: {
          experimentId: experiment.id,
          variantId,
          sessionId,
          userId,
          eventType: 'CONVERSION',
          value,
          metadata: (metadata ?? {}) as object,
        },
      });

      return true;
    } catch (error) {
      logger.error('AB test conversion tracking failed', {
        experimentName,
        sessionId,
        error: String(error),
      });
      return false;
    }
  },

  /**
   * Variant bazli istatistikleri getirir.
   * Her variant icin exposures / conversions / conversion rate hesaplanir.
   */
  async getResults(experimentId: string): Promise<
    Array<{
      variantId: string;
      name: string;
      isControl: boolean;
      weight: number;
      exposures: number;
      conversions: number;
      conversionRate: string;
      totalValue: number;
    }>
  > {
    const variants = await prisma.aBVariant.findMany({
      where: { experimentId },
      include: {
        events: {
          select: {
            id: true,
            eventType: true,
            value: true,
          },
        },
      },
    });

    return variants.map((v) => {
      const exposures = v.events.filter((e) => e.eventType === 'EXPOSURE').length;
      const conversions = v.events.filter((e) => e.eventType === 'CONVERSION').length;
      const totalValue = v.events
        .filter((e) => e.eventType === 'CONVERSION' && typeof e.value === 'number')
        .reduce((sum, e) => sum + (e.value ?? 0), 0);
      const conversionRate = exposures > 0 ? (conversions / exposures) * 100 : 0;

      return {
        variantId: v.id,
        name: v.name,
        isControl: v.isControl,
        weight: v.weight,
        exposures,
        conversions,
        conversionRate: conversionRate.toFixed(2) + '%',
        totalValue,
      };
    });
  },

  /**
   * Experiment olusturur (admin icin).
   */
  async createExperiment(input: {
    name: string;
    description?: string;
    targetPage: string;
    variants: Array<{ name: string; weight: number; isControl?: boolean; config?: Record<string, unknown> }>;
    createdById: string;
    audienceFilter?: Record<string, unknown>;
  }): Promise<{ experimentId: string; variantIds: string[] }> {
    const experiment = await prisma.aBExperiment.create({
      data: {
        name: input.name,
        description: input.description,
        targetPage: input.targetPage,
        audienceFilter: input.audienceFilter as object,
        createdById: input.createdById,
        status: 'draft',
        variants: {
          create: input.variants.map((v) => ({
            name: v.name,
            weight: v.weight,
            isControl: v.isControl ?? false,
            config: (v.config ?? {}) as object,
          })),
        },
      },
      include: { variants: true },
    });

    return {
      experimentId: experiment.id,
      variantIds: experiment.variants.map((v) => v.id),
    };
  },

  /**
   * Experiment durumunu degistirir (running / paused / completed).
   */
  async setStatus(experimentId: string, status: 'draft' | 'running' | 'completed' | 'paused'): Promise<void> {
    const updates: Record<string, unknown> = { status };
    if (status === 'running') updates.startedAt = new Date();
    if (status === 'completed') updates.endedAt = new Date();

    await prisma.aBExperiment.update({
      where: { id: experimentId },
      data: updates,
    });
  },
};
