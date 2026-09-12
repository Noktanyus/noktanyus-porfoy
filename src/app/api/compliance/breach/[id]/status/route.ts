/**
 * Compliance Breach — VERBİS Submission Status Endpoint (L8)
 *
 * GET /api/compliance/breach/[id]/status
 *   → DB'den kayıtlı VERBİS submission durumunu döner:
 *     { verbisNotificationId, verbisStatus, verbisSubmittedAt,
 *       kvkkMadde12Deadline, escalatedToVerbis, affectedUsersNotifiedAt }
 *
 * VERBİS'ten canlı status için verbis client'ın getBreachNotificationStatus
 * fonksiyonu kullanılabilir (background polling için).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';
import { getBreachNotificationStatus } from '@/lib/verbis';

export const GET = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 });
    }

    const id = req.url.split('/').filter(Boolean).pop()!;

    const incident = await prisma.dataBreachIncident.findUnique({
      where: { id },
      select: {
        id: true,
        workspaceId: true,
        severity: true,
        verbisNotificationId: true,
        verbisStatus: true,
        verbisSubmittedAt: true,
        affectedUsersNotifiedAt: true,
        kvkkMadde12Deadline: true,
        escalatedToVerbis: true,
      },
    });
    if (!incident) {
      return fail({ code: 'NOT_FOUND', message: 'Breach incident bulunamadı', statusCode: 404 });
    }

    // Workspace üyeliği kontrolü
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: incident.workspaceId, userId: session.user.id },
      select: { id: true },
    });
    if (!member) {
      const ws = await prisma.workspace.findFirst({
        where: { id: incident.workspaceId, ownerId: session.user.id },
        select: { id: true },
      });
      if (!ws) {
        return fail({ code: 'FORBIDDEN', message: 'Bu workspace\'e erişim yetkiniz yok', statusCode: 403 });
      }
    }

    // VERBİS'ten canlı status (varsa)
    let liveVerbisStatus: Awaited<ReturnType<typeof getBreachNotificationStatus>> | null = null;
    if (incident.verbisNotificationId) {
      try {
        liveVerbisStatus = await getBreachNotificationStatus(incident.verbisNotificationId);
      } catch {
        // Live status fetch fail — DB status'u yeterli
      }
    }

    return ok({
      incidentId: incident.id,
      severity: incident.severity,
      verbis: {
        notificationId: incident.verbisNotificationId,
        status: incident.verbisStatus,
        submittedAt: incident.verbisSubmittedAt,
        live: liveVerbisStatus,
      },
      kvkk: {
        madde12Deadline: incident.kvkkMadde12Deadline,
        affectedUsersNotifiedAt: incident.affectedUsersNotifiedAt,
        escalatedToVerbis: incident.escalatedToVerbis,
      },
    }) as NextResponse;
  });
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
