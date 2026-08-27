/**
 * GET /api/bundles/[slug]
 * Slug ile tek bir bundle'ı ve içindeki ürünleri getirir.
 */

import { NextRequest } from 'next/server';
import { bundleService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { NotFoundError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandling(async () => {
    const bundle = await bundleService.getBundle(params.slug);
    if (!bundle || !bundle.active) throw new NotFoundError('Bundle');

    const products = await bundleService.getBundleProducts(bundle);
    return ok({ bundle, products });
  });
}
