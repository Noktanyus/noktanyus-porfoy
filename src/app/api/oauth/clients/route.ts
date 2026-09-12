/**
 * @file OAuth Clients — Collection Endpoint
 * @description GET  : Kullanıcının OAuth client'larını listele (client_secret maskeli).
 *              POST : Yeni OAuth client oluştur. Dönen `clientSecret` sadece 1 kez gösterilir.
 *
 *              Akış:
 *              - GET  /api/oauth/clients           → listele (id, name, clientId, scopes, ...)
 *              - POST /api/oauth/clients           → create → { client, clientSecret (plain) }
 *              - GET  /api/oauth/clients/[id]      → detay
 *              - DEL  /api/oauth/clients/[id]      → soft revoke (revokedAt set + token revocation cascade)
 *
 *              Güvenlik:
 *              - Sadece authenticated user kendi client'larını yönetir (ownerId check).
 *              - Plain client_secret sadece POST response'unda döner, sonraki GET'lerde asla.
 *              - Rate limit (api) uygulanır — kötüye kullanım koruması.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, created, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';
import { CreateClientSchema } from '@/modules/oauth/schemas';
import {
  createClient,
  generateClientId,
  hashClientSecret,
} from '@/modules/oauth/service';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

/**
 * Public response shape — client_secret ASLA dönmez.
 * İlk oluşturmada plain secret yalnızca POST response'unda döner (show-once).
 */
function toPublicClient(c: {
  id: string;
  clientId: string;
  name: string;
  redirectUris: unknown;
  scopes: unknown;
  createdAt: Date;
  revokedAt: Date | null;
}) {
  return {
    id: c.id,
    clientId: c.clientId,
    name: c.name,
    redirectUris: c.redirectUris as string[],
    scopes: c.scopes as string[],
    createdAt: c.createdAt.toISOString(),
    revokedAt: c.revokedAt ? c.revokedAt.toISOString() : null,
  };
}

/**
 * GET /api/oauth/clients — Kullanıcının OAuth client'larını listele.
 */
export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const clients = await prisma.oAuthClient.findMany({
      where: { ownerId: userId },
      orderBy: [{ revokedAt: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        clientId: true,
        name: true,
        redirectUris: true,
        scopes: true,
        createdAt: true,
        revokedAt: true,
      },
    });

    return ok(clients.map(toPublicClient));
  });
}

/**
 * POST /api/oauth/clients — Yeni OAuth client oluştur.
 * Response'ta plain clientSecret sadece 1 kez döner (show-once).
 */
export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const data = CreateClientSchema.parse(body);

    // createClient kendi içinde bcrypt + random üretir; ama show-once için
    // plain secret'i response'a koyabilmek adımı burada yeniden üretmiyoruz —
    // service bunu zaten döndürüyor (OAuth service kontratı).
    const { client, clientSecret } = await createClient(userId, data);

    logger.info('[oauth] client created via API', {
      ownerId: userId,
      clientDbId: client.id,
      clientId: client.clientId,
      name: client.name,
    });

    // Show-once: plain secret sadece bu response'ta. UI kopyalanmadığı takdirde
    // bir daha gösterilmez — yeni client oluşturmak gerekir.
    return created({
      ...toPublicClient(client),
      clientSecret,
      warning:
        'Bu client_secret sadece bu sefer gösterilir. Şimdi kopyalayın — bir daha gösterilmeyecek.',
    });
  });
});

// İç kullanım için export (test/debug amaçlı). Prod bundle'da tree-shaken.
export { generateClientId, hashClientSecret };
