/**
 * @file /api/templates/demo/status/[installationId] - GET
 * @description Kullanicinin demo deployment'inin anlik durumunu doner.
 *              Polling tabanli: kullanici UI'da her 5s'de bir bu endpoint'i
 *              cagirir, status 'ready' oldugunda deployedUrl'i acar.
 *
 * Response: { installationId, status, deployedUrl, errorMessage? }
 *
 * Auth: NextAuth session zorunlu. Sahiplik kontrolu service katmaninda
 *       (license.workspaceId veya buyerEmail uzerinden) yapilir.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/modules/shared/errors';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { installationId: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');

    const installationId = params.installationId;

    // "pending-<uuid>" prefix'i queue'nun memory modunda oldugu durumlar
    // icin kullaniliyor; henuz gercek installation row yoksa 404 don.
    if (installationId.startsWith('pending-')) {
      throw new NotFoundError('Demo henüz başlatılmadı veya sırada');
    }

    const installation = await prisma.templateInstallation.findUnique({
      where: { id: installationId },
      include: {
        license: {
          select: {
            buyerEmail: true,
            workspaceId: true,
            workspace: { select: { ownerId: true } },
          },
        },
      },
    });
    if (!installation) throw new NotFoundError('Demo installation');

    // Authz: lisans sahibi (buyerEmail) VEYA workspace sahibi VEYA admin
    const buyerEmail = installation.license.buyerEmail?.toLowerCase();
    const sessionEmail = session.user.email?.toLowerCase();
    const isOwner = installation.license.workspace?.ownerId === session.user.id;
    const isBuyer = buyerEmail && sessionEmail && buyerEmail === sessionEmail;
    const isAdmin = (session.user as { role?: string }).role === 'admin';

    if (!isOwner && !isBuyer && !isAdmin) {
      throw new ForbiddenError('Bu demo deployment durumunu görme yetkiniz yok');
    }

    return ok({
      installationId: installation.id,
      status: installation.status,
      deployedUrl: installation.deployedUrl ?? null,
      errorMessage: installation.errorMessage ?? null,
      startedAt: installation.startedAt,
      completedAt: installation.completedAt ?? null,
    });
  });
}
