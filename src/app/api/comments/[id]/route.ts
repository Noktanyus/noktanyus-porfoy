/**
 * Single Comment API
 *
 * PATCH  /api/comments/[id]  — Yorum düzenle (sadece sahibi)
 * DELETE /api/comments/[id]  — Yorum sil (sahibi veya admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { commentService } from '@/modules/comments';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

const UpdateBodySchema = z.object({
  content: z
    .string()
    .min(3, 'Yorum en az 3 karakter olmalı')
    .max(2000, 'Yorum en fazla 2000 karakter olabilir'),
});

/**
 * PATCH — Yorum düzenle. Sadece sahibi.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({
        code: 'UNAUTHORIZED',
        message: 'Giriş gerekli',
        statusCode: 401,
      } as any) as NextResponse;
    }
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return fail({
        code: 'UNAUTHORIZED',
        message: 'Geçersiz oturum',
        statusCode: 401,
      } as any) as NextResponse;
    }

    const body = await req.json();
    const { content } = UpdateBodySchema.parse(body);

    const comment = await commentService.updateComment(userId, params.id, content);
    return ok({ comment });
  });
}

/**
 * DELETE — Yorum sil. Sahibi veya admin.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({
        code: 'UNAUTHORIZED',
        message: 'Giriş gerekli',
        statusCode: 401,
      } as any) as NextResponse;
    }
    const userId = (session.user as { id?: string }).id;
    const isAdmin = (session.user as { role?: string }).role === 'admin';
    if (!userId) {
      return fail({
        code: 'UNAUTHORIZED',
        message: 'Geçersiz oturum',
        statusCode: 401,
      } as any) as NextResponse;
    }

    await commentService.deleteComment(userId, isAdmin, params.id);
    return ok({ success: true });
  });
}
