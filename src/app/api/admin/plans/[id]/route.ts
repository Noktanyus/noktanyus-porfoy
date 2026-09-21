/**
 * @file /api/admin/plans/[id] — GET, PATCH, DELETE
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/modules/shared/errors';
import { AdminPlanWriteSchema } from '@/modules/commerce/schemas';
import { planAdminService } from '@/modules/commerce/planAdminService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ToggleSchema = z.object({
  active: z.boolean(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
  if (session.user.role !== 'admin') {
    throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
  }
  return session.user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    await requireAdmin();
    const plan = await planAdminService.findById(params.id);
    if (!plan) throw new NotFoundError('Plan');
    return ok({
      plan,
      form: planAdminService.parseForForm(plan.features),
    });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await requireAdmin();
    const body = await req.json();

    if (body && Object.keys(body).length === 1 && typeof body.active === 'boolean') {
      const { active } = ToggleSchema.parse(body);
      const plan = await planAdminService.setActive(params.id, active);
      revalidatePath('/admin/plans');
      revalidatePath('/magaza/abonelikler');
      await logAudit({
        userId: user.id,
        userEmail: user.email ?? undefined,
        action: 'UPDATE',
        resource: 'Plan',
        resourceId: plan.id,
        details: { active },
      });
      return ok({ plan });
    }

    const data = AdminPlanWriteSchema.parse(body);
    const plan = await planAdminService.update(params.id, data);

    revalidatePath('/admin/plans');
    revalidatePath('/magaza/abonelikler');
    await logAudit({
      userId: user.id,
      userEmail: user.email ?? undefined,
      action: 'UPDATE',
      resource: 'Plan',
      resourceId: plan.id,
      details: { slug: plan.slug },
    });

    return ok({ plan });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await requireAdmin();
    const deleted = await planAdminService.remove(params.id);
    revalidatePath('/admin/plans');
    revalidatePath('/magaza/abonelikler');
    await logAudit({
      userId: user.id,
      userEmail: user.email ?? undefined,
      action: 'DELETE',
      resource: 'Plan',
      resourceId: deleted.id,
      details: { slug: deleted.slug },
    });
    return ok({ success: true, deletedId: deleted.id });
  });
}
