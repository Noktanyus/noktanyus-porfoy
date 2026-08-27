/**
 * @file Proje tekil DELETE endpoint'i.
 * @description Slug parametresine göre ilgili proje kaydını Prisma üzerinden siler.
 *              Auth kontrolü + audit log.
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, NotFoundError } from '@/modules/shared/errors';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }

    const project = await prisma.project.findUnique({ where: { slug: params.slug } });
    if (!project) {
      throw new NotFoundError('Proje bulunamadı');
    }

    await prisma.project.delete({ where: { id: project.id } });

    // Cache invalidation
    revalidatePath('/');
    revalidatePath('/projelerim');
    revalidatePath(`/projelerim/${params.slug}`);

    const ipHeader = req.headers.get('x-forwarded-for');
    const uaHeader = req.headers.get('user-agent');

    await logAudit({
      userId: (session.user as any).id ?? undefined,
      userEmail: session.user.email ?? undefined,
      action: 'DELETE',
      resource: 'Project',
      resourceId: project.id,
      details: { slug: params.slug, title: project.title },
      ipAddress: ipHeader ?? undefined,
      userAgent: uaHeader ?? undefined,
    });

    return ok({ success: true, deletedId: project.id });
  });
}
