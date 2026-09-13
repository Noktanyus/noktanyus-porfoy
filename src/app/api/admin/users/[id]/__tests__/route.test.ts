import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSession = vi.hoisted(() => ({
  current: {
    user: { id: 'admin-db', email: 'admin@example.com', role: 'admin' },
  } as { user: { id: string; email: string; role: string } } | null,
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => mockSession.current),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(async () => undefined),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const setUserAppRole = vi.hoisted(() => vi.fn());

vi.mock('@/modules/admin/userRoleService', () => ({
  setUserAppRole,
}));

describe('PATCH /api/admin/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.current = {
      user: { id: 'admin-db', email: 'admin@example.com', role: 'admin' },
    };
    setUserAppRole.mockResolvedValue({
      id: 'u1',
      email: 'ali@example.com',
      name: 'Ali',
      role: 'admin',
      emailVerified: null,
      createdAt: new Date(),
    });
  });

  it('rolü günceller', async () => {
    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost/api/admin/users/u1', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'admin' }),
    });
    const res = await PATCH(req, { params: { id: 'u1' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(setUserAppRole).toHaveBeenCalledWith({
      actorId: 'admin-db',
      targetId: 'u1',
      role: 'admin',
    });
  });

  it('geçersiz gövdede 400 döner', async () => {
    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost/api/admin/users/u1', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'superadmin' }),
    });
    const res = await PATCH(req, { params: { id: 'u1' } });
    expect(res.status).toBe(400);
    expect(setUserAppRole).not.toHaveBeenCalled();
  });

  it('admin olmayan 403 döner', async () => {
    mockSession.current = {
      user: { id: 'u1', email: 'user@example.com', role: 'user' },
    };
    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost/api/admin/users/u1', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'admin' }),
    });
    const res = await PATCH(req, { params: { id: 'u1' } });
    expect(res.status).toBe(403);
  });
});
