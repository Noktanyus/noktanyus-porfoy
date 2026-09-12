/**
 * @file Compliance Breach Incidents — Create & List Endpoint
 * @description POST: yeni veri ihlali bildirimi oluştur.
 *              GET: workspace'in ihlallerini listele.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const BreachBodySchema = z.object({
  workspaceId: z.string().min(1),
  siteId: z.string().optional().nullable(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  affectedUsers: z.number().int().min(0).optional().nullable(),
  dataCategories: z.array(z.string()).optional(),
  detectedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;
    const userEmail = session.user.email ?? undefined;

    const body = await req.json();
    const data = BreachBodySchema.parse(body);

    // Workspace üyelik kontrolü
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: data.workspaceId, userId },
    });
    if (!member) {
      return ok({ error: { code: 'FORBIDDEN', message: 'Workspace üyesi değilsiniz' } } as any, { status: 403 });
    }

    // Site ID workspace'e ait mi?
    if (data.siteId) {
      const site = await prisma.complianceSite.findFirst({
        where: { id: data.siteId, workspaceId: data.workspaceId },
        select: { id: true },
      });
      if (!site) {
        return ok({ error: { code: 'INVALID_SITE', message: 'Site bu workspace\'e ait değil' } } as any, { status: 400 });
      }
    }

    const incident = await prisma.dataBreachIncident.create({
      data: {
        workspaceId: data.workspaceId,
        siteId: data.siteId ?? null,
        severity: data.severity,
        title: data.title,
        description: data.description,
        affectedUsers: data.affectedUsers ?? null,
        dataCategories: (data.dataCategories ?? undefined) as never,
        detectedAt: data.detectedAt ? new Date(data.detectedAt) : new Date(),
        metadata: (data.metadata ?? undefined) as never,
      },
    });

    // Audit log
    void logAudit({
      userId,
      userEmail,
      action: 'CREATE',
      resource: 'DataBreachIncident',
      resourceId: incident.id,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
      details: {
        severity: data.severity,
        workspaceId: data.workspaceId,
        affectedUsers: data.affectedUsers,
      },
    });

    logger.warn('[compliance] Breach incident reported', {
      incidentId: incident.id,
      severity: data.severity,
      workspaceId: data.workspaceId,
    });

    return ok({ incident }, { status: 201 });
  });
}

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    const workspaceIds = memberships.map((m) => m.workspaceId);
    if (workspaceIds.length === 0) {
      return ok({ incidents: [] });
    }

    const incidents = await prisma.dataBreachIncident.findMany({
      where: { workspaceId: { in: workspaceIds } },
      orderBy: { detectedAt: 'desc' },
      take: 100,
      include: { site: { select: { domain: true, name: true } } },
    });

    return ok({ incidents });
  });
}
