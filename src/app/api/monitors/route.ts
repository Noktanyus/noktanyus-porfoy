/**
 * GET /api/monitors — kullanıcının monitörleri
 * POST /api/monitors — yeni monitör
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
  name: z.string().min(2).max(100),
  url: z.string().url().max(2000),
  type: z.enum(['HTTP', 'HTTPS', 'PING', 'PORT', 'KEYWORD', 'JSON']).default('HTTPS'),
  intervalSec: z.number().int().min(60).max(86400).default(300),
  timeoutSec: z.number().int().min(5).max(120).default(30),
  expectedStatus: z.number().int().min(100).max(599).nullable().optional(),
  keywordValue: z.string().max(500).nullable().optional(),
  jsonPath: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional().default(false),
  publicSlug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  alertChannelIds: z.array(z.string()).optional().default([]),
  region: z.string().max(40).optional().default('eu-west'),
  tags: z.array(z.string()).optional().default([]),
});

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const monitors = await prisma.monitor.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        url: true,
        type: true,
        status: true,
        intervalSec: true,
        uptimePct30d: true,
        lastResponseMs: true,
        lastCheckedAt: true,
        isPublic: true,
        publicSlug: true,
        createdAt: true,
      },
    });

    return ok({ monitors });
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
      throw new ValidationError('Geçersiz monitör verisi', parsed.error.flatten());
    }

    const data = parsed.data;
    if (data.isPublic && data.publicSlug) {
      const clash = await prisma.monitor.findUnique({
        where: { publicSlug: data.publicSlug },
        select: { id: true },
      });
      if (clash) throw new ConflictError('Bu public slug zaten kullanımda');
    }

    const monitor = await prisma.monitor.create({
      data: {
        userId,
        name: data.name,
        url: data.url,
        type: data.type,
        intervalSec: data.intervalSec,
        timeoutSec: data.timeoutSec,
        expectedStatus: data.expectedStatus ?? null,
        keywordValue: data.keywordValue ?? null,
        jsonPath: data.jsonPath ?? null,
        isPublic: data.isPublic,
        publicSlug: data.isPublic && data.publicSlug ? data.publicSlug : null,
        alertChannelIds: data.alertChannelIds,
        region: data.region === 'auto' ? 'eu-west' : data.region,
        tags: data.tags,
        status: 'PENDING',
      },
    });

    return created({ monitor });
  });
}
