/**
 * /api/user/reports/[id]
 *   DELETE — Raporu sil (sadece sahibi).
 *
 * Phase: G3 Custom Report Builder
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { reportService } from '@/modules/reports';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const result = await reportService.delete(params.id, userId);
    return ok(result);
  });
}