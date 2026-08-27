/**
 * Cron: /api/cron/subscription-resume
 *
 * Süresi dolmuş (pauseEndsAt <= now) duraklatılmış abonelikleri otomatik aktif yapar.
 * Bearer token ile korunur (CRON_SECRET env). Vercel Cron / external scheduler için.
 */

import { NextRequest } from 'next/server';
import { subscriptionPauseService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import { AppError } from '@/modules/shared/errors';

class CronSecretMissingError extends AppError {
  constructor() {
    super('CRON_SECRET yapılandırılmamış', 500, 'CONFIG_ERROR');
  }
}

class InvalidCronKeyError extends AppError {
  constructor() {
    super('Geçersiz cron anahtarı', 401, 'UNAUTHORIZED');
  }
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const auth = req.headers.get('authorization');
    const expected = process.env.CRON_SECRET;

    if (!expected) {
      logger.error('CRON_SECRET not configured');
      throw new CronSecretMissingError();
    }

    if (auth !== `Bearer ${expected}`) {
      throw new InvalidCronKeyError();
    }

    const count = await subscriptionPauseService.autoResumeDue();
    logger.info('Subscription resume cron processed', { resumed: count });
    return ok({ resumed: count });
  });
}

// GET ile health check
export async function GET() {
  return ok({ status: 'ok', endpoint: 'subscription-resume', method: 'POST' });
}
