/**
 * @file Dijital ürün tekil PUT/DELETE endpoint'i.
 * @description ID parametresine göre DigitalProduct günceller veya siler.
 *              Auth kontrolü + audit log + cache invalidation.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, NotFoundError } from '@/modules/shared/errors';

const ProductUpdateSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir')
    .min(1)
    .max(100),
  shortDescription: z.string().min(10).max(300),
  description: z.string().min(50),
  thumbnail: z.string().url().optional().nullable(),
  fileUrl: z.string().min(1).max(500),
  fileName: z.string().min(1).max(200),
  fileSize: z.number().int().min(0),
  priceCents: z.number().int().min(0).max(10000000),
  category: z.string().min(1).max(50),
  technologies: z.array(z.string()).max(20).default([]),
  version: z.string().max(20).default('1.0.0'),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    throw new UnauthorizedError('Admin yetkisi gerekli');
  }
  return session;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await requireAdmin();

    const existing = await prisma.digitalProduct.findUnique({ where: { id: params.id } });
    if (!existing) throw new NotFoundError('Ürün bulunamadı');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Geçersiz JSON gövdesi',
        statusCode: 400,
      } as any);
    }

    const data = ProductUpdateSchema.parse(body);

    if (data.slug !== existing.slug) {
      const slugTaken = await prisma.digitalProduct.findUnique({ where: { slug: data.slug } });
      if (slugTaken) {
        return fail({
          code: 'CONFLICT',
          message: 'Bu slug zaten kullanımda',
          statusCode: 409,
        } as any);
      }
    }

    const product = await prisma.digitalProduct.update({
      where: { id: params.id },
      data: {
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        thumbnail: data.thumbnail || null,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        priceCents: data.priceCents,
        category: data.category,
        technologies: data.technologies,
        version: data.version,
        active: data.active,
        featured: data.featured,
      },
    });

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${product.slug}`);
    revalidatePath('/magaza');
    revalidatePath(`/urunler/${product.slug}`);

    await logAudit({
      userId: (session.user as { id?: string } | undefined)?.id,
      userEmail: session.user?.email ?? undefined,
      action: 'UPDATE',
      resource: 'DigitalProduct',
      resourceId: product.id,
      details: { slug: product.slug, title: product.title },
    });

    return ok({ product });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await requireAdmin();

    const product = await prisma.digitalProduct.findUnique({ where: { id: params.id } });
    if (!product) {
      throw new NotFoundError('Ürün bulunamadı');
    }

    await prisma.digitalProduct.delete({ where: { id: params.id } });

    revalidatePath('/');
    revalidatePath('/urunler');
    revalidatePath(`/urunler/${product.slug}`);
    revalidatePath('/admin/products');

    const ipHeader = req.headers.get('x-forwarded-for');
    const uaHeader = req.headers.get('user-agent');

    await logAudit({
      userId: (session.user as { id?: string } | undefined)?.id,
      userEmail: session.user?.email ?? undefined,
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
