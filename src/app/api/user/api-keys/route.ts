/**
 * @file API Anahtarları — Collection Endpoint
 * @description GET: kullanıcının anahtarlarını listele (masked).
 *              POST: yeni API anahtarı oluştur.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiKeyService } from '@/modules/api-keys/service';
import { CreateApiKeySchema } from '@/modules/api-keys/schemas';
import { ok, created, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const keys = await apiKeyService.listApiKeys(userId);
    // Mask full key — sadece prefix + '...' göster
    const masked = keys.map((k: any) => ({ ...k, key: `${k.prefix}...` }));
    return ok(masked);
  });
}

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const data = CreateApiKeySchema.parse(body);

    const key = await apiKeyService.createApiKey(userId, data);
    return created({
      ...key,
      warning: 'Bu anahtarı şimdi kaydedin. Bir daha gösterilmeyecek.',
    });
  });
});