/**
 * Blog Comments API
 *
 * GET  /api/blogs/[slug]/comments  — Blog yazısının yorumlarını listele (public)
 * POST /api/blogs/[slug]/comments  — Yeni yorum ekle (auth gerekli)
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { commentService } from '@/modules/comments';
import { CreateCommentSchema } from '@/modules/comments/schemas';
import { ok, created, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';

/**
 * GET — Public. Blog yorumlarını listeler.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const blog = await prisma.blog.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!blog) {
      return fail({
        code: 'NOT_FOUND',
        message: 'Blog bulunamadı',
        statusCode: 404,
      });
    }

    const [comments, count] = await Promise.all([
      commentService.getComments(blog.id),
      commentService.getCommentCount(blog.id),
    ]);

    return ok({ comments, count });
  });
}

/**
 * POST — Auth gerekli. Yeni yorum ekler.
 */
async function postHandler(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({
        code: 'UNAUTHORIZED',
        message: 'Giriş gerekli',
        statusCode: 401,
      });
    }
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return fail({
        code: 'UNAUTHORIZED',
        message: 'Geçersiz oturum',
        statusCode: 401,
      });
    }

    const blog = await prisma.blog.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!blog) {
      return fail({
        code: 'NOT_FOUND',
        message: 'Blog bulunamadı',
        statusCode: 404,
      });
    }

    const body = await req.json();
    const data = CreateCommentSchema.parse({ ...body, blogId: blog.id });

    const comment = await commentService.addComment(userId, data);
    return created({ comment });
  });
}

export const POST = withRateLimit(RateLimits.api, postHandler as any);
