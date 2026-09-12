/**
 * @file POST /api/oauth/clients/[id]/rotate-secret — Client Secret Rotation
 * @description L3: OAuth client secret'ı rotate eder. Yeni secret (plain) SADECE
 *              bu response'ta döner — tek seferlik gösterim.
 *
 *              Akış:
 *              1. Session kontrolü (NextAuth)
 *              2. Owner kontrolü (sadece client sahibi rotate edebilir)
 *              3. Yeni secret üret (32 byte hex, bcrypt cost 12 hash)
 *              4. Tüm aktif access + refresh token'lar revoke edilir
 *                 (güvenlik: eski secret'ı bilen saldırgan tüm session'ları kaybeder)
 *              5. Yeni secret response'ta döner
 *
 *              NOT: Grace period yok — atomik rotation. Eğer grace period
 *              istenirse, OAuthClient model'ine `previousSecretHash` + `previousSecretExpiresAt`
 *              eklenmeli.
 *
 *              Response: { clientSecret, revokedAccessTokens, revokedRefreshTokens }
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, NotFoundError, ConflictError } from '@/modules/shared/errors';
import { rotateClientSecret } from '@/modules/oauth/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    // Owner kontrolü
    const existing = await prisma.oAuthClient.findUnique({
      where: { id: params.id },
      select: { id: true, ownerId: true, revokedAt: true, clientId: true, name: true },
    });
    if (!existing || existing.ownerId !== userId) {
      // Bilgi sızıntısı önlemek için 404 (auth bypass'a karşı)
      throw new NotFoundError('OAuth client bulunamadı');
    }
    if (existing.revokedAt) {
      throw new ConflictError('İptal edilmiş client için secret rotate edilemez');
    }

    const result = await rotateClientSecret(existing.clientId);

    logger.info('[oauth] client secret rotated via API', {
      clientDbId: existing.id,
      clientId: existing.clientId,
      ownerId: userId,
      name: existing.name,
      revokedAccessTokens: result.revokedAccessTokens,
      revokedRefreshTokens: result.revokedRefreshTokens,
    });

    // NOT: clientSecret plain text — bu response'tan sonra DB'den kurtarılamaz.
    // UI'da bir kez gösterilmeli ve "Bu secret'ı güvenli bir yere kaydedin" uyarısı verilmeli.
    return ok({
      clientId: existing.clientId,
      clientSecret: result.clientSecret,
      revokedAccessTokens: result.revokedAccessTokens,
      revokedRefreshTokens: result.revokedRefreshTokens,
      warning:
        'Bu secret yalnızca bu response\'ta görüntülenir. Lütfen güvenli bir yere kaydedin.',
    });
  });
}
