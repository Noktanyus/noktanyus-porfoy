/**
 * API Key Module — Repository Layer
 *
 * ApiKey ve ApiKeyUsage için DB erişim katmanı.
 * BaseRepository pattern'ini kullanır (CRUD + özel sorgular).
 */

import { prisma } from '@/lib/prisma';
import { BaseRepository } from '../shared/repository';
import type { ApiKey, ApiKeyUsage } from '@prisma/client';

export class ApiKeyRepository extends BaseRepository<ApiKey> {
  protected get model() {
    return this.prisma.apiKey;
  }

  /**
   * Kullanıcının aktif (iptal edilmemiş) API anahtarlarını getir.
   */
  async findByUserId(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * API anahtarını key değeri ile bul. user bilgisini de include eder.
   */
  async findByKey(key: string) {
    return this.prisma.apiKey.findUnique({
      where: { key },
      include: { user: true },
    });
  }

  /**
   * Son N saat içindeki kullanım istatistiklerini getir.
   */
  async getUsageStats(apiKeyId: string, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [total, successCount, byEndpoint] = await Promise.all([
      prisma.apiKeyUsage.count({
        where: { apiKeyId, timestamp: { gte: since } },
      }),
      prisma.apiKeyUsage.count({
        where: {
          apiKeyId,
          timestamp: { gte: since },
          statusCode: { gte: 200, lt: 400 },
        },
      }),
      prisma.apiKeyUsage.groupBy({
        by: ['endpoint'],
        where: { apiKeyId, timestamp: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      successCount,
      errorCount: total - successCount,
      successRate: total > 0 ? (successCount / total) * 100 : 100,
      byEndpoint: byEndpoint.map((e: { endpoint: string; _count: { _all: number } }) => ({
        endpoint: e.endpoint,
        count: e._count._all,
      })),
    };
  }

  /**
   * Kullanıcının tüm anahtarları için kullanım özeti (SaaS usage dashboard).
   */
  async getUserUsageOverview(userId: string, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const keys = await prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      select: {
        id: true,
        name: true,
        prefix: true,
        totalRequests: true,
        monthlyQuota: true,
        rateLimit: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const keyIds = keys.map((k) => k.id);
    if (keyIds.length === 0) {
      return {
        hours,
        total: 0,
        successCount: 0,
        errorCount: 0,
        successRate: 100,
        byEndpoint: [] as { endpoint: string; count: number }[],
        recent: [] as Array<{
          id: string;
          endpoint: string;
          method: string;
          statusCode: number;
          timestamp: Date;
          apiKeyId: string;
          keyName: string | null;
        }>,
        keys: [],
      };
    }

    const [total, successCount, byEndpoint, recent] = await Promise.all([
      prisma.apiKeyUsage.count({
        where: { apiKeyId: { in: keyIds }, timestamp: { gte: since } },
      }),
      prisma.apiKeyUsage.count({
        where: {
          apiKeyId: { in: keyIds },
          timestamp: { gte: since },
          statusCode: { gte: 200, lt: 400 },
        },
      }),
      prisma.apiKeyUsage.groupBy({
        by: ['endpoint'],
        where: { apiKeyId: { in: keyIds }, timestamp: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 12,
      }),
      prisma.apiKeyUsage.findMany({
        where: { apiKeyId: { in: keyIds }, timestamp: { gte: since } },
        orderBy: { timestamp: 'desc' },
        take: 25,
        select: {
          id: true,
          endpoint: true,
          method: true,
          statusCode: true,
          timestamp: true,
          apiKeyId: true,
        },
      }),
    ]);

    const keyNameById = new Map(keys.map((k) => [k.id, k.name]));

    return {
      hours,
      total,
      successCount,
      errorCount: total - successCount,
      successRate: total > 0 ? (successCount / total) * 100 : 100,
      byEndpoint: byEndpoint.map((e) => ({
        endpoint: e.endpoint,
        count: e._count._all,
      })),
      recent: recent.map((r) => ({
        ...r,
        keyName: keyNameById.get(r.apiKeyId) ?? null,
      })),
      keys,
    };
  }
}

export class ApiKeyUsageRepository extends BaseRepository<ApiKeyUsage> {
  protected get model() {
    return this.prisma.apiKeyUsage;
  }

  /**
   * Ay başlangıcından itibaren kullanım sayısı (quota kontrolü için).
   */
  async countMonthlyUsage(apiKeyId: string): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return prisma.apiKeyUsage.count({
      where: { apiKeyId, timestamp: { gte: monthStart } },
    });
  }

  /**
   * Son N saniye içindeki kullanım sayısı (serverless rate limit fallback için).
   */
  async countRecentUsage(apiKeyId: string, seconds = 60): Promise<number> {
    const windowStart = new Date(Date.now() - seconds * 1000);
    return prisma.apiKeyUsage.count({
      where: { apiKeyId, timestamp: { gte: windowStart } },
    });
  }
}

export const apiKeyRepository = new ApiKeyRepository();
export const apiKeyUsageRepository = new ApiKeyUsageRepository();