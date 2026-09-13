/**
 * Mevcut DB planlarını bireysel merdivene senkronlar.
 * Kullanım: npx tsx scripts/sync-individual-plans.ts
 */

import { PrismaClient } from '@prisma/client';
import { INDIVIDUAL_PLANS } from '../src/lib/individualPlans';

const prisma = new PrismaClient();

async function main() {
  for (const plan of INDIVIDUAL_PLANS) {
    const row = await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        stripePriceId: plan.stripePriceId,
        stripeProductId: plan.stripeProductId,
        interval: plan.interval,
        priceCents: plan.priceCents,
        currency: plan.currency,
        features: {
          marketing: [...plan.marketing],
          limits: { ...plan.limits },
        },
        active: true,
        isFeatured: plan.isFeatured,
        order: plan.order,
        trialDays: plan.trialDays,
      },
      update: {
        name: plan.name,
        description: plan.description,
        stripePriceId: plan.stripePriceId,
        stripeProductId: plan.stripeProductId,
        interval: plan.interval,
        priceCents: plan.priceCents,
        currency: plan.currency,
        features: {
          marketing: [...plan.marketing],
          limits: { ...plan.limits },
        },
        active: true,
        isFeatured: plan.isFeatured,
        order: plan.order,
        trialDays: plan.trialDays,
      },
    });
    console.log(`OK ${row.slug} → ${row.name} (${row.priceCents} cent)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
