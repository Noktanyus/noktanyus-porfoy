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
}

export const apiKeyRepository = new ApiKeyRepository();
export const apiKeyUsageRepository = new ApiKeyUsageRepository();