/**
 * GET /api/workspaces — kullanıcının workspace listesi
 * POST /api/workspaces — yeni workspace
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { workspaceService } from '@/modules/admin/workspaceService';
import { ok, created, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ValidationError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug küçük harf ve tire olmalı'),
  description: z.string().max(500).optional(),
});

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;
    const workspaces = await workspaceService.listForUser(userId);
    return ok({ workspaces });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;
    const email = session.user.email ?? '';
    const name = session.user.name ?? undefined;

    const json = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError('Geçersiz workspace verisi', parsed.error.flatten());
    }

    const workspace = await workspaceService.createWorkspace({
      ...parsed.data,
      ownerId: userId,
      ownerEmail: email,
      ownerName: name,
    });

    return created({ workspace });
  });
}
