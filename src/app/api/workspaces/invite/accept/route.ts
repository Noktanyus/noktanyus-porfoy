/**
 * POST /api/workspaces/invite/accept — davet token ile üyelik
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { workspaceService } from '@/modules/admin/workspaceService';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ValidationError, NotFoundError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  token: z.string().min(10).max(120),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;
    const email = (session.user.email ?? '').toLowerCase();

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError('Geçersiz token', parsed.error.flatten());
    }

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token: parsed.data.token },
    });
    if (!invitation) throw new NotFoundError('Davet bulunamadı');
    if (invitation.email.toLowerCase() !== email) {
      throw new ValidationError('Bu davet farklı bir e-posta adresine gönderilmiş');
    }

    try {
      const accepted = await workspaceService.acceptInvitation(parsed.data.token, userId);
      return ok({
        invitation: {
          id: accepted.id,
          workspaceId: accepted.workspaceId,
          status: accepted.status,
        },
      });
    } catch (err) {
      throw new ValidationError(err instanceof Error ? err.message : 'Davet kabul edilemedi');
    }
  });
}
