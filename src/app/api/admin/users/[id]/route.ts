/**
 * @file PATCH /api/admin/users/[id] — hesap rolü güncelle (admin).
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/modules/shared/errors';
import { setUserAppRole } from '@/modules/admin/userRoleService';
import { isSyntheticAdminId } from '@/lib/appRole';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  role: z.enum(['admin', 'user']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    if (session.user.role !== 'admin') {
      throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      throw new ValidationError('Geçersiz rol', parsed.error.flatten());
    }

    const actorId = session.user.id;
    const updated = await setUserAppRole({
      actorId,
      targetId: params.id,
      role: parsed.data.role,
    });

    revalidatePath('/admin/users');

    await logAudit({
      userId: isSyntheticAdminId(actorId) ? undefined : actorId,
      userEmail: session.user.email ?? undefined,
      action: 'UPDATE',
      resource: 'User',
      resourceId: updated.id,
      details: { field: 'role', to: updated.role, email: updated.email },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    return ok({ user: updated });
  });
}
