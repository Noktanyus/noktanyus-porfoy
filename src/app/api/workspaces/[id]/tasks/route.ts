/**
 * GET/POST /api/workspaces/[id]/tasks
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { workspaceRepository } from '@/modules/admin/workspaceRepository';
import { ok, created, withErrorHandling } from '@/lib/apiResponse';
import {
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string()).max(20).optional().default([]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const role = await workspaceRepository.isMember(params.id, userId);
    if (!role) throw new NotFoundError('Workspace bulunamadı');

    const tasks = await prisma.task.findMany({
      where: { workspaceId: params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { comments: true, subtasks: true } },
      },
    });

    return ok({ tasks });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const role = await workspaceRepository.isMember(params.id, userId);
    if (!role) throw new NotFoundError('Workspace bulunamadı');
    if (role === 'VIEWER') throw new ForbiddenError('Viewer görev oluşturamaz');

    const json = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError('Geçersiz görev', parsed.error.flatten());
    }

    const task = await prisma.task.create({
      data: {
        workspaceId: params.id,
        title: parsed.data.title.trim(),
        description: parsed.data.description,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        createdById: userId,
        assignees: parsed.data.assigneeIds.length
          ? {
              create: parsed.data.assigneeIds.map((uid) => ({ userId: uid })),
            }
          : undefined,
      },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { comments: true, subtasks: true } },
      },
    });

    return created({ task });
  });
}
