/**
 * GET /api/bundles/stats
 * Bundle istatistikleri (toplam, satış, gelir).
 */

import { NextRequest } from 'next/server';
import { bundleService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const stats = await bundleService.getStats();
    return ok(stats);
  });
}
