/**
 * @file /api/blogs/popular - En cok okunan blog yazilari.
 * @description Query parametreleri: limit (default 5), days (default 30).
 *              Auth gerektirmez (public analytics goruntuleme endpoint'i).
 */

import { NextRequest } from 'next/server';
import { getPopularBlogs } from '@/lib/blogAnalytics';
import { ok, withErrorHandling } from '@/lib/apiResponse';

// Public endpoint - cache etmeyelim, her istek guncel olsun.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const daysParam = searchParams.get('days');

    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 5, 1), 50) : 5;
    const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 365) : 30;

    const blogs = await getPopularBlogs({ limit, days });
    return ok({ blogs });
  });
}
