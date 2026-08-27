/**
 * /api/products/[slug]/reviews
 *
 * GET  → Ürünün tüm onaylı review'larını + ortalama puanı döner.
 * POST → Kullanıcı review bırakır (auth zorunlu). Duplicate review engellenir.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { reviewService } from '@/modules/marketplace';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, NotFoundError } from '@/modules/shared/errors';

const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandling(async () => {
    const product = await prisma.digitalProduct.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!product) throw new NotFoundError('Ürün');

    const [reviews, summary] = await Promise.all([
      reviewService.listForProduct(product.id),
      reviewService.average(product.id),
    ]);

    return ok({ reviews, average: summary.average, count: summary.count });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Yorum yapmak için giriş yapmalısınız');
    }
    const userId = (session.user as { id: string }).id;

    const body = await req.json();
    const data = CreateReviewSchema.parse(body);

    const product = await prisma.digitalProduct.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!product) throw new NotFoundError('Ürün');

    const review = await reviewService.create(userId, product.id, {
      rating: data.rating,
      comment: data.comment,
    });

    return ok({ review }, { status: 201 });
  });
}