/**
 * PATCH/DELETE /api/tasks/[id]
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { workspaceRepository } from '@/modules/admin/workspaceRepository';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import {
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().nullable().optional(),
});

async function requireTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, workspaceId: true },
  });
  if (!task) throw new NotFoundError('Görev bulunamadı');
  const role = await workspaceRepository.isMember(task.workspaceId, userId);
  if (!role) throw new NotFoundError('Görev bulunamadı');
  return { task, role };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;
    const { role } = await requireTaskAccess(params.id, userId);
    if (role === 'VIEWER') throw new ForbiddenError('Viewer güncelleyemez');

    const json = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError('Geçersiz güncelleme', parsed.error.flatten());
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.dueDate !== undefined) {
      data.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    }
    if (parsed.data.status === 'done') {
      data.completedAt = new Date();
    }
    if (parsed.data.status === 'in_progress') {
      data.startedAt = new Date();
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: {
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    });

    return ok({ task });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;
    const { role } = await requireTaskAccess(params.id, userId);
    if (role === 'VIEWER') throw new ForbiddenError('Viewer silemez');

    await prisma.task.delete({ where: { id: params.id } });
    return ok({ success: true });
  });
}
