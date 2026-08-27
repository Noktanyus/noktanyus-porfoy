import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    taskAssignee: {
      deleteMany: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    taskComment: {
      create: vi.fn(),
    },
  },
}));

describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports core functions', async () => {
    const { taskService } = await import('../taskService');
    expect(typeof taskService.listTasks).toBe('function');
    expect(typeof taskService.getTask).toBe('function');
    expect(typeof taskService.createTask).toBe('function');
    expect(typeof taskService.updateTask).toBe('function');
    expect(typeof taskService.assignTask).toBe('function');
    expect(typeof taskService.deleteTask).toBe('function');
    expect(typeof taskService.addComment).toBe('function');
    expect(typeof taskService.getStats).toBe('function');
  });

  it('exports valid status and priority enums', async () => {
    const mod = await import('../taskService');
    expect(mod.VALID_STATUSES).toEqual([
      'todo',
      'in_progress',
      'review',
      'done',
      'cancelled',
    ]);
    expect(mod.VALID_PRIORITIES).toEqual(['low', 'medium', 'high', 'urgent']);
  });

  it('validates status enum membership', () => {
    const valid = ['todo', 'in_progress', 'review', 'done', 'cancelled'];
    expect(valid).toContain('todo');
    expect(valid).toContain('in_progress');
    expect(valid).not.toContain('invalid');
    expect(valid).not.toContain('completed');
  });

  it('validates priority enum membership', () => {
    const valid = ['low', 'medium', 'high', 'urgent'];
    expect(valid).toContain('urgent');
    expect(valid).not.toContain('critical');
    expect(valid).not.toContain('');
  });

  it('listTasks rejects non-members with ForbiddenError', async () => {
    const { prisma } = await import('@/lib/prisma');
    const { taskService } = await import('../taskService');
    (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);

    await expect(
      taskService.listTasks('ws_1', 'user_1')
    ).rejects.toThrow(/erişim yetkiniz yok/i);
  });

  it('listTasks returns tasks for valid members', async () => {
    const { prisma } = await import('@/lib/prisma');
    const { taskService } = await import('../taskService');

    (prisma.workspaceMember.findUnique as any).mockResolvedValue({
      workspaceId: 'ws_1',
      userId: 'user_1',
    });
    (prisma.task.findMany as any).mockResolvedValue([
      { id: 't_1', title: 'Task 1', status: 'todo' },
    ]);

    const result = await taskService.listTasks('ws_1', 'user_1');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Task 1');
  });

  it('getStats aggregates by status and computes overdue', async () => {
    const { prisma } = await import('@/lib/prisma');
    const { taskService } = await import('../taskService');

    (prisma.workspaceMember.findUnique as any).mockResolvedValue({
      workspaceId: 'ws_1',
      userId: 'user_1',
    });
    (prisma.task.groupBy as any).mockResolvedValue([
      { status: 'todo', _count: { _all: 3 } },
      { status: 'done', _count: { _all: 2 } },
    ]);
    (prisma.task.count as any).mockResolvedValue(1);

    const stats = await taskService.getStats('ws_1', 'user_1');
    expect(stats.total).toBe(5);
    expect(stats.byStatus.todo).toBe(3);
    expect(stats.byStatus.done).toBe(2);
    expect(stats.overdue).toBe(1);
  });

  it('createTask defaults to status=todo and priority=medium', async () => {
    const { prisma } = await import('@/lib/prisma');
    const { taskService } = await import('../taskService');

    (prisma.workspaceMember.findUnique as any).mockResolvedValue({
      workspaceId: 'ws_1',
      userId: 'user_1',
    });
    (prisma.task.create as any).mockImplementation((args: any) =>
      Promise.resolve({ id: 't_new', ...args.data })
    );

    const result = await taskService.createTask('user_1', 'ws_1', {
      title: 'New Task',
    });
    expect(result.status).toBe('todo');
    expect(result.priority).toBe('medium');
  });
});