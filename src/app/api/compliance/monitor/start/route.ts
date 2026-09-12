/**
 * @file /api/compliance/monitor/start - Continuous monitoring başlat
 * @description POST: ComplianceSite için paused → pending geçişi, nextScanAt
 *              hesabı, opsiyonel immediate scan tetikleme.
 *
 * Auth: authenticated user + workspace membership.
 * Body: { workspaceId: string, siteId: string, triggerImmediateScan?: boolean }
 * Response: { siteId, status, nextScanAt, immediateScanId? }
 *
 * NOT: Bu endpoint aslında "monitoring resume" semantiği taşır — site
 * pause edildiyse tekrar aktif eder. Daily/weekly/monthly scan zaten
 * scheduler tarafından handle edilir; bu endpoint sadece paused siteleri
 * açar.
 */

import { NextRequest } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ValidationError } from '@/modules/shared/errors';
import { assertWorkspaceAccess } from '@/lib/saasWorkspace';
import { resumeMonitoring } from '@/modules/compliance/scheduler';

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

    const triggerImmediateScan =
      typeof body.triggerImmediateScan === 'boolean' ? body.triggerImmediateScan : true;

    const result = await resumeMonitoring({
      siteId,
      workspaceId,
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      triggerImmediateScan,
    });

    return ok(result);
  });
}