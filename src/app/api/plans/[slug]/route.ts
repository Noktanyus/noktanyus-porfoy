/**
 * GET /api/plans/[slug]
 *
 * Slug ile tek bir abonelik planının public-safe bilgilerini döner.
 * Client component'ler Prisma'ya doğrudan erişemeyeceği için bu endpoint
 * PlanCheckoutForm gibi client component'lerin plan detaylarını almasını sağlar.
 */

import { NextRequest } from 'next/server';
import { commerceService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { NotFoundError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandling(async () => {
    const slug = params.slug;

    if (!slug || typeof slug !== 'string' || slug.length > 100) {
      throw new NotFoundError('Plan');
    }

    const plan = await commerceService.getPlan(slug);
    return ok(plan);
  });
}
