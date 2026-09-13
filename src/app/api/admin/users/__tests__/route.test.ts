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

const listAdminUsers = vi.hoisted(() => vi.fn());
const setUserAppRole = vi.hoisted(() => vi.fn());

vi.mock('@/modules/admin/userRoleService', () => ({
  listAdminUsers,
  setUserAppRole,
}));

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.current = {
      user: { id: 'admin-db', email: 'admin@example.com', role: 'admin' },
    };
    listAdminUsers.mockResolvedValue({
      users: [],
      total: 0,
      page: 1,
      limit: 25,
    });
  });

  it('admin listesini döner', async () => {
    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/admin/users?q=ali');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(listAdminUsers).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'ali' }),
    );
  });

  it('oturumsuz 401 döner', async () => {
    mockSession.current = null;
    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/admin/users');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('admin olmayan 403 döner', async () => {
    mockSession.current = {
      user: { id: 'u1', email: 'user@example.com', role: 'user' },
    };
    const { GET } = await import('../route');
    const req = new NextRequest('http://localhost/api/admin/users');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
