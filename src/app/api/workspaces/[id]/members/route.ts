/**
 * /api/workspaces/[id]/members
 *
 * GET  → workspace üyelerini listele (üye olma zorunlu)
 * POST → email ile üye davet et (invite yetkisi zorunlu)
 * DELETE → üye çıkar (remove yetkisi zorunlu, memberId body'de)
 *
 * Auth: NextAuth session zorunlu
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { requirePermission, requireWorkspaceMember } from '@/lib/rbac';
import { workspaceService } from '@/modules/admin/workspaceService';
import { NotFoundError } from '@/modules/shared/errors';

const InviteSchema = z.object({
  email: z.string().email('Geçerli bir email girin'),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).default('VIEWER'),
});

const RemoveSchema = z.object({
  memberId: z.string().min(1),
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

    await requireWorkspaceMember(params.id, userId);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: params.id },
      orderBy: { joinedAt: 'asc' },
    });

    return ok({ members });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;

    await requirePermission(params.id, userId, 'invite');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({ code: 'VALIDATION_ERROR', message: 'Geçersiz JSON gövdesi', statusCode: 400 } as any);
    }

    const data = InviteSchema.parse(body);

    const ws = await prisma.workspace.findUnique({ where: { id: params.id } });
    if (!ws) throw new NotFoundError('Workspace');

    const invitation = await workspaceService.inviteMember({
      workspaceId: params.id,
      email: data.email,
      role: data.role,
      invitedBy: userId,
      workspaceName: ws.name,
    });

    return ok({ invitation }, { status: 201 });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;

    await requirePermission(params.id, userId, 'remove');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({ code: 'VALIDATION_ERROR', message: 'Geçersiz JSON gövdesi', statusCode: 400 } as any);
    }
    const data = RemoveSchema.parse(body);

    // Üye bu workspace'e mi ait kontrolü
    const member = await prisma.workspaceMember.findUnique({
      where: { id: data.memberId },
    });
    if (!member || member.workspaceId !== params.id) {
      return fail({ code: 'NOT_FOUND', message: 'Üye bulunamadı', statusCode: 404 } as any);
    }

    await workspaceService.removeMember(data.memberId);

    return ok({ removed: true });
  });
}
