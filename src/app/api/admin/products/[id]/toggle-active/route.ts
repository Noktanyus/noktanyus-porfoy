/**
 * @file Dijital ürün aktif/pasif toggle endpoint'i.
 * @description ID parametresine göre ilgili ürünün `active` alanını tersine çevirir.
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, NotFoundError } from '@/modules/shared/errors';

export async function PATCH(
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

    const updated = await prisma.digitalProduct.update({
      where: { id: params.id },
      data: { active: !product.active },
    });

    revalidatePath('/');
    revalidatePath('/urunler');
    revalidatePath(`/urunler/${product.slug}`);
    revalidatePath('/admin/products');

    const ipHeader = req.headers.get('x-forwarded-for');
    const uaHeader = req.headers.get('user-agent');

    await logAudit({
      userId: (session.user as any).id ?? undefined,
      userEmail: session.user.email ?? undefined,
      action: 'UPDATE',
      resource: 'DigitalProduct',
      resourceId: product.id,
      details: { toggleField: 'active', from: product.active, to: updated.active },
      ipAddress: ipHeader ?? undefined,
      userAgent: uaHeader ?? undefined,
    });

    return ok({ product: updated });
  });
}
