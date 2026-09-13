import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenError, NotFoundError } from '@/modules/shared/errors';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { listAdminUsers, setUserAppRole } from '../userRoleService';

const mockUser = {
  id: 'u1',
  email: 'ali@example.com',
  name: 'Ali',
  role: 'user',
  emailVerified: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
};

describe('listAdminUsers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sayfalar ve arama filtresi uygular', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser] as never);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const result = await listAdminUsers({ q: 'ali', page: 2, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.users[0].role).toBe('user');
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it('geçersiz sayfa/limit değerlerini düzeltir', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const result = await listAdminUsers({ page: 0, limit: 999 });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
  });
});

describe('setUserAppRole', () => {
  beforeEach(() => vi.clearAllMocks());

  it('olmayan kullanıcıda NotFoundError fırlatır', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    await expect(
      setUserAppRole({ actorId: 'admin-1', targetId: 'missing', role: 'admin' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('aynı rolde güncelleme yapmaz', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, role: 'admin' } as never);
    const result = await setUserAppRole({
      actorId: 'other',
      targetId: 'u1',
      role: 'admin',
    });
    expect(result.role).toBe('admin');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('kendi yönetici yetkisini kaldırmayı reddeder', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, role: 'admin' } as never);
    await expect(
      setUserAppRole({ actorId: 'u1', targetId: 'u1', role: 'user' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('sentetik admin kendi id eşleşmesi olmadan yetki verebilir', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, role: 'admin' } as never);

    const result = await setUserAppRole({
      actorId: 'admin',
      targetId: 'u1',
      role: 'admin',
    });
    expect(result.role).toBe('admin');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { role: 'admin' },
      }),
    );
  });
});
