import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, NotFoundError, ForbiddenError } from '@/modules/shared/errors';
import { runSingleMonitorCheck } from '@/modules/monitors/runner';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const monitor = await prisma.monitor.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true },
    });

    if (!monitor) throw new NotFoundError('Monitör');
    if (monitor.userId !== userId && (session.user as { role?: string }).role !== 'admin') {
      throw new ForbiddenError('Bu monitörü kontrol etme yetkiniz yok');
    }

    const checkResult = await runSingleMonitorCheck(monitor.id);
    return ok({ success: true, result: checkResult });
  });
}
