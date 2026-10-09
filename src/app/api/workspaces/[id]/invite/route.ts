/**
 * POST /api/workspaces/[id]/invite — üye davet et
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { workspaceRepository } from '@/modules/admin/workspaceRepository';
import { workspaceService } from '@/modules/admin/workspaceService';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).default('VIEWER'),
});

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
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenError('Davet göndermek için OWNER veya ADMIN olmalısınız');
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });
    if (!workspace) throw new NotFoundError('Workspace bulunamadı');

    const json = await req.json().catch(() => null);
    const parsed = InviteSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError('Geçersiz davet verisi', parsed.error.flatten());
    }

    const invitation = await workspaceService.inviteMember({
      workspaceId: workspace.id,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      invitedBy: userId,
      workspaceName: workspace.name,
    });

    return ok({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        token: invitation.token,
      },
    });
  });
}
