/**
 * @file /api/user/products — Kullanıcının kendi dijital ürünleri (SaaS marketplace)
 *
 * GET  → kullanıcının ürünlerini listele (ownerId = session.user.id)
 * POST → yeni dijital ürün oluştur (slug unique, ownerId bağlanır)
 *
 * Auth: zorunlu (NextAuth session)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';

const ProductSchema = z.object({
  title: z.string().min(3).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir')
    .min(1)
    .max(100),
  shortDescription: z.string().min(10).max(200),
  description: z.string().min(50),
  thumbnail: z.string().url().optional().nullable(),
  fileUrl: z.string().min(1).max(500),
  fileName: z.string().min(1).max(200),
  fileSize: z.number().int().min(0),
  priceCents: z.number().int().min(0).max(10000000), // max 100K TL
  category: z.string().min(1).max(50),
  technologies: z.array(z.string()).max(20).default([]),
  version: z.string().max(20).default('1.0.0'),
});

export async function GET(_req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;

    const products = await prisma.digitalProduct.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return ok(products);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;

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

    // Slug uniqueness check (Prisma P2002'yi de yakalıyoruz ama burada açık mesaj veriyoruz)
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
        ownerId: userId,
        active: true,
      },
    });

    logger.info('User product created', {
      userId,
      productId: product.id,
      slug: product.slug,
    });

    return ok({ product }, { status: 201 });
  });
}