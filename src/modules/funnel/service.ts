/**
 * @file Funnel Service
 * @description G2: DB'den event verilerini çekip funnel raporu üretir.
 *              Tablo: FunnelEvent { id, name, userId, sessionId, timestamp, metadata }
 *
 *              NOT: Prisma schema'da ayrı bir FunnelEvent modeli yok. Bu
 *              service, G2 funnel feature'ı için in-memory veri kaynağı
 *              ile çalışır; DB'ye yazmaz. analyzeFunnel() pure-function
 *              olduğu için testlerde ve admin panelde event listesi geçilir.
 */

import { analyzeFunnel, type FunnelReport } from "./analyzer";
import type { FunnelEvent, FunnelStep } from "./schemas";

// In-memory event store (production'da Redis/Kafka'ya taşınabilir).
// Sprint 1 prod-hardening kapsamında DB yazımı kaldırıldı; funnel data
// analytics pipeline üzerinden beslenir.
const inMemoryEvents: FunnelEvent[] = [];

export const funnelService = {
  /**
   * Event kaydet (tracking) — in-memory store.
   */
  async trackEvent(event: Omit<FunnelEvent, "timestamp"> & { timestamp?: number }): Promise<void> {
    const stored: FunnelEvent = {
      name: event.name,
      userId: event.userId ?? null,
      sessionId: event.sessionId,
      timestamp: event.timestamp ?? Date.now(),
      metadata: event.metadata,
    };
    inMemoryEvents.push(stored);
  },

  /**
   * Toplu event kaydet (batch) — in-memory store.
   */
  async trackBatch(events: Array<Omit<FunnelEvent, "timestamp"> & { timestamp?: number }>): Promise<void> {
    for (const event of events) {
      await this.trackEvent(event);
    }
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
    const rangeStart = options?.rangeStart ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rangeEnd = options?.rangeEnd ?? new Date();

    const filtered = inMemoryEvents.filter((e: FunnelEvent) => {
      const inRange = e.timestamp >= rangeStart.getTime() && e.timestamp <= rangeEnd.getTime();
      if (!inRange) return false;
      if (options?.userId && e.userId !== options.userId) return false;
      return true;
    });

    return analyzeFunnel(filtered, steps, {
      rangeStart: rangeStart.getTime(),
      rangeEnd: rangeEnd.getTime(),
    });
  },

  /**
   * Event count (debug / admin panel için).
   */
  async getEventCount(name?: string): Promise<number> {
    if (!name) return inMemoryEvents.length;
    return inMemoryEvents.filter((e) => e.name === name).length;
  },

  /**
   * Eski event'leri temizle (retention policy).
   */
  async cleanup(retentionDays = 90): Promise<number> {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const before = inMemoryEvents.length;
    for (let i = inMemoryEvents.length - 1; i >= 0; i--) {
      const e = inMemoryEvents[i];
      if (e && e.timestamp < cutoff) inMemoryEvents.splice(i, 1);
    }
    return before - inMemoryEvents.length;
  },
};