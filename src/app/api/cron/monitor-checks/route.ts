/**
 * Cron: /api/cron/monitor-checks
 * Due monitörleri HTTP GET ile kontrol eder; status + MonitorCheck yazar.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import { AppError } from '@/modules/shared/errors';
import { webhookService } from '@/modules/webhooks';

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

const MAX_PER_RUN = 25;

async function checkOne(monitor: {
  id: string;
  url: string;
  timeoutSec: number;
  expectedStatus: number | null;
  keywordValue: string | null;
}): Promise<{ isUp: boolean; responseMs: number | null; statusCode: number | null; errorMessage: string | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(monitor.timeoutSec, 30) * 1000);
  const started = Date.now();
  try {
    const res = await fetch(monitor.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'NoktanyusMonitor/1.0' },
    });
    const responseMs = Date.now() - started;
    const statusCode = res.status;
    let isUp = monitor.expectedStatus != null ? statusCode === monitor.expectedStatus : statusCode >= 200 && statusCode < 400;

    if (isUp && monitor.keywordValue) {
      const text = await res.text();
      if (!text.includes(monitor.keywordValue)) {
        isUp = false;
        return {
          isUp,
          responseMs,
          statusCode,
          errorMessage: `Keyword bulunamadı: ${monitor.keywordValue}`,
        };
      }
    }

    return {
      isUp,
      responseMs,
      statusCode,
      errorMessage: isUp ? null : `Beklenmeyen status: ${statusCode}`,
    };
  } catch (err) {
    return {
      isUp: false,
      responseMs: Date.now() - started,
      statusCode: null,
      errorMessage: err instanceof Error ? err.message : 'Check failed',
    };
  } finally {
    clearTimeout(timeout);
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
    if (auth !== `Bearer ${expected}`) throw new InvalidCronKeyError();

    const now = new Date();
    const candidates = await prisma.monitor.findMany({
      where: { status: { not: 'PAUSED' } },
      orderBy: { lastCheckedAt: 'asc' },
      take: 80,
      select: {
        id: true,
        userId: true,
        url: true,
        timeoutSec: true,
        expectedStatus: true,
        keywordValue: true,
        intervalSec: true,
        lastCheckedAt: true,
        status: true,
      },
    });

    const due = candidates
      .filter((m) => {
        if (!m.lastCheckedAt) return true;
        return now.getTime() - m.lastCheckedAt.getTime() >= m.intervalSec * 1000;
      })
      .slice(0, MAX_PER_RUN);

    let checked = 0;
    let up = 0;
    let down = 0;
    let webhooksFired = 0;

    for (const m of due) {
      const result = await checkOne(m);
      checked += 1;
      if (result.isUp) up += 1;
      else down += 1;

      const prevStatus = m.status;
      const nextStatus = result.isUp ? 'UP' : 'DOWN';

      await prisma.$transaction([
        prisma.monitorCheck.create({
          data: {
            monitorId: m.id,
            isUp: result.isUp,
            responseMs: result.responseMs,
            statusCode: result.statusCode,
            errorMessage: result.errorMessage,
          },
        }),
        prisma.monitor.update({
          where: { id: m.id },
          data: {
            status: nextStatus,
            lastCheckedAt: now,
            lastResponseMs: result.responseMs,
          },
        }),
      ]);

      if (!result.isUp && prevStatus !== 'DOWN') {
        await prisma.incident.create({
          data: {
            monitorId: m.id,
            reason: result.errorMessage ?? 'Monitor down',
            severity: 'HIGH',
            affectedChecks: 1,
            totalChecks: 1,
          },
        });
        webhooksFired += await webhookService.dispatchEvent(
          'monitor.down',
          {
            monitorId: m.id,
            url: m.url,
            status: 'DOWN',
            errorMessage: result.errorMessage,
            statusCode: result.statusCode,
            responseMs: result.responseMs,
          },
          m.userId
        );
      } else if (result.isUp && prevStatus === 'DOWN') {
        webhooksFired += await webhookService.dispatchEvent(
          'monitor.up',
          {
            monitorId: m.id,
            url: m.url,
            status: 'UP',
            responseMs: result.responseMs,
            statusCode: result.statusCode,
          },
          m.userId
        );
      }
    }

    const summary = { checked, up, down, due: due.length, webhooksFired };
    logger.info('Monitor checks cron processed', summary);
    return ok({ success: true, ...summary });
  });
}

export async function GET() {
  return ok({ status: 'ok', endpoint: 'monitor-checks', method: 'POST' });
}
