/**
 * Email Open Tracking (pixel)
 *
 * GET /api/track/email/open?e=<executionId>
 * 1x1 transparent GIF doner ve execution.status='opened' isaretlenir.
 * Campaign istatistiklerini besler.
 */

import type { NextRequest } from 'next/server';
import { emailMarketingService } from '@/modules/email-marketing/service';
import { logger } from '@/lib/logger';

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const executionId = req.nextUrl.searchParams.get('e');

  if (executionId) {
    try {
      await emailMarketingService.trackOpen(executionId);
    } catch (err) {
      logger.error('[email-open] track failed', { executionId, error: err });
    }
  }

  return new Response(TRANSPARENT_GIF, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}