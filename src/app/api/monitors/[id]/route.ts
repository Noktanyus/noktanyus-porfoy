/**
 * GET/PATCH/DELETE /api/monitors/[id]
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  url: z.string().url().max(2000).optional(),
  intervalSec: z.number().int().min(60).max(86400).optional(),
  timeoutSec: z.number().int().min(5).max(120).optional(),
  expectedStatus: z.number().int().min(100).max(599).nullable().optional(),
  keywordValue: z.string().max(500).nullable().optional(),
  status: z.enum(['UP', 'DOWN', 'PAUSED', 'PENDING']).optional(),
  isPublic: z.boolean().optional(),
  publicSlug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .nullable()
    .optional(),
  alertChannelIds: z.array(z.string()).optional(),
});

async function requireOwnedMonitor(id: string, userId: string) {
  const monitor = await prisma.monitor.findFirst({ where: { id, userId } });
  if (!monitor) throw new NotFoundError('Monitör bulunamadı');
  return monitor;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const monitor = await prisma.monitor.findFirst({
      where: { id: params.id, userId },
      include: {
        checks: { orderBy: { timestamp: 'desc' }, take: 48 },
        incidents: { orderBy: { startedAt: 'desc' }, take: 20 },
      },
    });
    if (!monitor) throw new NotFoundError('Monitör bulunamadı');

    return ok({
      monitor,
      checks: monitor.checks,
      incidents: monitor.incidents,
    });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;
    await requireOwnedMonitor(params.id, userId);

    const json = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError('Geçersiz güncelleme', parsed.error.flatten());
    }

    if (parsed.data.publicSlug) {
      const clash = await prisma.monitor.findFirst({
        where: {
          publicSlug: parsed.data.publicSlug,
          NOT: { id: params.id },
        },
        select: { id: true },
      });
      if (clash) throw new ConflictError('Bu public slug zaten kullanımda');
    }

    const monitor = await prisma.monitor.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return ok({ monitor });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;
    await requireOwnedMonitor(params.id, userId);

    await prisma.monitor.delete({ where: { id: params.id } });
    return ok({ success: true });
  });
}
