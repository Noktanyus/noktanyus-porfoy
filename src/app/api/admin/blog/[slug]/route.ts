/**
 * @file Blog yazısı tekil DELETE endpoint'i.
 * @description Slug parametresine göre ilgili blog kaydını Prisma üzerinden siler.
 *              Auth kontrolü + audit log.
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
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

    const blog = await prisma.blog.findUnique({ where: { slug: params.slug } });
    if (!blog) {
      throw new NotFoundError('Blog bulunamadı');
    }

    await prisma.blog.delete({ where: { id: blog.id } });

    // Cache invalidation
    revalidatePath('/');
    revalidatePath('/blog');
    revalidatePath(`/blog/${params.slug}`);

    const ipHeader = req.headers.get('x-forwarded-for');
    const uaHeader = req.headers.get('user-agent');

    await logAudit({
      userId: (session.user as any).id ?? undefined,
      userEmail: session.user.email ?? undefined,
      action: 'DELETE',
      resource: 'Blog',
      resourceId: blog.id,
      details: { slug: params.slug, title: blog.title },
      ipAddress: ipHeader ?? undefined,
      userAgent: uaHeader ?? undefined,
    });

    return ok({ success: true, deletedId: blog.id });
  });
}
