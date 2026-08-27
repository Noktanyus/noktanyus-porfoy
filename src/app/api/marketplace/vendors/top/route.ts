/**
 * /api/marketplace/vendors/top
 *
 * GET → En yüksek puanlı vendorları listeler (public landing için).
 */

import { NextRequest } from 'next/server';
import { vendorService } from '@/modules/marketplace';
import { ok, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') ?? 10);

    const vendors = await vendorService.listTopVendors(Math.min(limit, 50));
    return ok({ vendors });
  });
}