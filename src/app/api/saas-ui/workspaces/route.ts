/**
 * @file /api/saas-ui/workspaces - Session-based kullanıcı workspace listesi.
 * @description UI için: üye olunan workspace'lerin kısa listesi (id, name).
 *              API key gerektirmez, session yeterli.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id as string },
      orderBy: { joinedAt: 'desc' },
      select: {
        role: true,
        workspace: {
          select: { id: true, name: true, slug: true, createdAt: true },
        },
      },
    });

    return ok(
      memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        createdAt: m.workspace.createdAt,
      }))
    );
  });
}
