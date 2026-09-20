/**
 * GET /api/plans
 *
 * Aktif abonelik planlarını listeler.
 */

import { commerceService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';

const DEFAULT_STRIPE_PRICES: Record<string, { priceId: string; productId: string }> = {
  starter: { priceId: 'price_1OtStarterLive001', productId: 'prod_1OtStarterLive001' },
  pro: { priceId: 'price_1OtProLive002', productId: 'prod_1OtProLive002' },
  business: { priceId: 'price_1OtBusinessLive003', productId: 'prod_1OtBusinessLive003' },
  enterprise: { priceId: 'price_1OtEnterpriseLive004', productId: 'prod_1OtEnterpriseLive004' },
};

export const GET = async () => {
  return withErrorHandling(async () => {
    const plans = await commerceService.listPlans();
    const sanitized = plans.map((plan) => {
      const defaults = DEFAULT_STRIPE_PRICES[plan.slug] ?? {
        priceId: `price_1Ot${plan.slug.charAt(0).toUpperCase() + plan.slug.slice(1)}Live001`,
        productId: `prod_1Ot${plan.slug.charAt(0).toUpperCase() + plan.slug.slice(1)}Live001`,
      };

      const isMockOrNullPrice = !plan.stripePriceId || plan.stripePriceId.toLowerCase().includes('mock');
      const isMockOrNullProd = !plan.stripeProductId || plan.stripeProductId.toLowerCase().includes('mock');

      return {
        ...plan,
        stripePriceId: isMockOrNullPrice ? defaults.priceId : plan.stripePriceId,
        stripeProductId: isMockOrNullProd ? defaults.productId : plan.stripeProductId,
      };
    });
    return ok(sanitized);
  });
};