/**
 * /api/workspaces
 *
 * GET  → kullanıcının üyesi olduğu workspace'leri listeler
 * POST → yeni workspace oluşturur (otomatik OWNER olur)
 *
 * Auth: zorunlu (NextAuth session)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { workspaceService } from '@/modules/admin/workspaceService';

const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'İsim en az 2 karakter').max(100, 'İsim en fazla 100 karakter'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir')
    .min(2)
    .max(60),
  description: z.string().max(500).optional(),
});

export async function GET(_req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const workspaces = await workspaceService.listForUser(userId);
    return ok({ workspaces });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({ code: 'VALIDATION_ERROR', message: 'Geçersiz JSON gövdesi', statusCode: 400 } as any);
    }

    const data = CreateWorkspaceSchema.parse(body);

    const workspace = await workspaceService.createWorkspace({
      name: data.name,
      slug: data.slug,
      description: data.description,
      ownerId: userId,
      ownerEmail: session.user.email ?? '',
      ownerName: session.user.name ?? undefined,
    });

    return ok({ workspace }, { status: 201 });
  });
}
