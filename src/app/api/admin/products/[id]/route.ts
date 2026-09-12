/**
 * @file Dijital ürün tekil endpoint'i.
 * @description ID parametresine göre ilgili DigitalProduct kaydını Prisma üzerinden yönetir.
 *              - DELETE: Ürünü siler
 *              - PUT: Ürünü günceller (admin)
 *              Auth kontrolü + audit log + cache invalidation.
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/modules/shared/errors';
import { DigitalProductSchema } from '@/modules/commerce/schemas';

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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    if (session.user.role !== 'admin') throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');

    const body = await req.json();
    const data = DigitalProductSchema.partial().parse(body);

    const product = await prisma.digitalProduct.findUnique({ where: { id: params.id } });
    if (!product) throw new NotFoundError('Ürün bulunamadı');

    const updated = await prisma.digitalProduct.update({
      where: { id: params.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
        ...(data.fileName !== undefined && { fileName: data.fileName }),
        ...(data.fileSize !== undefined && { fileSize: data.fileSize }),
        ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
        ...(data.technologies !== undefined && { technologies: data.technologies }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.downloadCountMax !== undefined && { downloadCountMax: data.downloadCountMax }),
        ...(data.ttlHours !== undefined && { ttlHours: data.ttlHours }),
      },
    });

    revalidatePath('/admin/products');
    revalidatePath('/urunler');
    revalidatePath(`/urunler/${updated.slug}`);

    await logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: 'UPDATE',
      resource: 'DigitalProduct',
      resourceId: updated.id,
      details: { slug: updated.slug, title: updated.title },
    });

    return ok({ product: updated });
  });
}
