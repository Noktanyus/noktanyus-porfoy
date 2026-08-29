/**
 * @file Funnel Service
 * @description G2: DB'den event verilerini çekip funnel raporu üretir.
 *              Tablo: FunnelEvent { id, name, userId, sessionId, timestamp, metadata }
 */

import { prisma } from "@/lib/prisma";
import { analyzeFunnel, type FunnelReport } from "./analyzer";
import type { FunnelEvent, FunnelStep } from "./schemas";

export const funnelService = {
  /**
   * Event kaydet (tracking).
   */
  async trackEvent(event: Omit<FunnelEvent, "timestamp"> & { timestamp?: number }): Promise<void> {
    await prisma.funnelEvent.create({
      data: {
        name: event.name,
        userId: event.userId ?? null,
        sessionId: event.sessionId,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        metadata: (event.metadata as object) ?? undefined,
      },
    });
  },

  /**
   * Toplu event kaydet (batch).
   */
  async trackBatch(events: Array<Omit<FunnelEvent, "timestamp"> & { timestamp?: number }>): Promise<void> {
    await prisma.funnelEvent.createMany({
      data: events.map((e) => ({
        name: e.name,
        userId: e.userId ?? null,
        sessionId: e.sessionId,
        timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
        metadata: (e.metadata as object) ?? undefined,
      })),
    });
  },

  /**
   * Belirli zaman aralığında funnel analizi yap.
   */
  async getReport(
    steps: ReadonlyArray<FunnelStep>,
    options?: {
      rangeStart?: Date;
      rangeEnd?: Date;
      userId?: string;
    }
  ): Promise<FunnelReport> {
    const events = await prisma.funnelEvent.findMany({
      where: {
        timestamp: {
          gte: options?.rangeStart ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 gün
          lte: options?.rangeEnd ?? new Date(),
        },
        userId: options?.userId ?? undefined,
      },
      orderBy: { timestamp: "asc" },
    });

    const mapped: FunnelEvent[] = events.map((e) => ({
      name: e.name,
      userId: e.userId,
      sessionId: e.sessionId,
      timestamp: e.timestamp.getTime(),
      metadata: (e.metadata as Record<string, unknown>) ?? undefined,
    }));

    return analyzeFunnel(mapped, steps, {
      rangeStart: options?.rangeStart?.getTime(),
      rangeEnd: options?.rangeEnd?.getTime(),
    });
  },

  /**
   * Event count (debug / admin panel için).
   */
  async getEventCount(name?: string): Promise<number> {
    return prisma.funnelEvent.count({ where: name ? { name } : undefined });
  },

  /**
   * Eski event'leri temizle (retention policy).
   */
  async cleanup(retentionDays = 90): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await prisma.funnelEvent.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });
    return result.count;
  },
};