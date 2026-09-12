/**
 * AiUsage Repository — Sprint 1
 *
 * Per-call granular token usage tracking. Aggregate queries planGate.ts'te
 * yapılır (aylık quota hesabı).
 */

import { prisma } from '@/lib/prisma';
import { BaseRepository } from '@/modules/shared/repository';

class AiUsageRepository extends BaseRepository<{
  id: string;
  userId: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costCents: number;
  resourceId: string | null;
  resourceType: string | null;
  promptSummary: string | null;
  createdAt: Date;
}> {
  protected get model() {
    return this.prisma.aiUsage;
  }

  /**
   * Son N AI generation kaydını getirir (admin dashboard için).
   */
  async findRecent(limit = 50, feature?: string) {
    return this.model.findMany({
      where: feature ? { feature } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { email: true, name: true } } },
    });
  }

  /**
   * Belirli bir kullanıcının son kullanım kayıtları.
   */
  async findByUser(userId: string, limit = 20) {
    return this.model.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const aiUsageRepository = new AiUsageRepository();
