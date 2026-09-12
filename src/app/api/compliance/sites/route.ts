/**
 * @file Compliance Sites — List & Create Endpoint
 * @description GET: workspace sitelerini listele.
 *              POST: yeni site ekle.
 *
 *              GET/POST auth + rate-limit ile korunur.
 *              POST'ta logAudit ile site creation izi birakilir.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/modules/shared/errors';
import { addComplianceSite, listComplianceSites } from '@/modules/compliance/service';
import { AddSiteSchema, ListSitesQuerySchema } from '@/modules/compliance/schemas';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { withRateLimit, RateLimits } from '@/lib/rateLimitMiddleware';
import { logAudit } from '@/lib/audit';

// GET — listeleme (auth zorunlu, rate-limit hafif)
export const GET = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const url = new URL(req.url);
    const query = ListSitesQuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
    });

    // Kullanıcının erişebildiği workspace'leri filtrele
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    const workspaceIds = memberships.map((m) => m.workspaceId);
    if (workspaceIds.length === 0) {
      return ok({ sites: [], meta: { total: 0, page: 1, pageSize: query.pageSize } });
    }

    // Multi-workspace desteği: tüm workspace'ler için listele ve birleştir
    // (listComplianceSites tek workspace kabul ediyor; burada Promise.all ile paralel)
    const results = await Promise.all(
      workspaceIds.map((wid) => listComplianceSites(wid, query))
    );
    // listComplianceSites { items, total, page, pageSize } doner — multi-workspace
    // icin tum items'lar birlestirilir.
    const allSites = results.flatMap((r) => r.items ?? []);
    // Sayfalama client-side
    const start = (query.page - 1) * query.pageSize;
    const paginated = allSites.slice(start, start + query.pageSize);
    return ok({
      sites: paginated,
      meta: {
        total: allSites.length,
        page: query.page,
        pageSize: query.pageSize,
      },
    });
  });
});

// POST — site ekleme (auth + rate-limit + audit)
export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;
    const userEmail = session.user.email ?? undefined;

    const body = await req.json().catch(() => {
      throw new ValidationError('Geçersiz JSON gövdesi');
    });
    const input = AddSiteSchema.parse(body);

    // workspaceId request body'sinden alinmali
    const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : null;
    if (!workspaceId) {
      throw new ValidationError('workspaceId gerekli');
    }

    // Üyelik kontrolü
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
    if (!member) {
      throw new ForbiddenError('Workspace üyesi değilsiniz');
    }

    const site = await addComplianceSite({
      workspaceId,
      userId,
      userEmail,
      input,
    });

    logger.info('[compliance] Site added via API', { siteId: site.id, workspaceId });

    // Audit — fire-and-forget
    logAudit({
      userId,
      userEmail,
      action: 'CREATE',
      resource: 'compliance_site',
      resourceId: site.id,
      details: { workspaceId, domain: input.domain },
    }).catch(() => undefined);

    return ok({ site }, { status: 201 });
  });
});
