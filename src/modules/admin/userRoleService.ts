/**
 * Hesap bazlı admin yetkisi: listeleme ve rol atama.
 */

import { prisma } from '@/lib/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '@/modules/shared/errors';
import {
  isSyntheticAdminId,
  normalizeAppRole,
  type AppRole,
} from '@/lib/appRole';

const USER_LIST_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  emailVerified: true,
  createdAt: true,
} as const;

export type AdminUserListItem = {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  emailVerified: Date | null;
  createdAt: Date;
};

export interface ListAdminUsersInput {
  q?: string;
  page?: number;
  limit?: number;
}

export interface ListAdminUsersResult {
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
}

function parsePage(page?: number): number {
  if (!page || !Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function parseLimit(limit?: number): number {
  if (!limit || !Number.isFinite(limit) || limit < 1) return 25;
  return Math.min(100, Math.floor(limit));
}

export async function listAdminUsers(
  input: ListAdminUsersInput = {},
): Promise<ListAdminUsersResult> {
  const page = parsePage(input.page);
  const limit = parseLimit(input.limit);
  const q = input.q?.trim() ?? '';

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { name: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_LIST_SELECT,
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: rows.map((row) => ({
      ...row,
      role: normalizeAppRole(row.role),
    })),
    total,
    page,
    limit,
  };
}

export async function setUserAppRole(opts: {
  actorId: string;
  targetId: string;
  role: AppRole;
}): Promise<AdminUserListItem> {
  if (opts.role !== 'admin' && opts.role !== 'user') {
    throw new ValidationError('Geçersiz rol');
  }
  const nextRole = normalizeAppRole(opts.role);

  const target = await prisma.user.findUnique({
    where: { id: opts.targetId },
    select: USER_LIST_SELECT,
  });
  if (!target) {
    throw new NotFoundError('Kullanıcı');
  }

  const currentRole = normalizeAppRole(target.role);
  if (currentRole === nextRole) {
    return { ...target, role: currentRole };
  }

  if (
    !isSyntheticAdminId(opts.actorId) &&
    opts.actorId === opts.targetId &&
    nextRole === 'user'
  ) {
    throw new ForbiddenError('Kendi yönetici yetkinizi kaldıramazsınız');
  }

  const updated = await prisma.user.update({
    where: { id: opts.targetId },
    data: { role: nextRole },
    select: USER_LIST_SELECT,
  });

  return { ...updated, role: normalizeAppRole(updated.role) };
}
