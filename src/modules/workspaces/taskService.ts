/**
 * @file Task Service — Workspace Team + Task Management business logic.
 * @description
 *   Workspace üyelerinin task oluşturma, atama, güncelleme ve takip etme
 *   operasyonlarını yönetir. RBAC: workspace üyesi olma zorunluluğu.
 *
 *   - Status / priority enum validation
 *   - Membership check (her işlemde)
 *   - Assignee yönetimi (replace-all)
 *   - Stats (groupBy + overdue count)
 */

import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '@/modules/shared/errors';

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done', 'cancelled'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export type TaskStatus = (typeof VALID_STATUSES)[number];
export type TaskPriority = (typeof VALID_PRIORITIES)[number];

async function assertMembership(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { workspace: { select: { ownerId: true } } },
  });
  if (!member) {
    // Owner da member tablosunda olur; eşleşmediyse yetkisiz
    throw new ForbiddenError('Bu workspace\'e erişim yetkiniz yok');
  }
  return member;
}

export const taskService = {
  async listTasks(
    workspaceId: string,
    userId: string,
    opts: { status?: string; assigneeId?: string; limit?: number } = {}
  ) {
    await assertMembership(workspaceId, userId);

    return prisma.task.findMany({
      where: {
        workspaceId,
        ...(opts.status && VALID_STATUSES.includes(opts.status as TaskStatus)
          ? { status: opts.status }
          : {}),
        ...(opts.assigneeId
          ? { assignees: { some: { userId: opts.assigneeId } } }
          : {}),
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
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }],
      take: opts.limit ?? 100,
    });
  },

  async getTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        workspace: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        subtasks: {
          include: {
            assignees: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
        attachments: {
          include: { uploader: { select: { id: true, name: true } } },
        },
      },
    });
    if (!task) throw new NotFoundError('Görev');

    // Auth check
    const isOwner = task.workspace.ownerId === userId;
    if (!isOwner) {
      await assertMembership(task.workspaceId, userId);
    }

    return task;
  },

  async createTask(
    userId: string,
    workspaceId: string,
    input: {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      assigneeIds?: string[];
      dueDate?: Date;
      estimatedHours?: number;
      parentTaskId?: string;
      tags?: string[];
    }
  ) {
    await assertMembership(workspaceId, userId);

    const status = input.status && VALID_STATUSES.includes(input.status as TaskStatus)
      ? input.status
      : 'todo';
    const priority =
      input.priority && VALID_PRIORITIES.includes(input.priority as TaskPriority)
        ? input.priority
        : 'medium';

    const task = await prisma.task.create({
      data: {
        workspaceId,
        title: input.title,
        description: input.description,
        status,
        priority,
        dueDate: input.dueDate,
        estimatedHours: input.estimatedHours,
        parentTaskId: input.parentTaskId,
        tags: input.tags ?? [],
        createdById: userId,
        assignees: input.assigneeIds?.length
          ? {
              create: input.assigneeIds.map((uid) => ({ userId: uid })),
            }
          : undefined,
      },
      include: {
        assignees: { include: { user: true } },
      },
    });

    return task;
  },

  async updateTask(taskId: string, userId: string, input: Record<string, unknown>) {
    // Auth + mevcut kayıt kontrolü
    await this.getTask(taskId, userId);

    const allowedFields = [
      'title',
      'description',
      'status',
      'priority',
      'dueDate',
      'estimatedHours',
      'spentHours',
      'completedAt',
      'tags',
    ] as const;

    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (input[key] !== undefined) {
        if (key === 'status' && !VALID_STATUSES.includes(input[key] as TaskStatus)) {
          throw new ValidationError('Geçersiz status');
        }
        if (key === 'priority' && !VALID_PRIORITIES.includes(input[key] as TaskPriority)) {
          throw new ValidationError('Geçersiz priority');
        }
        data[key] = input[key];
      }
    }

    return prisma.task.update({
      where: { id: taskId },
      data,
    });
  },

  async assignTask(taskId: string, userId: string, assigneeIds: string[]) {
    // Auth + mevcut kayıt
    await this.getTask(taskId, userId);

    await prisma.taskAssignee.deleteMany({ where: { taskId } });

    return prisma.task.update({
      where: { id: taskId },
      data: {
        assignees: {
          create: assigneeIds.map((uid) => ({ userId: uid })),
        },
      },
      include: { assignees: { include: { user: true } } },
    });
  },

  async deleteTask(taskId: string, userId: string) {
    // Auth check (NotFound fırlatır yetkisizse)
    await this.getTask(taskId, userId);
    await prisma.task.delete({ where: { id: taskId } });
  },

  async addComment(taskId: string, authorId: string, content: string) {
    await this.getTask(taskId, authorId);

    return prisma.taskComment.create({
      data: { taskId, authorId, content },
      include: { author: { select: { id: true, name: true, image: true } } },
    });
  },

  async getStats(workspaceId: string, userId: string) {
    await assertMembership(workspaceId, userId);

    const grouped = await prisma.task.groupBy({
      by: ['status'],
      where: { workspaceId },
      _count: { _all: true },
    });

    const overdue = await prisma.task.count({
      where: {
        workspaceId,
        status: { notIn: ['done', 'cancelled'] },
        dueDate: { lt: new Date() },
      },
    });

    const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

    const byStatus = grouped.reduce<Record<string, number>>((acc, g) => {
      acc[g.status] = g._count._all;
      return acc;
    }, {});

    return { total, byStatus, overdue };
  },
};

export { VALID_STATUSES, VALID_PRIORITIES };