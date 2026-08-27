/**
 * @file Dijital ürün tekil DELETE endpoint'i.
 * @description ID parametresine göre ilgili DigitalProduct kaydını Prisma üzerinden siler.
 *              Auth kontrolü + audit log + cache invalidation.
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
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }

    const product = await prisma.digitalProduct.findUnique({ where: { id: params.id } });
    if (!product) {
      throw new NotFoundError('Ürün bulunamadı');
    }

    await prisma.digitalProduct.delete({ where: { id: params.id } });

    // Cache invalidation
    revalidatePath('/');
    revalidatePath('/urunler');
    revalidatePath(`/urunler/${product.slug}`);
    revalidatePath('/admin/products');

    const ipHeader = req.headers.get('x-forwarded-for');
    const uaHeader = req.headers.get('user-agent');

    await logAudit({
      userId: (session.user as any).id ?? undefined,
      userEmail: session.user.email ?? undefined,
      action: 'DELETE',
      resource: 'DigitalProduct',
      resourceId: product.id,
      details: { slug: product.slug, title: product.title },
      ipAddress: ipHeader ?? undefined,
      userAgent: uaHeader ?? undefined,
    });

    return ok({ success: true, deletedId: product.id });
  });
}
