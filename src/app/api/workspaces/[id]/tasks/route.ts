/**
 * /api/workspaces/[id]/tasks
 *
 * GET  → workspace task listesini döner (status / assigneeId filtresi opsiyonel)
 * POST → yeni task oluşturur (auth + workspace üyeliği zorunlu)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { taskService } from '@/modules/workspaces/taskService';
import { requireWorkspaceMember } from '@/lib/rbac';

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.number().optional(),
  parentTaskId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;

    await requireWorkspaceMember(params.id, userId);

    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    const assigneeId = url.searchParams.get('assigneeId') ?? undefined;

    const tasks = await taskService.listTasks(params.id, userId, {
      status,
      assigneeId,
    });
    return ok({ tasks });
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;

    await requireWorkspaceMember(params.id, userId);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({ code: 'VALIDATION_ERROR', message: 'Geçersiz JSON', statusCode: 400 } as any);
    }

    const data = CreateSchema.parse(body);

    const task = await taskService.createTask(userId, params.id, data);
    return ok({ task }, { status: 201 });
  });
}