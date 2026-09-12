/**
 * @file /api/admin/templates/[id] - GET + PATCH + DELETE
 * @description Admin template listing tekil endpoint'i.
 *              GET → detay
 *              PATCH → kismi guncelleme (UpdateTemplateListingSchema)
 *              DELETE → soft-delete (active=false)
 *
 * Pattern: src/lib/auth.ts, src/lib/audit.ts, src/lib/apiResponse.ts,
 *          src/modules/marketplace/templateService.ts.
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/modules/shared/errors';
import { prisma } from '@/lib/prisma';
import { UpdateTemplateListingSchema } from '@/modules/marketplace/templateSchemas';
import {
  deleteTemplateListing,
  getTemplateById,
  updateTemplateListing,
} from '@/modules/marketplace/templateService';

export const dynamic = 'force-dynamic';

// =================== GET ===================

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    if (session.user.role !== 'admin') {
      throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
    }

    const template = await getTemplateById(params.id);
    return ok({ template });
  });
}

// =================== PATCH ===================

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    if (session.user.role !== 'admin') {
      throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
    }

    const body = await req.json();
    const data = UpdateTemplateListingSchema.parse(body);

    const adminUser = {
      id: session.user.id,
      role: 'admin' as const,
      email: session.user.email ?? undefined,
    };

    const updated = await updateTemplateListing(adminUser, params.id, data);

    revalidatePath('/marketplace');
    revalidatePath(`/marketplace/${updated.slug}`);
    revalidatePath('/admin/templates');

    await logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: 'UPDATE',
      resource: 'TemplateListing',
      resourceId: updated.id,
      details: { slug: updated.slug, fields: Object.keys(data) },
    });

    return ok({ template: updated });
  });
}

// =================== DELETE ===================

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    if (session.user.role !== 'admin') {
      throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
    }

    // Once template'in slug'unu cek — cache invalidation icin lazim
    const existing = await prisma.templateListing.findUnique({
      where: { id: params.id },
      select: { slug: true },
    });
    if (!existing) throw new NotFoundError('Template listing');

    const adminUser = {
      id: session.user.id,
      role: 'admin' as const,
      email: session.user.email ?? undefined,
    };

    const result = await deleteTemplateListing(adminUser, params.id);

    revalidatePath('/marketplace');
    revalidatePath(`/marketplace/${existing.slug}`);
    revalidatePath('/admin/templates');

    return ok({ success: true, deletedId: result.id });
  });
}
