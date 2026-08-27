/**
 * @file Cron: publish-scheduled — Zamanı gelmiş scheduled yazıları yayınla.
 * @description POST: scheduledAt <= now olan tüm Blog kayıtlarını
 *              status="published" yapar ve publishedAt set eder.
 *              Bearer token ile korunur (CRON_SECRET env).
 *              Vercel Cron veya harici scheduler tarafından tetiklenir.
 */

import { NextRequest } from 'next/server';
import { blogService } from '@/modules/content/service';
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

export const dynamic = 'force-dynamic';

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

    const count = await blogService.autoPublishDue();
    logger.info('Publish-scheduled cron processed', { published: count });
    return ok({ published: count });
  });
}

// GET ile health check (cron provider'larin test icin)
export async function GET() {
  return ok({ status: 'ok', endpoint: 'publish-scheduled', method: 'POST' });
}
