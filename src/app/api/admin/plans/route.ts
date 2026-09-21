/**
 * @file /api/admin/plans — GET list, POST create
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, created, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, ForbiddenError } from '@/modules/shared/errors';
import { AdminPlanWriteSchema } from '@/modules/commerce/schemas';
import { planAdminService } from '@/modules/commerce/planAdminService';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
  if (session.user.role !== 'admin') {
    throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
  }
  return session.user;
}

export async function GET() {
  return withErrorHandling(async () => {
    await requireAdmin();
    const plans = await planAdminService.list();
    return ok({ plans });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAdmin();
    const body = await req.json();
    const data = AdminPlanWriteSchema.parse(body);
    const plan = await planAdminService.create(data);

    revalidatePath('/admin/plans');
    revalidatePath('/magaza/abonelikler');

    await logAudit({
      userId: user.id,
      userEmail: user.email ?? undefined,
      action: 'CREATE',
      resource: 'Plan',
      resourceId: plan.id,
      details: { slug: plan.slug, name: plan.name },
    });

    return created({ plan });
  });
}
