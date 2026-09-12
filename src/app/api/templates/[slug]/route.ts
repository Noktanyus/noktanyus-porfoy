/**
 * @file /api/templates/[slug] - GET (public detail)
 * @description Public template detay endpoint'i.
 *              Slug ile tek template getirir; active=false ise 404 doner.
 *              Auth gerektirmez.
 */

import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getTemplateBySlug } from '@/modules/marketplace/templateService';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandling(async () => {
    const template = await getTemplateBySlug(params.slug);

    return ok(
      { template },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        },
      }
    );
  });
}
