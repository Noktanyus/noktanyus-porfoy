/**
 * GET /api/products
 * Query params: ?category=...&take=...&skip=...
 *
 * Aktif dijital ürünleri listeler.
 */

import { NextRequest } from 'next/server';
import { commerceService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';

export const GET = async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') ?? undefined;
    const take = Number(searchParams.get('take') ?? 20);
    const skip = Number(searchParams.get('skip') ?? 0);

    const products = await commerceService.listProducts({ category, take, skip });
    return ok(products);
  });
};