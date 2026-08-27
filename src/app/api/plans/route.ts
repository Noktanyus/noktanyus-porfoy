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
    return ok(plans);
  });
};