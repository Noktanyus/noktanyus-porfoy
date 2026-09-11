/**
 * POST /api/admin/products — Admin dijital ürün oluşturma
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError } from '@/modules/shared/errors';

const ProductSchema = z.object({
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
  category: z.string().min(1).max(50).default('general'),
  technologies: z.array(z.string()).max(20).default([]),
  version: z.string().max(20).default('1.0.0'),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      throw new UnauthorizedError('Admin yetkisi gerekli');
    }

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

    const data = ProductSchema.parse(body);
    const existing = await prisma.digitalProduct.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return fail({
        code: 'CONFLICT',
        message: 'Bu slug zaten kullanımda',
        statusCode: 409,
      } as any);
    }

    const product = await prisma.digitalProduct.create({
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
        currency: 'try',
        category: data.category,
        technologies: data.technologies,
        version: data.version,
        active: data.active,
        featured: data.featured,
        ownerId: (session.user as { id: string }).id,
      },
    });

    revalidatePath('/admin/products');
    revalidatePath('/magaza');
    revalidatePath('/urunler');

    await logAudit({
      userId: (session.user as { id?: string }).id,
      userEmail: session.user.email ?? undefined,
      action: 'CREATE',
      resource: 'DigitalProduct',
      resourceId: product.id,
      details: { slug: product.slug, title: product.title },
    });

    return ok({ product }, { status: 201 });
  });
}
