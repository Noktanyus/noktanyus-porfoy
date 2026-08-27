/**
 * POST /api/monitors/check-all — Cron tarafından tetiklenen scheduled check runner
 *
 * Yetkilendirme: Authorization: Bearer <CRON_SECRET>
 * Vercel Cron veya harici scheduler tarafından 5 dakikada bir çağrılır.
 */

import { NextRequest } from 'next/server';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import { monitoringService } from '@/modules/monitoring';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const authHeader = req.headers.get('authorization');
    const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '';
    if (!expected || authHeader !== expected) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz cron secret', statusCode: 401 } as any);
    }

    logger.info('Cron: Running scheduled monitor checks');
    const result = await monitoringService.runScheduledChecks();
    return ok(result);
  });
}

// GET da destekleyelim (Vercel cron GET ile çağırır)
export async function GET(req: NextRequest) {
  return POST(req);
}
