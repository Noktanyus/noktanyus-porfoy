/**
 * @file /api/compliance/breach/report - Manual breach report endpoint
 * @description POST: Workspace üyesi kendi sitesi veya workspace'i için
 *              data breach incident bildirir. DataBreachIncident oluşturulur,
 *              Sentry captureMessage, email + audit log.
 *
 * Auth: authenticated user + workspace membership.
 * Body: {
 *   workspaceId, severity (LOW|MEDIUM|HIGH|CRITICAL),
 *   title, description, siteId?, affectedUsers?, dataCategories?
 * }
 * Response: { incidentId, notifyKvkk, sentryCaptured, emailSent }
 */

import { NextRequest } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ValidationError } from '@/modules/shared/errors';
import { assertWorkspaceAccess } from '@/lib/saasWorkspace';
import {
  processBreachSignal,
  type BreachSeverity,
} from '@/modules/compliance/breachDetector';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SEVERITY_VALUES: BreachSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const wsCheck = await assertWorkspaceAccess(req, session.user.id, { body });
    if (wsCheck.error) return wsCheck.error;
    const workspaceId = wsCheck.workspaceId;

    // Body validation
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length < 3 || title.length > 200) {
      throw new ValidationError('title 3-200 karakter olmalı');
    }

    const description =
      typeof body.description === 'string' ? body.description.trim() : '';
    if (description.length < 10 || description.length > 5000) {
      throw new ValidationError('description 10-5000 karakter olmalı');
    }

    const severityRaw = typeof body.severity === 'string' ? body.severity.toUpperCase() : '';
    if (!SEVERITY_VALUES.includes(severityRaw as BreachSeverity)) {
      throw new ValidationError(
        `severity LOW|MEDIUM|HIGH|CRITICAL olmalı (received: ${severityRaw})`
      );
    }

    const siteId =
      typeof body.siteId === 'string' && body.siteId.trim().length > 0
        ? body.siteId.trim()
        : undefined;

    const affectedUsers =
      typeof body.affectedUsers === 'number' && body.affectedUsers > 0
        ? Math.floor(body.affectedUsers)
        : undefined;

    const dataCategories = Array.isArray(body.dataCategories)
      ? (body.dataCategories as unknown[]).filter(
          (x): x is string => typeof x === 'string'
        )
      : undefined;

    const result = await processBreachSignal({
      source: 'manual',
      severity: severityRaw as BreachSeverity,
      title,
      description,
      workspaceId,
      siteId,
      affectedUsers,
      dataCategories,
      metadata: {
        reportedBy: session.user.id,
        reportedByEmail: session.user.email ?? null,
        ipAddress:
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          req.headers.get('x-real-ip') ??
          null,
        userAgent: req.headers.get('user-agent') ?? null,
      },
    });

    return ok(result);
  });
}