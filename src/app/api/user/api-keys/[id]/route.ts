/**
 * @file API Anahtarı — Single Resource Endpoint
 * @description GET: tek API anahtarını getir.
 *              PATCH: anahtarı güncelle (scopes, rate limit, name, quota, expires).
 *              DELETE: anahtarı iptal et (soft) veya kalıcı sil (hard=true).
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiKeyService } from '@/modules/api-keys/service';
import { UpdateApiKeySchema } from '@/modules/api-keys/schemas';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, NotFoundError } from '@/modules/shared/errors';
import { logDataAccess } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const key = await prisma.apiKey.findFirst({
      where: { id: params.id, userId },
      include: {
        _count: { select: { usages: true } },
      },
    });
    if (!key) throw new NotFoundError('API anahtarı bulunamadı');

    // Phase 4 C.8 — KVKK Madde 11: kişisel veri erişimi audit
    logDataAccess({
      userId,
      resource: 'api_key',
      resourceId: params.id,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    return ok({
      ...key,
      key: `${key.prefix}...`, // Mask
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
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const data = UpdateApiKeySchema.parse(body);

    const key = await apiKeyService.updateApiKey(userId, params.id, data);
    // Mask
    return ok({ ...key, key: `${key.prefix}...` });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const url = new URL(req.url);
    const hard = url.searchParams.get('hard') === 'true';

    if (hard) {
      await apiKeyService.deleteApiKey(userId, params.id);
      return ok({ success: true, mode: 'deleted' });
    }
    await apiKeyService.revokeApiKey(userId, params.id);
    return ok({ success: true, mode: 'revoked' });
  });
}