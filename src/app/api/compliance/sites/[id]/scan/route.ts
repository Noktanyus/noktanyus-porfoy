/**
 * @file Compliance Site — Scan Trigger Endpoint
 * @description POST: belirtilen site için tarama başlat.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';
import { startScan } from '@/modules/compliance/service';
import { StartScanSchema } from '@/modules/compliance/schemas';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    // Site workspace üyeliği kontrolü
    const site = await prisma.complianceSite.findUnique({
      where: { id: params.id },
      select: { workspaceId: true },
    });
    if (!site) {
      return ok({ error: { code: 'NOT_FOUND', message: 'Site bulunamadı' } } as any, { status: 404 });
    }
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: site.workspaceId, userId },
    });
    if (!member) {
      return ok({ error: { code: 'FORBIDDEN', message: 'Workspace üyesi değilsiniz' } } as any, { status: 403 });
    }

    let input = {};
    try {
      const body = await req.json();
      input = StartScanSchema.parse(body);
    } catch {
      // Boş body kabul edilir (default scanner config)
    }

    const scan = await startScan({
      siteId: params.id,
      workspaceId: site.workspaceId,
      userId,
      input,
    });

    return ok({ scan }, { status: 202 });
  });
}
