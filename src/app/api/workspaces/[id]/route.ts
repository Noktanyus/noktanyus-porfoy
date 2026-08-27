/**
 * /api/workspaces/[id]
 *
 * GET    → workspace detayı (üye olma zorunlu)
 * PATCH  → workspace güncelle (admin yetkisi zorunlu)
 * DELETE → workspace sil (OWNER zorunlu)
 *
 * RBAC: src/lib/rbac.ts üzerinden kontrol edilir.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { requirePermission, requireWorkspaceMember } from '@/lib/rbac';
import { NotFoundError } from '@/modules/shared/errors';

const UpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;

    const role = await requireWorkspaceMember(params.id, userId);

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      include: {
        members: true,
        _count: { select: { members: true, invitations: true } },
      },
    });

    if (!workspace) throw new NotFoundError('Workspace');

    return ok({ workspace, role });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;

    await requirePermission(params.id, userId, 'write');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({ code: 'VALIDATION_ERROR', message: 'Geçersiz JSON gövdesi', statusCode: 400 } as any);
    }
    const data = UpdateSchema.parse(body);

    const updated = await prisma.workspace.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });

    return ok({ workspace: updated });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;

    await requirePermission(params.id, userId, 'delete');

    await prisma.workspace.delete({ where: { id: params.id } });

    return ok({ deleted: true });
  });
}
