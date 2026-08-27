/**
 * @file API Anahtarı — Single Resource Endpoint
 * @description PATCH: anahtarı güncelle (scopes, rate limit, name, quota, expires).
 *              DELETE: anahtarı iptal et (soft) veya kalıcı sil (hard=true).
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiKeyService } from '@/modules/api-keys/service';
import { UpdateApiKeySchema } from '@/modules/api-keys/schemas';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';

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