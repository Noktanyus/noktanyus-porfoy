/**
 * /api/products/[slug]/questions
 *
 * GET  → Ürünün tüm sorularını listeler.
 * POST → Kullanıcı soru sorar (auth zorunlu).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { questionService } from '@/modules/marketplace';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, NotFoundError } from '@/modules/shared/errors';

const AskQuestionSchema = z.object({
  question: z.string().min(5).max(1000),
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

    const questions = await questionService.listForProduct(product.id);
    return ok({ questions });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Soru sormak için giriş yapmalısınız');
    }
    const userId = (session.user as { id: string }).id;

    const body = await req.json();
    const data = AskQuestionSchema.parse(body);

    const product = await prisma.digitalProduct.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!product) throw new NotFoundError('Ürün');

    const question = await questionService.ask(userId, product.id, data.question);
    return ok({ question }, { status: 201 });
  });
}