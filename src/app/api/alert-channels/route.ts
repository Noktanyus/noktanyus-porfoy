/**
 * GET/POST /api/alert-channels
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, created, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ValidationError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['EMAIL', 'WEBHOOK', 'SLACK', 'DISCORD', 'TELEGRAM']),
  config: z.record(z.string()).default({}),
  events: z.array(z.string()).max(20).default(['down', 'up']),
  active: z.boolean().optional().default(true),
});

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const channels = await prisma.alertChannel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ channels });
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
      throw new ValidationError('Geçersiz alert kanalı', parsed.error.flatten());
    }

    const channel = await prisma.alertChannel.create({
      data: {
        userId,
        name: parsed.data.name,
        type: parsed.data.type,
        config: parsed.data.config,
        events: parsed.data.events,
        active: parsed.data.active,
      },
    });

    return created({ channel });
  });
}
