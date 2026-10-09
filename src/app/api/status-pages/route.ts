/**
 * GET/POST /api/status-pages
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, created, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ValidationError, ConflictError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  title: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).optional(),
  brandColor: z.string().max(20).optional(),
  isPublic: z.boolean().optional().default(true),
  monitorIds: z.array(z.string()).max(50).default([]),
});

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;
    const pages = await prisma.statusPage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ pages });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const json = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError('Geçersiz status page', parsed.error.flatten());
    }

    const clash = await prisma.statusPage.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    });
    if (clash) throw new ConflictError('Bu slug zaten kullanımda');

    // Sadece kullanıcının monitörleri bağlanabilir
    if (parsed.data.monitorIds.length > 0) {
      const owned = await prisma.monitor.count({
        where: { userId, id: { in: parsed.data.monitorIds } },
      });
      if (owned !== parsed.data.monitorIds.length) {
        throw new ValidationError('Bazı monitörler size ait değil');
      }
    }

    const page = await prisma.statusPage.create({
      data: {
        userId,
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        brandColor: parsed.data.brandColor ?? '#0078D4',
        isPublic: parsed.data.isPublic,
        monitorIds: parsed.data.monitorIds,
      },
    });

    return created({ page });
  });
}
