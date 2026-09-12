/**
 * @file OAuth Clients — Single Resource Endpoint
 * @description GET   : Client detayı (ownerId check, secret ASLA dönmez).
 *              DELETE: Soft revoke (revokedAt set + tüm access/refresh token'ları cascade iptal).
 *
 *              Soft revoke neden?
 *              - Audit trail korunur (kim, ne zaman, hangi client'ı iptal etti).
 *              - DB referans bütünlüğü bozulmaz (OAuthAccessToken.history).
 *              - Hard delete sadece GDPR / account-silme flow'unda ayrıca yapılır.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, NotFoundError, ConflictError } from '@/modules/shared/errors';
import { revokeAllClientTokens } from '@/modules/oauth/service';
import { logger } from '@/lib/logger';

/**
 * Public response shape — client_secret ASLA dönmez.
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
 * GET /api/oauth/clients/[id] — Client detayı.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const client = await prisma.oAuthClient.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        clientId: true,
        name: true,
        redirectUris: true,
        scopes: true,
        createdAt: true,
        revokedAt: true,
        ownerId: true,
      },
    });

    if (!client) throw new NotFoundError('OAuth client bulunamadı');
    if (client.ownerId !== userId) {
      // Sahiplik kontrolü — auth bypass'a karşı 404 döneriz (bilgi sızıntısı önlenir).
      throw new NotFoundError('OAuth client bulunamadı');
    }

    return ok(toPublicClient(client));
  });
}

/**
 * DELETE /api/oauth/clients/[id] — Soft revoke.
 * - revokedAt set edilir
 * - client'a ait tüm aktif access token'lar cascade iptal edilir
 * - Yeni token talepleri bu client için reddedilir (findActiveClient null döner)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    // Önce var mı + sahiplik kontrolü (atomik update'ten önce)
    const existing = await prisma.oAuthClient.findUnique({
      where: { id: params.id },
      select: { id: true, ownerId: true, revokedAt: true, clientId: true },
    });
    if (!existing || existing.ownerId !== userId) {
      throw new NotFoundError('OAuth client bulunamadı');
    }
    if (existing.revokedAt) {
      throw new ConflictError('Bu client zaten iptal edilmiş');
    }

    // Soft revoke + token cascade — atomik transaction.
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.oAuthClient.update({
        where: { id: params.id },
        data: { revokedAt: now },
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

      // Tüm aktif token'ları cascade iptal et (OAuthAccessToken tablosu).
      const revokedTokenCount = await tx.oAuthAccessToken.updateMany({
        where: { clientId: params.id, revokedAt: null },
        data: { revokedAt: now },
      });

      return { updated, revokedTokenCount: revokedTokenCount.count };
    });

    // Ek önlem: service üzerinden de çağır (idempotent — zaten 0 etkilenir).
    await revokeAllClientTokens(params.id);

    logger.info('[oauth] client revoked', {
      clientDbId: result.updated.id,
      clientId: result.updated.clientId,
      ownerId: userId,
      revokedTokens: result.revokedTokenCount,
    });

    return ok({
      ...toPublicClient(result.updated),
      revokedTokens: result.revokedTokenCount,
    });
  });
}
