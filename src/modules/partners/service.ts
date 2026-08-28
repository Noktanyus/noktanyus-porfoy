/**
 * Partner Program Service
 *
 * Phase "Partner Program" kapsaminda eklendi.
 *
 * Is ortaklari (B2B reseller firmalar) kendi landing page'leri uzerinden
 * lead toplar, conversion olmasi halinde komisyon kazanir.
 *
 * Affiliate programindan temel farki:
 * - Firma bazli (tek kullanicili affiliate yerine sirket profili)
 * - Public slug ile landing page (`/is-ortak/[slug]`)
 * - Webhook notification ile partner'in kendi sistemine bildirim
 * - Lead -> Conversion lifecycle (pending -> qualified -> converted)
 */

import { randomBytes, createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ValidationError, NotFoundError, ConflictError } from '@/modules/shared/errors';

const SLUG_REGEX = /^[a-z0-9-]+$/;

function generateApiKey(): string {
  return `nokt_part_${randomBytes(20).toString('hex')}`;
}

function generateSlug(companyName: string): string {
  const base = companyName
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  // 6-char random suffix ile collision engelle
  const suffix = randomBytes(3).toString('hex');
  return `${base || 'partner'}-${suffix}`;
}

function signWebhookPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export interface CreatePartnerInput {
  userId: string;
  companyName: string;
  contactEmail: string;
  website?: string;
  description?: string;
  commissionPercent?: number;
  webhookUrl?: string;
}

export interface SubmitLeadInput {
  partnerSlug: string;
  customerEmail: string;
  customerName?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface PartnerStats {
  partner: {
    id: string;
    companyName: string;
    slug: string;
    commissionPercent: number;
    verified: boolean;
    active: boolean;
    totalLeads: number;
    totalConversions: number;
    createdAt: string;
  };
  leads: {
    total: number;
    pending: number;
    qualified: number;
    converted: number;
    rejected: number;
  };
  revenue: {
    totalCommissionCents: number;
    totalOrderCents: number;
  };
  recentLeads: Array<{
    id: string;
    customerEmail: string;
    customerName: string | null;
    status: string;
    orderAmountCents: number | null;
    commissionCents: number | null;
    createdAt: string;
    convertedAt: string | null;
  }>;
}

export const partnerService = {
  /**
   * Yeni partner olusturur. Slug unique olmali, slug kontrolu yapilir
   * ve apiKey otomatik uretilir (UI'da gosterilmek uzere).
   *
   * Ayni user'in mevcut partner'i varsa hata firlatir.
   */
  async createPartner(input: CreatePartnerInput) {
    if (!input.companyName || input.companyName.length < 2) {
      throw new ValidationError('Şirket adı en az 2 karakter olmalı');
    }
    if (!input.contactEmail || !input.contactEmail.includes('@')) {
      throw new ValidationError('Geçerli bir iletişim e-postası girin');
    }
    if (input.commissionPercent !== undefined) {
      if (input.commissionPercent < 0 || input.commissionPercent > 100) {
        throw new ValidationError('Komisyon yüzdesi 0-100 arasında olmalı');
      }
    }

    // User'in mevcut partner'i var mi?
    const existing = await prisma.partner.findUnique({
      where: { userId: input.userId },
    });
    if (existing) {
      throw new ConflictError('Bu hesaba ait zaten bir iş ortağı kaydı var');
    }

    // Slug benzersiz olacak sekilde 3 deneme yap
    let slug = generateSlug(input.companyName);
    for (let i = 0; i < 3; i++) {
      const taken = await prisma.partner.findUnique({ where: { slug } });
      if (!taken) break;
      slug = generateSlug(input.companyName);
    }

    const webhookSecret = input.webhookUrl ? randomBytes(24).toString('hex') : null;

    const partner = await prisma.partner.create({
      data: {
        userId: input.userId,
        companyName: input.companyName,
        slug,
        contactEmail: input.contactEmail,
        website: input.website ?? null,
        description: input.description ?? null,
        commissionPercent: input.commissionPercent ?? 15.0,
        webhookUrl: input.webhookUrl ?? null,
        webhookSecret,
      },
    });

    logger.info('Partner created', {
      partnerId: partner.id,
      slug: partner.slug,
      userId: input.userId,
    });

    return partner;
  },

  /**
   * Slug ile partner getir. Public landing page icin kullanilir
   * — aktif olmayan partner donmez.
   */
  async getPartner(slug: string) {
    const partner = await prisma.partner.findUnique({
      where: { slug },
    });
    if (!partner || !partner.active) {
      throw new NotFoundError('İş ortağı');
    }
    return partner;
  },

  /**
   * Kullanicinin kendi partner kaydini getir.
   */
  async getMyPartner(userId: string) {
    return prisma.partner.findUnique({ where: { userId } });
  },

  /**
   * Public endpoint: Landing page uzerinden lead gonderimi.
   * Slug ile partner bul, totalLead artir, lead olustur, webhook gonder.
   */
  async submitLead(input: SubmitLeadInput) {
    const partner = await prisma.partner.findUnique({
      where: { slug: input.partnerSlug },
    });
    if (!partner || !partner.active) {
      throw new NotFoundError('İş ortağı');
    }
    if (!input.customerEmail || !input.customerEmail.includes('@')) {
      throw new ValidationError('Geçerli bir e-posta adresi girin');
    }

    const lead = await prisma.$transaction(async (tx) => {
      const created = await tx.partnerLead.create({
        data: {
          partnerId: partner.id,
          customerEmail: input.customerEmail.toLowerCase().trim(),
          customerName: input.customerName ?? null,
          source: input.source ?? 'api',
          metadata: (input.metadata as object) ?? {},
          status: 'pending',
        },
      });
      await tx.partner.update({
        where: { id: partner.id },
        data: { totalLeads: { increment: 1 } },
      });
      return created;
    });

    // Webhook notification (best-effort, hata olursa lead'i engellemez)
    if (partner.webhookUrl) {
      try {
        await partnerService.notifyPartner(partner, 'lead.created', {
          leadId: lead.id,
          customerEmail: lead.customerEmail,
          customerName: lead.customerName,
          source: lead.source,
          createdAt: lead.createdAt.toISOString(),
        });
      } catch (err) {
        logger.warn('Partner webhook notification failed', {
          partnerId: partner.id,
          leadId: lead.id,
          error: err,
        });
      }
    }

    logger.info('Partner lead submitted', {
      partnerId: partner.id,
      leadId: lead.id,
    });

    return lead;
  },

  /**
   * Lead'i converted olarak isaretle. Commerce checkout tamamlandiginda
   * referralCode/slug eslesirse cagrilir. Idempotent: ayni lead zaten
   * converted ise noop.
   */
  async markLeadConverted(args: {
    customerEmail: string;
    orderId: string;
    orderAmountCents: number;
  }) {
    const email = args.customerEmail.toLowerCase().trim();

    // Ayni email ile en son pending lead'i bul
    const lead = await prisma.partnerLead.findFirst({
      where: {
        customerEmail: email,
        status: { in: ['pending', 'qualified'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { partner: true },
    });
    if (!lead) {
      // Bu email partner lead'i degil, sessizce gec
      return null;
    }
    // Zaten converted ise noop
    if (lead.status === 'converted' && lead.orderId === args.orderId) {
      return lead;
    }

    const commissionCents = Math.max(
      0,
      Math.round((args.orderAmountCents * lead.partner.commissionPercent) / 100)
    );

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.partnerLead.update({
        where: { id: lead.id },
        data: {
          status: 'converted',
          orderId: args.orderId,
          orderAmountCents: args.orderAmountCents,
          commissionCents,
          convertedAt: new Date(),
        },
      });
      await tx.partner.update({
        where: { id: lead.partnerId },
        data: { totalConversions: { increment: 1 } },
      });
      return u;
    });

    // Webhook (best-effort)
    if (lead.partner.webhookUrl) {
      try {
        await partnerService.notifyPartner(lead.partner, 'lead.converted', {
          leadId: updated.id,
          orderId: args.orderId,
          orderAmountCents: args.orderAmountCents,
          commissionCents,
        });
      } catch (err) {
        logger.warn('Partner converted webhook failed', {
          partnerId: lead.partnerId,
          leadId: updated.id,
          error: err,
        });
      }
    }

    logger.info('Partner lead converted', {
      partnerId: lead.partnerId,
      leadId: updated.id,
      orderId: args.orderId,
      commissionCents,
    });

    return updated;
  },

  /**
   * Partner istatistikleri (dashboard icin).
   */
  async getStats(userId: string): Promise<PartnerStats | null> {
    const partner = await prisma.partner.findUnique({
      where: { userId },
    });
    if (!partner) return null;

    const [byStatus, recentLeads, conversionAgg] = await Promise.all([
      prisma.partnerLead.groupBy({
        by: ['status'],
        where: { partnerId: partner.id },
        _count: { _all: true },
      }),
      prisma.partnerLead.findMany({
        where: { partnerId: partner.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.partnerLead.aggregate({
        where: { partnerId: partner.id, status: 'converted' },
        _sum: { commissionCents: true, orderAmountCents: true },
      }),
    ]);

    const counts = {
      total: 0,
      pending: 0,
      qualified: 0,
      converted: 0,
      rejected: 0,
    };
    for (const row of byStatus) {
      const c = row._count._all;
      counts.total += c;
      if (row.status in counts) {
        (counts as Record<string, number>)[row.status] = c;
      }
    }

    return {
      partner: {
        id: partner.id,
        companyName: partner.companyName,
        slug: partner.slug,
        commissionPercent: partner.commissionPercent,
        verified: partner.verified,
        active: partner.active,
        totalLeads: partner.totalLeads,
        totalConversions: partner.totalConversions,
        createdAt: partner.createdAt.toISOString(),
      },
      leads: counts,
      revenue: {
        totalCommissionCents: conversionAgg._sum.commissionCents ?? 0,
        totalOrderCents: conversionAgg._sum.orderAmountCents ?? 0,
      },
      recentLeads: recentLeads.map((l) => ({
        id: l.id,
        customerEmail: l.customerEmail,
        customerName: l.customerName,
        status: l.status,
        orderAmountCents: l.orderAmountCents,
        commissionCents: l.commissionCents,
        createdAt: l.createdAt.toISOString(),
        convertedAt: l.convertedAt?.toISOString() ?? null,
      })),
    };
  },

  /**
   * Partner'in webhook'una HMAC imzali payload gonder.
   * Hata durumunda exception firlatir (caller best-effort yakalar).
   */
  async notifyPartner(
    partner: { id: string; webhookUrl: string | null; webhookSecret: string | null },
    event: string,
    payload: Record<string, unknown>
  ) {
    if (!partner.webhookUrl) return;

    const body = JSON.stringify({
      event,
      partnerId: partner.id,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Noktanyus-Event': event,
    };

    if (partner.webhookSecret) {
      headers['X-Noktanyus-Signature'] = signWebhookPayload(body, partner.webhookSecret);
    }

    // 5s timeout — partner endpoint'i yavas olursa blocklama
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(partner.webhookUrl, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Webhook responded ${res.status}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  },

  /**
   * Yardimci: Slug format kontrolu (UI tarafindan kullanilabilir).
   */
  isValidSlug(slug: string): boolean {
    return SLUG_REGEX.test(slug) && slug.length >= 3 && slug.length <= 60;
  },

  /**
   * Public API key export — partner olusturulduktan sonra UI'da
   * gosterilebilecek tek seferlik bir alan. (Gercek secret DB'de tutulur)
   */
  _internal: {
    generateApiKey,
  },
};