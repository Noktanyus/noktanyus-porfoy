/**
 * Email Marketing Module — Repositories
 *
 * Campaign, step, execution ve email preference tablolarina erisim.
 * BaseRepository pattern'i ile tutarli CRUD.
 */

import type { EmailCampaign, CampaignExecution, EmailPreference } from '@prisma/client';
import { BaseRepository } from '../shared/repository';
import { prisma } from '@/lib/prisma';

export class EmailCampaignRepository extends BaseRepository<EmailCampaign> {
  protected get model() {
    return this.prisma.emailCampaign;
  }

  async findActive() {
    return this.prisma.emailCampaign.findMany({
      where: { status: { in: ['running', 'scheduled'] } },
    });
  }

  async findDueForExecution() {
    return this.prisma.emailCampaign.findMany({
      where: {
        status: 'running',
        OR: [{ scheduledAt: { lte: new Date() } }, { scheduledAt: null }],
      },
    });
  }

  async findWithStats() {
    return this.prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { executions: true } } },
    });
  }
}

export class CampaignExecutionRepository extends BaseRepository<CampaignExecution> {
  protected get model() {
    return this.prisma.campaignExecution;
  }

  async findDuePending() {
    return this.prisma.campaignExecution.findMany({
      where: { status: 'pending', sentAt: null },
      take: 100,
      include: { campaign: true, user: true },
    });
  }

  async findByUserAndCampaign(userId: string, campaignId: string) {
    return this.prisma.campaignExecution.findFirst({
      where: { userId, campaignId },
    });
  }
}

export class EmailPreferenceRepository extends BaseRepository<EmailPreference> {
  protected get model() {
    return this.prisma.emailPreference;
  }

  async findByUserId(userId: string) {
    return this.prisma.emailPreference.findUnique({ where: { userId } });
  }

  async upsertForUser(userId: string, data: Partial<EmailPreference>) {
    return this.prisma.emailPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}

export const emailCampaignRepository = new EmailCampaignRepository();
export const campaignExecutionRepository = new CampaignExecutionRepository();
export const emailPreferenceRepository = new EmailPreferenceRepository();