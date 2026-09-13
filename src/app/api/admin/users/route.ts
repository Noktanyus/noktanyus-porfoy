/**
 * @file GET /api/admin/users — hesap listesi (admin).
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ForbiddenError } from '@/modules/shared/errors';
import { listAdminUsers } from '@/modules/admin/userRoleService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    if (session.user.role !== 'admin') {
      throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
    }

    const { searchParams } = req.nextUrl;
    const q = searchParams.get('q') ?? undefined;
    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '25');

    const result = await listAdminUsers({
      q,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 25,
    });

    return ok(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  });
}
