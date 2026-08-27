/**
 * /api/tasks/[id]
 *
 * GET    → task detayı (workspace üyeliği zorunlu)
 * PATCH  → task güncelle (title, status, priority, dueDate vb.)
 * DELETE → task sil
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { taskService } from '@/modules/workspaces/taskService';

const PatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  estimatedHours: z.number().optional(),
  spentHours: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;

    const task = await taskService.getTask(params.id, userId);
    return ok({ task });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    const data = PatchSchema.parse(body);

    const task = await taskService.updateTask(params.id, userId, data);
    return ok({ task });
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;

    await taskService.deleteTask(params.id, userId);
    return ok({ deleted: true });
  });
}