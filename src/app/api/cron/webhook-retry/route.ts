/**
 * @file Webhook Retry — Cron Endpoint
 * @description POST: Retry kuyruğundaki delivery'leri işle.
 *              Bearer token ile korunur (CRON_SECRET env).
 *              Vercel Cron veya harici scheduler tarafından tetiklenir.
 */

import { NextRequest } from 'next/server';
import { webhookService } from '@/modules/webhooks';
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

    const result = await webhookService.processRetries();
    logger.info('Webhook retry cron processed', result);
    return ok({ success: true, ...result });
  });
}

// GET ile health check (cron provider'ların test için)
export async function GET() {
  return ok({ status: 'ok', endpoint: 'webhook-retry', method: 'POST' });
}
