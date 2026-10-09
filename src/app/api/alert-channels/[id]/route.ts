/**
 * DELETE /api/alert-channels/[id]
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, NotFoundError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const existing = await prisma.alertChannel.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) throw new NotFoundError('Alert kanalı bulunamadı');

    await prisma.alertChannel.delete({ where: { id: params.id } });
    return ok({ success: true });
  });
}
