/**
 * Email Marketing Module — Service Tests
 *
 * Service fonksiyonlarinin export ve temel davranislarini dogrular.
 * Asagidaki yardimci metodlari minimum mock ile kontrol eder.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailCampaign: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((args: any) => ({ id: 'c1', ...args.data })),
      update: vi.fn().mockImplementation((args: any) => ({ id: args.where.id, ...args.data })),
    },
    campaignExecution: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((args: any) => ({ id: 'e1', ...args.data })),
      update: vi.fn().mockImplementation((args: any) => ({ id: args.where.id, ...args.data })),
    },
    emailPreference: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockImplementation((args: any) => ({ id: 'p1', ...args.create, ...args.update })),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: 'u1', email: 'test@example.com' }]),
    },
  },
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'mock-1' }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('EmailMarketingService', () => {
  it('exports core functions', async () => {
    const { emailMarketingService } = await import('../service');

    expect(typeof emailMarketingService.createCampaign).toBe('function');
    expect(typeof emailMarketingService.enrollUser).toBe('function');
    expect(typeof emailMarketingService.processCampaigns).toBe('function');
    expect(typeof emailMarketingService.executeCampaign).toBe('function');
    expect(typeof emailMarketingService.trackOpen).toBe('function');
    expect(typeof emailMarketingService.trackClick).toBe('function');
    expect(typeof emailMarketingService.getPreferences).toBe('function');
    expect(typeof emailMarketingService.updatePreferences).toBe('function');
  });

  it('createCampaign validates input and assigns status', async () => {
    const { emailMarketingService } = await import('../service');

    const campaign = await emailMarketingService.createCampaign({
      name: 'Welcome Drip',
      campaignType: 'drip',
      fromName: 'Noktanyus',
      subject: 'Hosgeldin!',
      template: '<p>Hello {{name}}</p>',
    });

    expect(campaign.name).toBe('Welcome Drip');
    expect(campaign.status).toBe('running');
    expect(campaign.fromName).toBe('Noktanyus');
  });

  it('createCampaign schedules when scheduledAt provided', async () => {
    const { emailMarketingService } = await import('../service');

    const future = new Date(Date.now() + 1000 * 60 * 60);
    const campaign = await emailMarketingService.createCampaign({
      name: 'Scheduled',
      campaignType: 'broadcast',
      fromName: 'Noktanyus',
      subject: 'Test',
      template: '<p>Scheduled template</p>',
      scheduledAt: future,
    });

    expect(campaign.status).toBe('scheduled');
  });
});

describe('EmailMarketingSchemas', () => {
  it('CampaignTypeSchema accepts valid types', async () => {
    const { CampaignTypeSchema } = await import('../schemas');
    expect(CampaignTypeSchema.parse('drip')).toBe('drip');
    expect(CampaignTypeSchema.parse('broadcast')).toBe('broadcast');
    expect(CampaignTypeSchema.parse('behavioral')).toBe('behavioral');
  });

  it('CampaignTypeSchema rejects unknown types', async () => {
    const { CampaignTypeSchema } = await import('../schemas');
    expect(() => CampaignTypeSchema.parse('unknown')).toThrow();
  });
});

describe('EmailCampaignRepository.incrementCounter', () => {
  it('uses prisma update with increment operator', async () => {
    const { emailCampaignRepository } = await import('../repository');
    const { prisma } = await import('@/lib/prisma');

    await emailCampaignRepository.incrementCounter('c1', 'totalSent');
    await emailCampaignRepository.incrementCounter('c1', 'totalOpened');
    await emailCampaignRepository.incrementCounter('c1', 'totalClicked', 2);

    expect(prisma.emailCampaign.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { totalSent: { increment: 1 } },
    });
    expect(prisma.emailCampaign.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { totalOpened: { increment: 1 } },
    });
    expect(prisma.emailCampaign.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { totalClicked: { increment: 2 } },
    });
  });
});