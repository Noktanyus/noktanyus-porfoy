/**
 * GET /api/bundles
 * Aktif bundle'ları listeler.
 */

import { NextRequest } from 'next/server';
import { bundleService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const bundles = await bundleService.listBundles();
    return ok({ bundles });
  });
}
