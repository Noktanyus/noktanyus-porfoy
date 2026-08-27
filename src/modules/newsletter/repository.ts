/**
 * Newsletter Module — Repository Layer
 *
 * NewsletterSubscriber modeline erişim. BaseRepository + özel domain method'ları.
 */

import { BaseRepository } from '../shared/repository';
import { prisma } from '@/lib/prisma';
import type { NewsletterSubscriber } from '@prisma/client';

export class NewsletterRepository extends BaseRepository<NewsletterSubscriber> {
  protected get model() {
    return this.prisma.newsletterSubscriber;
  }

  async findByEmail(email: string): Promise<NewsletterSubscriber | null> {
    return this.prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findVerifiedActive(): Promise<NewsletterSubscriber[]> {
    return this.prisma.newsletterSubscriber.findMany({
      where: { active: true, verifiedAt: { not: null }, unsubscribedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAll(opts?: { limit?: number; active?: boolean }) {
    return this.prisma.newsletterSubscriber.findMany({
      where: opts?.active !== undefined ? { active: opts.active } : undefined,
      orderBy: { createdAt: 'desc' },
      take: opts?.limit,
    });
  }

  async getStats() {
    const [total, active, verified] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({
        where: { active: true, unsubscribedAt: null },
      }),
      prisma.newsletterSubscriber.count({ where: { verifiedAt: { not: null } } }),
    ]);
    return { total, active, verified };
  }

  generateVerifyToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  generateUnsubscribeToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async findByVerifyToken(token: string): Promise<NewsletterSubscriber | null> {
    return this.prisma.newsletterSubscriber.findUnique({
      where: { verifyToken: token },
    });
  }

  async findByUnsubscribeToken(
    token: string
  ): Promise<NewsletterSubscriber | null> {
    return this.prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });
  }
}

export const newsletterRepository = new NewsletterRepository();