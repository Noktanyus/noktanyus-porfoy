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
import { setUserAppRole, updateUserApiLimit } from '@/modules/admin/userRoleService';
import { isSyntheticAdminId } from '@/lib/appRole';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  role: z.enum(['admin', 'user']).optional(),
  action: z.enum(['set', 'add', 'revoke', 'expire', 'extend']).optional(),
  customApiMonthlyLimit: z.number().int().min(0).nullable().optional(),
  additionalLimit: z.number().int().min(1).optional(),
  customApiLimitExpiresAt: z.string().nullable().optional(),
  customApiLimitNotes: z.string().max(500).optional(),
  apiCreditBalance: z.number().int().min(0).optional(),
  addCredits: z.number().int().optional(),
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

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Geçersiz parametreler', parsed.error.flatten());
    }

    const actorId = session.user.id;
    let updated: any = null;

    if (parsed.data.role) {
      updated = await setUserAppRole({
        actorId,
        targetId: params.id,
        role: parsed.data.role,
      });
    }

    const hasLimitUpdates =
      parsed.data.action !== undefined ||
      parsed.data.customApiMonthlyLimit !== undefined ||
      parsed.data.additionalLimit !== undefined ||
      parsed.data.customApiLimitExpiresAt !== undefined ||
      parsed.data.customApiLimitNotes !== undefined ||
      parsed.data.apiCreditBalance !== undefined ||
      parsed.data.addCredits !== undefined;

    if (hasLimitUpdates) {
      updated = await updateUserApiLimit({
        targetId: params.id,
        action: parsed.data.action,
        customApiMonthlyLimit: parsed.data.customApiMonthlyLimit,
        additionalLimit: parsed.data.additionalLimit,
        customApiLimitExpiresAt: parsed.data.customApiLimitExpiresAt
          ? new Date(parsed.data.customApiLimitExpiresAt)
          : parsed.data.customApiLimitExpiresAt === null
          ? null
          : undefined,
        customApiLimitNotes: parsed.data.customApiLimitNotes,
        apiCreditBalance: parsed.data.apiCreditBalance,
        addCredits: parsed.data.addCredits,
      });
    }

    if (!updated) {
      throw new ValidationError('Güncellenecek en az bir alan belirtilmelidir.');
    }

    revalidatePath('/admin/users');

    await logAudit({
      userId: isSyntheticAdminId(actorId) ? undefined : actorId,
      userEmail: session.user.email ?? undefined,
      action: 'UPDATE',
      resource: 'User',
      resourceId: updated.id,
      details: {
        role: updated.role,
        customApiMonthlyLimit: updated.customApiMonthlyLimit,
        customApiLimitExpiresAt: updated.customApiLimitExpiresAt,
        apiCreditBalance: updated.apiCreditBalance,
        action: parsed.data.action,
        email: updated.email,
      },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    return ok({ user: updated });
  });
}
