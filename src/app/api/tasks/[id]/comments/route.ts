/**
 * /api/tasks/[id]/comments
 *
 * POST → task'a yorum ekler (workspace üyeliği zorunlu)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { taskService } from '@/modules/workspaces/taskService';

const CommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
      return fail({ code: 'VALIDATION_ERROR', message: 'Geçersiz JSON', statusCode: 400 } as any);
    }
    const data = CommentSchema.parse(body);

    const comment = await taskService.addComment(params.id, userId, data.content);
    return ok({ comment }, { status: 201 });
  });
}