/**
 * Admin plan CRUD — Plan kayıtlarını UI üzerinden yönetmek için.
 * features JSON: { marketing: string[], limits?: { apiRequestsPerMonth } }
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ConflictError, NotFoundError, ValidationError } from '@/modules/shared/errors';
import type { AdminPlanWriteInput } from './schemas';
import { parsePlanFeatures } from '@/lib/schemas/plan';

function buildFeaturesJson(data: Pick<AdminPlanWriteInput, 'marketingFeatures' | 'apiRequestsPerMonth'>) {
  const marketing = (data.marketingFeatures ?? []).map((s) => s.trim()).filter(Boolean);
  const features: { marketing: string[]; limits?: { apiRequestsPerMonth: number } } = {
    marketing,
  };
  if (
    data.apiRequestsPerMonth !== undefined &&
    data.apiRequestsPerMonth !== null &&
    Number.isFinite(data.apiRequestsPerMonth)
  ) {
    features.limits = { apiRequestsPerMonth: data.apiRequestsPerMonth };
  }
  return features as Prisma.InputJsonValue;
}

function localStripeIds(slug: string) {
  const stamp = Date.now().toString(36);
  return {
    stripePriceId: `local_price_${slug}_${stamp}`,
    stripeProductId: `local_prod_${slug}`,
  };
}

export const planAdminService = {
  async list() {
    return prisma.plan.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { subscriptions: true } } },
    });
  },

  async findById(id: string) {
    return prisma.plan.findUnique({ where: { id } });
  },

  async findBySlug(slug: string) {
    return prisma.plan.findUnique({ where: { slug } });
  },

  async create(input: AdminPlanWriteInput) {
    const existing = await prisma.plan.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new ConflictError(`Bu slug (${input.slug}) zaten kullanımda`);
    }

    const ids =
      input.stripePriceId && input.stripeProductId
        ? { stripePriceId: input.stripePriceId, stripeProductId: input.stripeProductId }
        : localStripeIds(input.slug);

    const priceClash = await prisma.plan.findUnique({
      where: { stripePriceId: ids.stripePriceId },
    });
    if (priceClash) {
      throw new ConflictError('stripePriceId başka bir planda kayıtlı');
    }

    return prisma.plan.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        stripePriceId: ids.stripePriceId,
        stripeProductId: ids.stripeProductId,
        interval: input.interval,
        priceCents: input.priceCents,
        currency: input.currency ?? 'try',
        features: buildFeaturesJson(input),
        active: input.active ?? true,
        isFeatured: input.isFeatured ?? false,
        order: input.order ?? 0,
        trialDays: input.trialDays ?? 14,
      },
    });
  },

  async update(id: string, input: AdminPlanWriteInput) {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundError('Plan');

    if (input.slug !== plan.slug) {
      const slugClash = await prisma.plan.findUnique({ where: { slug: input.slug } });
      if (slugClash) {
        throw new ConflictError(`Bu slug (${input.slug}) zaten kullanımda`);
      }
    }

    const nextPriceId = input.stripePriceId?.trim() || plan.stripePriceId;
    const nextProductId = input.stripeProductId?.trim() || plan.stripeProductId;

    if (nextPriceId !== plan.stripePriceId) {
      const priceClash = await prisma.plan.findUnique({
        where: { stripePriceId: nextPriceId },
      });
      if (priceClash) {
        throw new ConflictError('stripePriceId başka bir planda kayıtlı');
      }
    }

    return prisma.plan.update({
      where: { id },
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        stripePriceId: nextPriceId,
        stripeProductId: nextProductId,
        interval: input.interval,
        priceCents: input.priceCents,
        currency: input.currency ?? 'try',
        features: buildFeaturesJson(input),
        active: input.active ?? true,
        isFeatured: input.isFeatured ?? false,
        order: input.order ?? 0,
        trialDays: input.trialDays ?? 14,
      },
    });
  },

  async setActive(id: string, active: boolean) {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundError('Plan');
    return prisma.plan.update({ where: { id }, data: { active } });
  },

  async remove(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!plan) throw new NotFoundError('Plan');

    if (plan._count.subscriptions > 0) {
      throw new ValidationError(
        `Bu plana bağlı ${plan._count.subscriptions} abonelik kaydı var. Önce pasif yapın veya abonelikleri temizleyin.`,
        { subscriptionCount: plan._count.subscriptions },
      );
    }

    const userSubs = await prisma.userSubscription.count({
      where: { planSlug: plan.slug },
    });
    if (userSubs > 0) {
      throw new ValidationError(
        `Bu plana bağlı ${userSubs} kullanıcı aboneliği var. Silmek yerine pasif yapın.`,
        { userSubscriptionCount: userSubs },
      );
    }

    await prisma.plan.delete({ where: { id } });
    return { id, slug: plan.slug };
  },

  /** Form önizlemesi / edit için features'ı ayrıştırır. */
  parseForForm(features: unknown) {
    const parsed = parsePlanFeatures(features);
    return {
      marketingFeatures: parsed.marketing ?? [],
      apiRequestsPerMonth: parsed.limits?.apiRequestsPerMonth ?? null,
    };
  },
};
