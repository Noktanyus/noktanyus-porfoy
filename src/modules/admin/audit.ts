/**
 * @file Admin Module — Audit Repository & Service
 * @description Admin audit log işlemlerini kapsayan repository + service katmanı.
 *
 * Modüldeki diğer repo'larla aynı barrel/dispatch pattern kullanır —
 * Direkt Prisma çağrısı yerine service üzerinden erişim önerilir.
 */

import { prisma } from '@/lib/prisma';
import type { AuditLog, Prisma } from '@prisma/client';

export class AuditRepository {
  async create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return prisma.auditLog.create({ data });
  }

  async findRecent(limit = 50): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async findByResource(resource: string, resourceId?: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: {
        resource,
        ...(resourceId ? { resourceId } : {}),
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByUser(userId: string, limit = 50): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Filtreye göre sayfalı audit log listesi.
   */
  async findFiltered(filters: {
    action?: string;
    resource?: string;
    userId?: string;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<AuditLog[]> {
    const { action, resource, userId, status, skip = 0, take = 50 } = filters;
    return prisma.auditLog.findMany({
      where: {
        ...(action ? { action } : {}),
        ...(resource ? { resource } : {}),
        ...(userId ? { userId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take,
    });
  }

  async countFiltered(filters: {
    action?: string;
    resource?: string;
    userId?: string;
    status?: string;
  }): Promise<number> {
    const { action, resource, userId, status } = filters;
    return prisma.auditLog.count({
      where: {
        ...(action ? { action } : {}),
        ...(resource ? { resource } : {}),
        ...(userId ? { userId } : {}),
        ...(status ? { status } : {}),
      },
    });
  }

  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [total, today, byAction, failureCount] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: { timestamp: { gte: startOfToday } },
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: true,
        orderBy: { _count: { action: 'desc' } },
      }),
      prisma.auditLog.count({ where: { status: 'failure' } }),
    ]);

    return {
      total,
      today,
      failures: failureCount,
      byAction: byAction.map((b) => ({ action: b.action, count: b._count })),
    };
  }
}

export const auditRepository = new AuditRepository();

/**
 * Service layer — UI / API'den çağrılacak iş mantığı.
 */
export const auditService = {
  listRecent(limit = 50) {
    return auditRepository.findRecent(limit);
  },

  listByResource(resource: string, resourceId?: string) {
    return auditRepository.findByResource(resource, resourceId);
  },

  listByUser(userId: string, limit = 50) {
    return auditRepository.findByUser(userId, limit);
  },

  listFiltered(filters: Parameters<AuditRepository['findFiltered']>[0]) {
    return auditRepository.findFiltered(filters);
  },

  countFiltered(filters: Parameters<AuditRepository['countFiltered']>[0]) {
    return auditRepository.countFiltered(filters);
  },

  getStats() {
    return auditRepository.getStats();
  },

  /**
   * Tek seferde hem kayıtları hem sayıyı getirir (sayfalama için).
   */
  async paginate(filters: {
    action?: string;
    resource?: string;
    userId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      auditRepository.findFiltered({ ...filters, skip, take: pageSize }),
      auditRepository.countFiltered(filters),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
};
