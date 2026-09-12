/**
 * Compliance Breach — Manual VERBİS Submission Endpoint (L8)
 *
 * POST /api/compliance/breach/[id]/submit-verbis
 *   → Admin tarafından manuel VERBİS submission tetikler.
 *     maybeAutoSubmitToVerbis'i bypass eder (LOW/MEDIUM için bile çalışır).
 *
 * Auth: ADMIN rolü veya workspace OWNER olmalı.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';
import { maybeAutoSubmitToVerbis } from '@/modules/compliance/breachDetector';

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 });
    }

    const url = new URL(req.url);
    const id = url.pathname.split('/').filter(Boolean).pop()!;

    // Admin veya workspace owner kontrolü.
    // Session user.email ADMIN_EMAIL env'e eşitse global admin sayılır.
    const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const isGlobalAdmin = !!session.user.email && adminEmails.includes(session.user.email.toLowerCase());
    if (!isGlobalAdmin) {
      const incident = await prisma.dataBreachIncident.findUnique({
        where: { id },
        select: { workspaceId: true },
      });
      if (!incident) {
        return fail({ code: 'NOT_FOUND', message: 'Breach incident bulunamadı', statusCode: 404 });
      }
      const ws = await prisma.workspace.findFirst({
        where: { id: incident.workspaceId, ownerId: session.user.id },
        select: { id: true },
      });
      if (!ws) {
        return fail({ code: 'FORBIDDEN', message: 'Bu işlemi yapmaya yetkiniz yok', statusCode: 403 });
      }
    }

    const result = await maybeAutoSubmitToVerbis(id);
    return ok(result) as NextResponse;
  });
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
