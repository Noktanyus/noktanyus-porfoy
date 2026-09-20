/**
 * GET /api/plans
 *
 * Aktif abonelik planlarını listeler.
 */

import { commerceService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';

export const GET = async () => {
  return withErrorHandling(async () => {
    const plans = await commerceService.listPlans();
    const sanitized = plans.map((plan) => {
      const isMock =
        plan.stripePriceId?.toLowerCase().includes('mock') ||
        plan.stripeProductId?.toLowerCase().includes('mock');
      return {
        ...plan,
        stripePriceId: isMock ? null : plan.stripePriceId,
        stripeProductId: isMock ? null : plan.stripeProductId,
      };
    });
    return ok(sanitized);
  });
};