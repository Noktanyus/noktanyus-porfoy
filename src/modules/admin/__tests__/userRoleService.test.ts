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
    apiCreditLedger: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { listAdminUsers, setUserAppRole, updateUserApiLimit } from '../userRoleService';

const mockUser = {
  id: 'u1',
  email: 'ali@example.com',
  name: 'Ali',
  role: 'user',
  emailVerified: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
  apiCreditBalance: 500,
  customApiMonthlyLimit: 20000,
  customApiLimitExpiresAt: new Date('2026-12-31'),
  customApiLimitNotes: 'Özel müşteri',
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

describe('updateUserApiLimit', () => {
  beforeEach(() => vi.clearAllMocks());

  it('olmayan kullanıcıda NotFoundError fırlatır', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    await expect(
      updateUserApiLimit({ targetId: 'missing', action: 'add', additionalLimit: 5000 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('action=add ile mevcut limitin üstüne ekler', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser,
      customApiMonthlyLimit: 30000,
    } as never);

    const res = await updateUserApiLimit({
      targetId: 'u1',
      action: 'add',
      additionalLimit: 10000,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          customApiMonthlyLimit: 30000, // 20000 + 10000
        }),
      }),
    );
    expect(res.customApiMonthlyLimit).toBe(30000);
  });

  it('action=revoke ile özel kotayı ve süresini sıfırlar', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser,
      customApiMonthlyLimit: null,
      customApiLimitExpiresAt: null,
    } as never);

    const res = await updateUserApiLimit({
      targetId: 'u1',
      action: 'revoke',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          customApiMonthlyLimit: null,
          customApiLimitExpiresAt: null,
        }),
      }),
    );
    expect(res.customApiMonthlyLimit).toBeNull();
  });

  it('action=expire ile süreyi geçmiş zamana çeker', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser,
      customApiLimitExpiresAt: new Date(Date.now() - 1000),
    } as never);

    await updateUserApiLimit({
      targetId: 'u1',
      action: 'expire',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          customApiLimitExpiresAt: expect.any(Date),
        }),
      }),
    );
  });

  it('action=set ile kotayı ve süreyi doğrudan ayarlar', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    const newDate = new Date('2027-01-01');
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser,
      customApiMonthlyLimit: 75000,
      customApiLimitExpiresAt: newDate,
    } as never);

    await updateUserApiLimit({
      targetId: 'u1',
      action: 'set',
      customApiMonthlyLimit: 75000,
      customApiLimitExpiresAt: newDate,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          customApiMonthlyLimit: 75000,
          customApiLimitExpiresAt: newDate,
        }),
      }),
    );
  });

  it('addCredits ile kredi ekler ve ledger oluşturur', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...mockUser,
      apiCreditBalance: 1500,
    } as never);
    vi.mocked(prisma.apiCreditLedger.create).mockResolvedValue({ id: 'l1' } as never);

    await updateUserApiLimit({
      targetId: 'u1',
      addCredits: 1000,
      customApiLimitNotes: 'Bonus',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          apiCreditBalance: { increment: 1000 },
        }),
      }),
    );
    expect(prisma.apiCreditLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u1',
          delta: 1000,
          reason: 'admin',
        }),
      }),
    );
  });
});
