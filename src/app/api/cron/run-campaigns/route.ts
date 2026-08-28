/**
 * Cron: Run Campaigns
 *
 * Vercel Cron / external scheduler tarafindan tetiklenir.
 * CRON_SECRET bearer token ile korunur.
 * Tum "running" campaign'lerin due olanlarini execute eder.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { emailMarketingService } from '@/modules/email-marketing/service';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const count = await emailMarketingService.processCampaigns();
    logger.info('[cron] Campaigns processed', { count });

    return ok({ processed: count });
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}