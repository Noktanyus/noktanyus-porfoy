/**
 * Uptime Monitör — Ping / Check Runner
 * Hem cron hem de anlık kontroller (oluşturma ve manuel test) için ortak servis.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { webhookService } from '@/modules/webhooks';
import { sendEmail } from '@/lib/email';

export interface CheckResult {
  isUp: boolean;
  responseMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

export async function notifyAlertChannels(
  userId: string,
  channelIds: unknown,
  event: 'down' | 'up',
  payload: { name?: string; url: string; errorMessage?: string | null }
) {
  const ids = Array.isArray(channelIds) ? (channelIds as string[]) : [];
  if (ids.length === 0) return;

  const channels = await prisma.alertChannel.findMany({
    where: { userId, id: { in: ids }, active: true },
  });

  for (const ch of channels) {
    const events = Array.isArray(ch.events) ? (ch.events as string[]) : [];
    if (!events.includes(event)) continue;
    const cfg = (ch.config ?? {}) as Record<string, string>;
    const title = event === 'down' ? 'Monitör DOWN' : 'Monitör UP';
    const text = `${title}: ${payload.name ?? payload.url}\n${payload.url}${
      payload.errorMessage ? `\n${payload.errorMessage}` : ''
    }`;

    try {
      if (ch.type === 'EMAIL' && cfg.email) {
        await sendEmail({
          to: cfg.email,
          subject: `[Noktanyus] ${title}`,
          html: `<pre>${text}</pre>`,
        });
      } else if (
        (ch.type === 'WEBHOOK' || ch.type === 'SLACK' || ch.type === 'DISCORD') &&
        cfg.webhookUrl
      ) {
        await fetch(cfg.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            content: text,
            event: `monitor.${event}`,
            ...payload,
          }),
        });
      } else if (ch.type === 'TELEGRAM' && cfg.botToken && cfg.chatId) {
        await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: cfg.chatId, text }),
        });
      }
    } catch (err) {
      logger.error('Alert channel notify failed', { channelId: ch.id, error: err });
    }
  }
}

export async function checkOne(monitor: {
  id: string;
  url: string;
  timeoutSec: number;
  expectedStatus: number | null;
  keywordValue: string | null;
}): Promise<CheckResult> {
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
    let isUp =
      monitor.expectedStatus != null
        ? statusCode === monitor.expectedStatus
        : statusCode >= 200 && statusCode < 400;

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

/**
 * Tek bir monitörü hemen kontrol eder, DB'ye check yazar ve durumunu günceller.
 */
export async function runSingleMonitorCheck(monitorId: string) {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
  });

  if (!monitor) {
    logger.warn('[MonitorRunner] Monitör bulunamadı', { monitorId });
    return null;
  }

  const result = await checkOne({
    id: monitor.id,
    url: monitor.url,
    timeoutSec: monitor.timeoutSec,
    expectedStatus: monitor.expectedStatus,
    keywordValue: monitor.keywordValue,
  });

  const now = new Date();
  const prevStatus = monitor.status;
  const nextStatus = result.isUp ? 'UP' : 'DOWN';

  await prisma.$transaction([
    prisma.monitorCheck.create({
      data: {
        monitorId: monitor.id,
        isUp: result.isUp,
        responseMs: result.responseMs,
        statusCode: result.statusCode,
        errorMessage: result.errorMessage,
      },
    }),
    prisma.monitor.update({
      where: { id: monitor.id },
      data: {
        status: nextStatus,
        lastCheckedAt: now,
        lastResponseMs: result.responseMs,
      },
    }),
  ]);

  // Alarmlar ve bildirimler
  if (!result.isUp && prevStatus !== 'DOWN') {
    await prisma.incident.create({
      data: {
        monitorId: monitor.id,
        reason: result.errorMessage ?? 'Monitor down',
        severity: 'HIGH',
        affectedChecks: 1,
        totalChecks: 1,
      },
    });

    void webhookService.dispatchEvent(
      'monitor.down',
      {
        monitorId: monitor.id,
        url: monitor.url,
        status: 'DOWN',
        errorMessage: result.errorMessage,
        statusCode: result.statusCode,
        responseMs: result.responseMs,
      },
      monitor.userId
    );

    void notifyAlertChannels(monitor.userId, monitor.alertChannelIds, 'down', {
      name: monitor.name,
      url: monitor.url,
      errorMessage: result.errorMessage,
    });
  } else if (result.isUp && prevStatus === 'DOWN') {
    void webhookService.dispatchEvent(
      'monitor.up',
      {
        monitorId: monitor.id,
        url: monitor.url,
        status: 'UP',
        responseMs: result.responseMs,
        statusCode: result.statusCode,
      },
      monitor.userId
    );

    void notifyAlertChannels(monitor.userId, monitor.alertChannelIds, 'up', {
      name: monitor.name,
      url: monitor.url,
    });
  }

  logger.info('[MonitorRunner] Monitör kontrol edildi', {
    monitorId: monitor.id,
    name: monitor.name,
    isUp: result.isUp,
    responseMs: result.responseMs,
  });

  return {
    monitorId: monitor.id,
    status: nextStatus,
    ...result,
  };
}
