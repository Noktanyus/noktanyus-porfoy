/**
 * GET /api/products/[slug]
 *
 * Tek bir dijital ürünü slug ile getirir.
 */

import { commerceService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';

export const GET = async (
  _req: Request,
  { params }: { params: { slug: string } }
) => {
  return withErrorHandling(async () => {
    const product = await commerceService.getProduct(params.slug);
    return ok(product);
  });
};