/**
 * Monitoring Module — Service Layer
 *
 * UptimeRobot benzeri monitoring iş mantığı:
 * - HTTP/HTTPS/Ping/Port/Keyword/JSON check
 * - Incident tracking (open → resolve)
 * - Alert channel dispatch (email, webhook, slack, discord, telegram)
 * - Scheduled runner (cron tetikler)
 * - Uptime istatistikleri
 */

import https from 'https';
import http from 'http';
import net from 'net';
import dns from 'dns/promises';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';
import { NotFoundError, ValidationError, ForbiddenError } from '@/modules/shared/errors';
import {
  monitorRepository,
  incidentRepository,
  alertChannelRepository,
} from './repository';
import type { CreateMonitorInput, UpdateMonitorInput, CreateAlertChannelInput, UpdateAlertChannelInput } from './schemas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckResult {
  isUp: boolean;
  statusCode?: number;
  errorMessage?: string;
  responseMs: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const monitoringService = {
  // --- Monitor CRUD -------------------------------------------------------

  async listMonitors(userId: string, opts?: { status?: 'UP' | 'DOWN' | 'PAUSED' | 'PENDING' }) {
    return monitorRepository.findByUserId(userId, opts);
  },

  async getMonitor(userId: string, monitorId: string) {
    const monitor = await monitorRepository.findByIdForUser(monitorId, userId);
    if (!monitor) throw new NotFoundError('Monitör');
    return monitor;
  },

  async createMonitor(userId: string, input: CreateMonitorInput) {
    // publicSlug unique kontrolü
    if (input.isPublic && input.publicSlug) {
      const existing = await monitorRepository.findByPublicSlug(input.publicSlug);
      if (existing) throw new ValidationError('Bu public slug zaten kullanılıyor');
    }

    return monitorRepository.create({
      name: input.name,
      url: input.url,
      type: input.type,
      status: 'PENDING',
      intervalSec: input.intervalSec,
      expectedStatus: input.expectedStatus ?? null,
      keywordValue: input.keywordValue ?? null,
      jsonPath: input.jsonPath ?? null,
      timeoutSec: input.timeoutSec,
      isPublic: input.isPublic,
      publicSlug: input.publicSlug ?? null,
      region: input.region,
      tags: input.tags,
      alertChannelIds: input.alertChannelIds,
      uptimePct30d: 100,
      userId,
    });
  },

  async updateMonitor(userId: string, monitorId: string, input: UpdateMonitorInput) {
    await this.getMonitor(userId, monitorId);

    if (input.isPublic && input.publicSlug) {
      const existing = await monitorRepository.findByPublicSlug(input.publicSlug);
      if (existing && existing.id !== monitorId) {
        throw new ValidationError('Bu public slug zaten kullanılıyor');
      }
    }

    return monitorRepository.update(monitorId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.url !== undefined && { url: input.url }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.intervalSec !== undefined && { intervalSec: input.intervalSec }),
      ...(input.expectedStatus !== undefined && { expectedStatus: input.expectedStatus }),
      ...(input.keywordValue !== undefined && { keywordValue: input.keywordValue }),
      ...(input.jsonPath !== undefined && { jsonPath: input.jsonPath }),
      ...(input.timeoutSec !== undefined && { timeoutSec: input.timeoutSec }),
      ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      ...(input.publicSlug !== undefined && { publicSlug: input.publicSlug }),
      ...(input.region !== undefined && { region: input.region }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.alertChannelIds !== undefined && { alertChannelIds: input.alertChannelIds }),
    });
  },

  async deleteMonitor(userId: string, monitorId: string) {
    await this.getMonitor(userId, monitorId);
    return monitorRepository.delete(monitorId);
  },

  // --- Check Engine -------------------------------------------------------

  async checkMonitor(monitorId: string): Promise<CheckResult> {
    const monitor = await monitorRepository.findById(monitorId);
    if (!monitor) throw new NotFoundError('Monitör');

    const startTime = Date.now();
    try {
      let result: Omit<CheckResult, 'responseMs'>;

      if (monitor.type === 'PING') {
        result = await this.pingCheck(monitor.url);
      } else if (monitor.type === 'PORT') {
        result = await this.portCheck(monitor.url);
      } else if (monitor.type === 'KEYWORD' || monitor.type === 'HTTP' || monitor.type === 'HTTPS') {
        result = await this.httpCheck(monitor);
      } else if (monitor.type === 'JSON') {
        result = await this.jsonCheck(monitor);
      } else {
        result = await this.httpCheck(monitor);
      }

      return { ...result, responseMs: Date.now() - startTime };
    } catch (err) {
      logger.error('checkMonitor failed unexpectedly', { monitorId, error: err });
      return {
        isUp: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        responseMs: Date.now() - startTime,
      };
    }
  },

  async httpCheck(monitor: { url: string; timeoutSec: number; expectedStatus?: number | null; keywordValue?: string | null; type: string }): Promise<{ isUp: boolean; statusCode?: number; errorMessage?: string }> {
    return new Promise((resolve) => {
      let url: URL;
      try {
        url = new URL(monitor.url);
      } catch {
        resolve({ isUp: false, errorMessage: 'Invalid URL' });
        return;
      }

      const protocol = url.protocol === 'https:' ? https : http;
      const req = protocol.request(
        {
          method: 'GET',
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          timeout: (monitor.timeoutSec || 30) * 1000,
          headers: { 'User-Agent': 'Noktanyus-Monitor/1.0' },
        },
        (res) => {
          let body = '';
          // 1 MB cap (keyword check için body yeterli olmalı)
          const MAX_BODY = 1024 * 1024;
          let totalLen = 0;
          res.on('data', (chunk: Buffer) => {
            if (totalLen >= MAX_BODY) return;
            const slice = chunk.slice(0, MAX_BODY - totalLen);
            body += slice.toString('utf8');
            totalLen += slice.length;
          });
          res.on('end', () => {
            const statusCode = res.statusCode || 0;
            let isUp = statusCode >= 200 && statusCode < 400;
            if (monitor.expectedStatus && statusCode !== monitor.expectedStatus) isUp = false;
            if (isUp && monitor.keywordValue && !body.includes(monitor.keywordValue)) {
              isUp = false;
            }
            resolve({ isUp, statusCode });
          });
        }
      );

      req.on('error', (err) => resolve({ isUp: false, errorMessage: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ isUp: false, errorMessage: 'Timeout' });
      });
      req.end();
    });
  },

  async jsonCheck(monitor: { url: string; timeoutSec: number; jsonPath?: string | null }): Promise<{ isUp: boolean; statusCode?: number; errorMessage?: string }> {
    const httpResult = await this.httpCheck({ ...monitor, type: 'HTTPS', keywordValue: null, expectedStatus: null });
    if (!httpResult.isUp) return httpResult;

    if (!monitor.jsonPath) return { ...httpResult, isUp: false, errorMessage: 'jsonPath tanımlı değil' };

    try {
      const body = await this.fetchBody(monitor.url, monitor.timeoutSec || 30);
      const json = JSON.parse(body);
      const expected = this.extractJsonPath(monitor.jsonPath);
      const value = this.readJsonPath(json, monitor.jsonPath);
      if (value === undefined) return { ...httpResult, isUp: false, errorMessage: 'jsonPath bulunamadı' };
      // Eğer path "$.status" gibi sadece okuma ise, undefined değilse UP
      // İleri seviye: expected value desteği eklenebilir
      return httpResult;
    } catch (err) {
      return {
        ...httpResult,
        isUp: false,
        errorMessage: err instanceof Error ? `JSON parse: ${err.message}` : 'JSON parse failed',
      };
    }
  },

  async pingCheck(host: string): Promise<{ isUp: boolean; errorMessage?: string }> {
    const hostname = host.replace(/^https?:\/\//, '').split('/')[0];
    try {
      await dns.lookup(hostname);
      return { isUp: true };
    } catch {
      return { isUp: false, errorMessage: 'DNS resolution failed' };
    }
  },

  async portCheck(addr: string): Promise<{ isUp: boolean; errorMessage?: string }> {
    const [host, portStr] = addr.split(':');
    const port = parseInt(portStr, 10);
    if (!host || Number.isNaN(port)) {
      return { isUp: false, errorMessage: 'Geçersiz host:port (örn: example.com:80)' };
    }
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeoutMs = 5000;
      socket.setTimeout(timeoutMs);
      socket.once('connect', () => {
        socket.destroy();
        resolve({ isUp: true });
      });
      socket.once('timeout', () => {
        socket.destroy();
        resolve({ isUp: false, errorMessage: 'Timeout' });
      });
      socket.once('error', (err) => resolve({ isUp: false, errorMessage: err.message }));
      socket.connect(port, host);
    });
  },

  async fetchBody(url: string, timeoutSec: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const protocol = parsed.protocol === 'https:' ? https : http;
      const req = protocol.request(
        {
          method: 'GET',
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + parsed.search,
          timeout: timeoutSec * 1000,
          headers: { 'User-Agent': 'Noktanyus-Monitor/1.0' },
        },
        (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk: string) => (body += chunk));
          res.on('end', () => resolve(body));
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      req.end();
    });
  },

  // Basit JSON path reader: $.a.b[0].c  → json.a.b[0].c
  readJsonPath(obj: unknown, path: string): unknown {
    if (!path.startsWith('$.') && path !== '$') return undefined;
    const tokens = path
      .slice(2)
      .split(/[\.\[\]]/)
      .filter(Boolean);
    let cur: unknown = obj;
    for (const t of tokens) {
      if (cur === null || cur === undefined) return undefined;
      cur = (cur as Record<string, unknown>)[t];
    }
    return cur;
  },

  extractJsonPath(path: string): string | null {
    return path;
  },

  // --- Scheduled Runner (Cron tetikler) -----------------------------------

  async runScheduledChecks() {
    const dueMonitors = await monitorRepository.findDueForCheck();
    let successCount = 0;
    let failCount = 0;

    for (const monitor of dueMonitors) {
      try {
        const result = await this.checkMonitor(monitor.id);
        await monitorRepository.recordCheck(monitor.id, result);

        if (result.isUp) {
          successCount++;
          const openIncident = await incidentRepository.findOpen(monitor.id);
          if (openIncident) {
            await incidentRepository.resolve(
              openIncident.id,
              Math.floor((Date.now() - new Date(openIncident.startedAt).getTime()) / 1000)
            );
            await this.sendAlert(monitor, 'up', openIncident);
            // Up olunca uptime istatistiğini güncelle
            try {
              await monitorRepository.updateUptimeStats(monitor.id);
            } catch (e) {
              logger.warn('Uptime stats update failed', { monitorId: monitor.id, error: e });
            }
          }
        } else {
          failCount++;
          const openIncident = await incidentRepository.findOpen(monitor.id);
          if (!openIncident) {
            const incident = await incidentRepository.open(
              monitor.id,
              result.errorMessage || `HTTP ${result.statusCode ?? 'unknown'}`,
              'HIGH'
            );
            await this.sendAlert(monitor, 'down', incident);
          } else {
            await incidentRepository.incrementAffected(openIncident.id);
          }
        }
      } catch (err) {
        logger.error('Scheduled monitor check failed', { monitorId: monitor.id, error: err });
      }
    }

    logger.info('Scheduled monitor checks completed', {
      total: dueMonitors.length,
      successCount,
      failCount,
    });
    return { successCount, failCount, total: dueMonitors.length };
  },

  // --- Alert Dispatch -----------------------------------------------------

  async sendAlert(monitor: any, event: 'down' | 'up' | 'ssl_expiry', incident: any) {
    const alertIds = Array.isArray(monitor.alertChannelIds) ? (monitor.alertChannelIds as string[]) : [];
    if (alertIds.length === 0) return;

    let channels;
    try {
      channels = await alertChannelRepository.findByUserIdAndIds(monitor.userId, alertIds);
    } catch (err) {
      logger.error('Alert channel fetch failed', { monitorId: monitor.id, error: err });
      return;
    }

    const activeChannels = channels.filter((c) => c.active);
    for (const channel of activeChannels) {
      const events = Array.isArray(channel.events) ? (channel.events as string[]) : [];
      if (!events.includes(event)) continue;

      try {
        await this.dispatchAlert(channel, event, monitor, incident);
      } catch (err) {
        logger.error('Alert dispatch failed', { channelId: channel.id, error: err });
      }
    }
  },

  async dispatchAlert(channel: any, event: string, monitor: any, incident: any) {
    const config = (channel.config ?? {}) as Record<string, unknown>;
    const message = this.formatAlertMessage(event, monitor, incident);

    switch (channel.type) {
      case 'EMAIL': {
        const to = (config as { email?: string }).email;
        if (!to) {
          logger.warn('EMAIL channel missing email config', { channelId: channel.id });
          return;
        }
        await sendEmail({
          to,
          subject: `[${monitor.name}] ${event.toUpperCase()}`,
          html: `<pre style="font-family: monospace; padding: 16px; background: #f5f5f5;">${message.replace(/\n/g, '<br/>')}</pre>`,
          text: message,
        });
        return;
      }
      case 'WEBHOOK':
      case 'SLACK':
      case 'DISCORD': {
        const url = (config as { webhookUrl?: string }).webhookUrl;
        if (!url) {
          logger.warn('Webhook channel missing webhookUrl', { channelId: channel.id });
          return;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message, event, monitor: { id: monitor.id, name: monitor.name, url: monitor.url }, incident }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
        return;
      }
      case 'TELEGRAM': {
        const botToken = (config as { botToken?: string }).botToken;
        const chatId = (config as { chatId?: string }).chatId;
        if (!botToken || !chatId) {
          logger.warn('Telegram channel missing botToken/chatId', { channelId: channel.id });
          return;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
        return;
      }
      default:
        logger.warn('Unknown alert channel type', { channelId: channel.id, type: channel.type });
    }
  },

  formatAlertMessage(event: string, monitor: any, incident: any): string {
    if (event === 'down') {
      return `🔴 ${monitor.name} DOWN!\nURL: ${monitor.url}\nHata: ${incident.reason ?? 'unknown'}\nZaman: ${new Date().toISOString()}`;
    }
    if (event === 'up') {
      return `🟢 ${monitor.name} UP!\nURL: ${monitor.url}\nDowntime: ${incident.durationSec ?? 0}s`;
    }
    return `ℹ️ ${monitor.name}: ${event}`;
  },

  // --- Stats --------------------------------------------------------------

  async getStats(userId: string) {
    const monitors = await monitorRepository.findByUserId(userId);
    const total = monitors.length;
    const up = monitors.filter((m) => m.status === 'UP').length;
    const down = monitors.filter((m) => m.status === 'DOWN').length;
    const paused = monitors.filter((m) => m.status === 'PAUSED').length;
    const pending = monitors.filter((m) => m.status === 'PENDING').length;
    const avgUptime = total > 0 ? monitors.reduce((sum, m) => sum + m.uptimePct30d, 0) / total : 100;
    return { total, up, down, paused, pending, avgUptime: Number(avgUptime.toFixed(4)) };
  },

  async getMonitorChecks(userId: string, monitorId: string, limit = 100) {
    await this.getMonitor(userId, monitorId);
    return monitorRepository.getRecentChecks(monitorId, limit);
  },

  async getMonitorIncidents(userId: string, monitorId: string, limit = 10) {
    await this.getMonitor(userId, monitorId);
    return incidentRepository.findRecent(monitorId, limit);
  },

  // --- Alert Channel CRUD -------------------------------------------------

  async listAlertChannels(userId: string) {
    return alertChannelRepository.findByUserId(userId);
  },

  async getAlertChannel(userId: string, channelId: string) {
    const channel = await alertChannelRepository.findById(channelId);
    if (!channel || channel.userId !== userId) throw new NotFoundError('Alert kanalı');
    return channel;
  },

  async createAlertChannel(userId: string, input: CreateAlertChannelInput) {
    this.validateChannelConfig(input.type, input.config);
    return alertChannelRepository.create({
      name: input.name,
      type: input.type,
      config: input.config,
      events: input.events,
      active: input.active,
      userId,
    });
  },

  async updateAlertChannel(userId: string, channelId: string, input: UpdateAlertChannelInput) {
    const channel = await this.getAlertChannel(userId, channelId);
    if (input.type || input.config) {
      this.validateChannelConfig(input.type ?? channel.type, input.config ?? (channel.config as Record<string, unknown>));
    }
    return alertChannelRepository.update(channelId, input);
  },

  async deleteAlertChannel(userId: string, channelId: string) {
    await this.getAlertChannel(userId, channelId);
    return alertChannelRepository.delete(channelId);
  },

  validateChannelConfig(type: string, config: Record<string, unknown>) {
    if (type === 'EMAIL') {
      if (!config.email || typeof config.email !== 'string') {
        throw new ValidationError('EMAIL tipinde email alanı zorunlu');
      }
    } else if (type === 'WEBHOOK' || type === 'SLACK' || type === 'DISCORD') {
      if (!config.webhookUrl || typeof config.webhookUrl !== 'string') {
        throw new ValidationError(`${type} tipinde webhookUrl alanı zorunlu`);
      }
      try {
        new URL(config.webhookUrl);
      } catch {
        throw new ValidationError('webhookUrl geçerli bir URL olmalı');
      }
    } else if (type === 'TELEGRAM') {
      if (!config.botToken || !config.chatId) {
        throw new ValidationError('TELEGRAM tipinde botToken ve chatId zorunlu');
      }
    }
  },
};
