/**
 * Email Marketing Module — Service
 *
 * Campaign olusturma, kullanici kaydi, gonderim, open/click tracking.
 * Audience filtreleme (default: marketing tercihi acik kullanicilar).
 */

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import {
  emailCampaignRepository,
  campaignExecutionRepository,
  emailPreferenceRepository,
} from './repository';
import {
  CreateCampaignSchema,
  UpdateEmailPreferenceSchema,
} from './schemas';
import type { z } from 'zod';

const DEFAULT_USER_LIMIT = 1000;

export const emailMarketingService = {
  async createCampaign(input: z.infer<typeof CreateCampaignSchema>) {
    const data = CreateCampaignSchema.parse(input);
    return emailCampaignRepository.create({
      ...data,
      status: data.scheduledAt ? 'scheduled' : 'running',
      fromName: data.fromName ?? 'Noktanyus',
    });
  },

  async enrollUser(userId: string, campaignId: string) {
    const existing = await campaignExecutionRepository.findByUserAndCampaign(
      userId,
      campaignId,
    );
    if (existing) return existing;

    return campaignExecutionRepository.create({
      campaignId,
      userId,
      status: 'pending',
    });
  },

  async processCampaigns() {
    const dueCampaigns = await emailCampaignRepository.findDueForExecution();
    let processed = 0;

    for (const campaign of dueCampaigns) {
      await this.executeCampaign(campaign.id);
      processed += 1;
    }

    return processed;
  },

  async executeCampaign(campaignId: string) {
    const campaign = await emailCampaignRepository.findById(campaignId);
    if (!campaign) {
      logger.warn('Campaign not found', { campaignId });
      return;
    }

    const users = await this.getTargetUsers(campaign);

    for (const user of users) {
      const existing = await campaignExecutionRepository.findByUserAndCampaign(
        user.id,
        campaignId,
      );
      if (existing) continue;

      try {
        const result = await sendEmail({
          to: user.email,
          subject: campaign.subject,
          html: campaign.template,
        });

        if (!result.success) {
          await campaignExecutionRepository.create({
            campaignId,
            userId: user.id,
            status: 'bounced',
            sentAt: new Date(),
          });
          logger.error('Campaign email bounced', {
            userId: user.id,
            error: result.error,
          });
          continue;
        }

        await campaignExecutionRepository.create({
          campaignId,
          userId: user.id,
          status: 'sent',
          sentAt: new Date(),
        });

        await emailCampaignRepository.incrementCounter(campaignId, 'totalSent');
      } catch (err) {
        logger.error('Campaign email failed', { userId: user.id, error: err });
      }
    }
  },

  async getTargetUsers(campaign: any): Promise<{ id: string; email: string }[]> {
    // Default: marketing tercihi acik olan kullanicilar
    const where: any = {
      emailPreference: { marketing: true },
    };

    // Behavioral trigger bazli basit filtreleme
    if (campaign.triggerEvent === 'user.recent') {
      where.createdAt = {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };
    }

    return prisma.user.findMany({
      where,
      select: { id: true, email: true },
      take: DEFAULT_USER_LIMIT,
    });
  },

  async trackOpen(executionId: string) {
    const execution = await campaignExecutionRepository.findById(executionId);
    if (!execution || execution.openedAt) return execution;

    const updated = await prisma.campaignExecution.update({
      where: { id: executionId },
      data: { status: 'opened', openedAt: new Date() },
    });

    await emailCampaignRepository.incrementCounter(updated.campaignId, 'totalOpened');

    return updated;
  },

  async trackClick(executionId: string) {
    const execution = await campaignExecutionRepository.findById(executionId);
    if (!execution) return null;

    const updated = await prisma.campaignExecution.update({
      where: { id: executionId },
      data: { status: 'clicked', clickedAt: new Date() },
    });

    await emailCampaignRepository.incrementCounter(updated.campaignId, 'totalClicked');

    return updated;
  },

  async getPreferences(userId: string) {
    return emailPreferenceRepository.findByUserId(userId);
  },

  async updatePreferences(
    userId: string,
    input: z.infer<typeof UpdateEmailPreferenceSchema>,
  ) {
    const data = UpdateEmailPreferenceSchema.parse(input);
    const prefs = await emailPreferenceRepository.upsertForUser(userId, data);

    // Hangi kanal kapatildiysa unsubscribe metadata'sini guncelle
    if (data.marketing === false || data.newsletter === false) {
      return emailPreferenceRepository.upsertForUser(userId, {
        ...data,
        unsubscribedAt: new Date(),
        unsubscribeReason: 'user_initiated',
      });
    }

    return prefs;
  },
};

export type EmailMarketingService = typeof emailMarketingService;