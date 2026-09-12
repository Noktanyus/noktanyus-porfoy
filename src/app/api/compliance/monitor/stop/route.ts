/**
 * @file /api/compliance/monitor/stop - Continuous monitoring durdur
 * @description POST: ComplianceSite.status'u 'paused' yapar, nextScanAt'i
 *              null eder. Scheduler artık bu site için scan üretmez.
 *
 * Auth: authenticated user + workspace membership.
 * Body: { workspaceId: string, siteId: string }
 * Response: { siteId, status: 'paused', pausedAt }
 */

import { NextRequest } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ValidationError } from '@/modules/shared/errors';
import { assertWorkspaceAccess } from '@/lib/saasWorkspace';
import { pauseMonitoring } from '@/modules/compliance/scheduler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const siteId = typeof body.siteId === 'string' ? body.siteId.trim() : '';
    if (!siteId) {
      throw new ValidationError('siteId zorunlu');
    }

    const result = await pauseMonitoring({
      siteId,
      workspaceId,
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
    });

    return ok(result);
  });
}