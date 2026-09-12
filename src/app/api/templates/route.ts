/**
 * @file /api/templates - GET (public list)
 * @description Public template vitrin endpoint'i.
 *              Aktif template'leri filtre/sort/pagination ile listeler.
 *              Auth gerektirmez — middleware tarafindan public kabul edilir.
 *
 * Delegate: src/modules/marketplace/templateService.listTemplates
 * Schema:  src/modules/marketplace/templateSchemas.ListTemplatesQuerySchema
 */

import { NextRequest } from 'next/server';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { ListTemplatesQuerySchema } from '@/modules/marketplace/templateSchemas';
import { listTemplates } from '@/modules/marketplace/templateService';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(req.url);

    // Query params → raw object
    const rawQuery = {
      category: url.searchParams.get('category') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      sort: (url.searchParams.get('sort') ?? 'newest') as 'newest' | 'popular' | 'price-asc' | 'price-desc',
      page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : 1,
      pageSize: url.searchParams.get('pageSize') ? Number(url.searchParams.get('pageSize')) : 12,
    };

    const parsed = ListTemplatesQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      // Public endpoint; validation hatasi fallback'e dusmez — temiz 400 don
      return fail(new ZodError(parsed.error.issues));
    }

    const result = await listTemplates(parsed.data);

    return ok(result.items, {
      headers: {
        // Short cache — public veriler nadiren degisir
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  });
}
