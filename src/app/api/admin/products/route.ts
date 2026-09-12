/**
 * @file /api/admin/products - POST (admin yeni ürün oluştur)
 * @description Admin için dijital ürün oluşturma endpoint'i. Auth + admin role + audit log.
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { created, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, ForbiddenError, ConflictError } from '@/modules/shared/errors';
import { DigitalProductSchema } from '@/modules/commerce/schemas';
import { generateSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    if (session.user.role !== 'admin') throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');

    const body = await req.json();
    const data = DigitalProductSchema.parse(body);

    const slug = data.slug ?? generateSlug(data.title);

    // Slug unique mi kontrol et
    const existing = await (await import('@/lib/prisma')).prisma.digitalProduct.findUnique({
      where: { slug },
    });
    if (existing) throw new ConflictError(`Bu slug (${slug}) zaten kullanımda`);

    const product = await (await import('@/lib/prisma')).prisma.digitalProduct.create({
      data: {
        slug,
        title: data.title,
        shortDescription: data.shortDescription,
        description: data.description,
        thumbnail: data.thumbnail ?? null,
        images: data.images ?? [],
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize ?? 0,
        priceCents: data.priceCents,
        currency: data.currency ?? 'try',
        downloadCountMax: data.downloadCountMax ?? 5,
        ttlHours: data.ttlHours ?? 72,
        technologies: data.technologies ?? [],
        category: data.category ?? 'general',
        version: data.version ?? null,
        requirements: data.requirements ?? undefined,
        active: data.active ?? true,
        featured: data.featured ?? false,
        order: data.order ?? 0,
        ownerId: session.user.id,
      },
    });

    revalidatePath('/admin/products');
    revalidatePath('/urunler');

    await logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: 'CREATE',
      resource: 'DigitalProduct',
      resourceId: product.id,
      details: { slug: product.slug, title: product.title },
    });

    return created({ product });
  });
}
