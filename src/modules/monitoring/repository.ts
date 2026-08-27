/**
 * Monitoring Module — Repository Layer
 *
 * Monitor, MonitorCheck, Incident ve AlertChannel için Prisma-backed repository'ler.
 * BaseRepository'den türeyen ortak CRUD + domain-specific sorgular.
 */

import { BaseRepository } from '../shared/repository';
import type { Monitor, MonitorCheck, Incident, AlertChannel } from '@prisma/client';

// ============================================================================
// Monitor
// ============================================================================

export class MonitorRepository extends BaseRepository<Monitor> {
  protected get model() {
    return this.prisma.monitor;
  }

  async findByUserId(userId: string, opts?: { status?: 'UP' | 'DOWN' | 'PAUSED' | 'PENDING' }) {
    return this.prisma.monitor.findMany({
      where: {
        userId,
        ...(opts?.status ? { status: opts.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPublicSlug(slug: string) {
    return this.prisma.monitor.findUnique({ where: { publicSlug: slug } });
  }

  async findByIdForUser(monitorId: string, userId: string) {
    return this.prisma.monitor.findFirst({
      where: { id: monitorId, userId },
    });
  }

  /**
   * Kontrol zamanı gelmiş monitörleri getir.
   * intervalSec dolmamış ve PAUSED olmayanlar.
   * lastCheckedAt yoksa veya son kontrolünden interval geçmişse due sayılır.
   */
  async findDueForCheck() {
    // Çok büyük monitör listelerinde N+1'i önlemek için intervalSec'i sorgu içinde değerlendiremeyiz,
   // bu yüzden PAUSED olmayanları çekip JS tarafında filtreliyoruz. Üst sınır 1000.
    const candidates = await this.prisma.monitor.findMany({
      where: { status: { not: 'PAUSED' } },
      take: 500,
    });
    const now = Date.now();
    return candidates.filter((m) => {
      if (!m.lastCheckedAt) return true;
      return now - new Date(m.lastCheckedAt).getTime() >= m.intervalSec * 1000;
    });
  }

  async recordCheck(
    monitorId: string,
    check: {
      isUp: boolean;
      responseMs?: number;
      statusCode?: number;
      errorMessage?: string;
      region?: string;
    }
  ) {
    await this.prisma.monitorCheck.create({
      data: {
        monitorId,
        isUp: check.isUp,
        responseMs: check.responseMs ?? null,
        statusCode: check.statusCode ?? null,
        errorMessage: check.errorMessage ?? null,
        region: check.region ?? 'eu-west',
      },
    });
    await this.prisma.monitor.update({
      where: { id: monitorId },
      data: {
        lastCheckedAt: new Date(),
        lastResponseMs: check.responseMs ?? null,
        status: check.isUp ? 'UP' : 'DOWN',
      },
    });
  }

  async getRecentChecks(monitorId: string, limit = 100) {
    return this.prisma.monitorCheck.findMany({
      where: { monitorId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getUptimeStats(monitorId: string, hours = 24 * 30) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const checks = await this.prisma.monitorCheck.findMany({
      where: { monitorId, timestamp: { gte: since } },
      select: { isUp: true },
    });
    if (checks.length === 0) return 100;
    const upCount = checks.filter((c) => c.isUp).length;
    return Number(((upCount / checks.length) * 100).toFixed(4));
  }

  async updateUptimeStats(monitorId: string, hours = 24 * 30) {
    const uptime = await this.getUptimeStats(monitorId, hours);
    await this.prisma.monitor.update({
      where: { id: monitorId },
      data: { uptimePct30d: uptime },
    });
    return uptime;
  }
}

// ============================================================================
// AlertChannel
// ============================================================================

export class AlertChannelRepository extends BaseRepository<AlertChannel> {
  protected get model() {
    return this.prisma.alertChannel;
  }

  async findByUserId(userId: string) {
    return this.prisma.alertChannel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserIdAndIds(userId: string, ids: string[]) {
    if (ids.length === 0) return [];
    return this.prisma.alertChannel.findMany({
      where: { userId, id: { in: ids } },
    });
  }
}

// ============================================================================
// Incident
// ============================================================================

export class IncidentRepository extends BaseRepository<Incident> {
  protected get model() {
    return this.prisma.incident;
  }

  async findOpen(monitorId: string) {
    return this.prisma.incident.findFirst({
      where: { monitorId, resolvedAt: null },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findRecent(monitorId: string, limit = 10) {
    return this.prisma.incident.findMany({
      where: { monitorId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  async open(monitorId: string, reason: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH') {
    return this.prisma.incident.create({
      data: {
        monitorId,
        reason,
        severity,
        affectedChecks: 1,
        totalChecks: 1,
      },
    });
  }

  async resolve(id: string, durationSec: number) {
    return this.prisma.incident.update({
      where: { id },
      data: { resolvedAt: new Date(), durationSec },
    });
  }

  async incrementAffected(id: string) {
    return this.prisma.incident.update({
      where: { id },
      data: {
        affectedChecks: { increment: 1 },
        totalChecks: { increment: 1 },
      },
    });
  }
}

// ============================================================================
// Singletons
// ============================================================================

export const monitorRepository = new MonitorRepository();
export const alertChannelRepository = new AlertChannelRepository();
export const incidentRepository = new IncidentRepository();
