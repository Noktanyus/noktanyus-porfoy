/**
 * Monitoring Module — Zod Schemas
 *
 * Monitor, AlertChannel, Incident için input validation şemaları.
 * UptimeRobot benzeri monitoring sistemi.
 */

import { z } from 'zod';

// --- Enums ---
export const MonitorTypeSchema = z.enum(['HTTP', 'HTTPS', 'PING', 'PORT', 'KEYWORD', 'JSON']);
export const MonitorStatusSchema = z.enum(['UP', 'DOWN', 'PAUSED', 'PENDING']);

// --- Monitor ---
export const CreateMonitorSchema = z.object({
  name: z.string().min(1, 'İsim zorunlu').max(100, 'İsim en fazla 100 karakter'),
  url: z.string().min(1, 'URL/Host zorunlu').max(500, 'URL en fazla 500 karakter'),
  type: MonitorTypeSchema.default('HTTPS'),
  intervalSec: z.number().int().min(60, 'Minimum 60 saniye').max(86400, 'Maksimum 24 saat').default(300),
  expectedStatus: z.number().int().min(100).max(599).optional().nullable(),
  keywordValue: z.string().max(200).optional().nullable(),
  jsonPath: z.string().max(200).optional().nullable(),
  timeoutSec: z.number().int().min(1, 'Min 1s').max(60, 'Max 60s').default(30),
  isPublic: z.boolean().default(false),
  publicSlug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Sadece küçük harf, rakam ve tire')
    .max(60, 'Max 60 karakter')
    .optional()
    .nullable(),
  region: z.enum(['eu-west', 'us-east', 'asia', 'auto']).default('auto'),
  tags: z.array(z.string()).default([]),
  alertChannelIds: z.array(z.string()).default([]),
});

export const UpdateMonitorSchema = CreateMonitorSchema.partial();

// --- Alert Channel ---
export const CreateAlertChannelSchema = z.object({
  name: z.string().min(1, 'İsim zorunlu').max(100),
  type: z.enum(['EMAIL', 'WEBHOOK', 'SLACK', 'DISCORD', 'TELEGRAM']),
  config: z.record(z.string(), z.any()),
  events: z.array(z.enum(['down', 'up', 'ssl_expiry'])).default(['down', 'up']),
  active: z.boolean().default(true),
});

export const UpdateAlertChannelSchema = CreateAlertChannelSchema.partial();

// --- Type exports ---
export type CreateMonitorInput = z.infer<typeof CreateMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof UpdateMonitorSchema>;
export type CreateAlertChannelInput = z.infer<typeof CreateAlertChannelSchema>;
export type UpdateAlertChannelInput = z.infer<typeof UpdateAlertChannelSchema>;
export type MonitorType = z.infer<typeof MonitorTypeSchema>;
export type MonitorStatus = z.infer<typeof MonitorStatusSchema>;
