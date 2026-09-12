/**
 * @file /api/admin/templates - GET (paginated list) + POST (create)
 * @description Admin template listing yönetim endpoint'leri.
 *              Auth: session.user.role === 'admin' zorunlu.
 *              GET  → tüm template'ler (active+inactive), pagination destekli
 *              POST → yeni template listing olustur (authorId = session.user.id)
 *
 * Pattern: src/lib/auth.ts (admin check), src/lib/audit.ts (logAudit),
 *          src/lib/apiResponse.ts (created/ok/withErrorHandling),
 *          src/modules/marketplace/templateService.ts (business logic).
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { created, ok, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/modules/shared/errors';
import { prisma } from '@/lib/prisma';
import {
  CreateTemplateListingSchema,
  ListTemplatesQuerySchema,
} from '@/modules/marketplace/templateSchemas';
import {
  createTemplateListing,
  listAllTemplates,
} from '@/modules/marketplace/templateService';

export const dynamic = 'force-dynamic';

// =================== GET ===================

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    if (session.user.role !== 'admin') {
      throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
    }

    // Query parse — searchParams kullanici dostu pagination icin
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 50);

    const parsed = ListTemplatesQuerySchema.safeParse({
      page: Number.isFinite(page) && page >= 1 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize >= 1 && pageSize <= 100 ? pageSize : 50,
      sort: 'newest',
    });
    if (!parsed.success) {
      throw new ValidationError('Gecersiz pagination parametreleri');
    }

    const adminUser = {
      id: session.user.id,
      role: 'admin' as const,
      email: session.user.email ?? undefined,
    };

    // Admin tum listeyi (active + inactive) alir; mevcut sayfalama genis tutulur
    const items = await listAllTemplates(adminUser, parsed.data.pageSize * parsed.data.page);

    // Manuel skip — service take=u degil pagination ayarlamaz
    const skip = (parsed.data.page - 1) * parsed.data.pageSize;
    const sliced = items.slice(skip, skip + parsed.data.pageSize);

    const total = await prisma.templateListing.count();

    return ok({
      items: sliced,
      meta: {
        total,
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
        pageCount: Math.max(1, Math.ceil(total / parsed.data.pageSize)),
      },
    });
  });
}

// =================== POST ===================

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    if (session.user.role !== 'admin') {
      throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
    }

    const body = await req.json();
    const data = CreateTemplateListingSchema.parse(body);

    const author = {
      id: session.user.id,
      role: 'admin' as const,
      email: session.user.email ?? undefined,
    };

    const listing = await createTemplateListing(author, data);

    // Cache invalidation — public vitrin + admin listesi
    revalidatePath('/marketplace');
    revalidatePath(`/marketplace/${listing.slug}`);
    revalidatePath('/admin/templates');

    return created({ template: listing });
  });
}
