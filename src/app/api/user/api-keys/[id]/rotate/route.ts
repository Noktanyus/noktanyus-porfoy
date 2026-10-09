/**
 * POST /api/user/api-keys/[id]/rotate — secret yenile (tek seferlik plain key)
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiKeyService } from '@/modules/api-keys/service';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const rotated = await apiKeyService.rotateApiKey(userId, params.id);

    void logAudit({
      userId,
      action: 'UPDATE',
      resource: 'api_key',
      resourceId: params.id,
      details: { action: 'rotate', prefix: rotated.prefix },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    return ok({
      id: rotated.id,
      name: rotated.name,
      prefix: rotated.prefix,
      key: rotated.key,
      message: 'Yeni anahtar yalnızca şimdi görünür — güvenli saklayın.',
    });
  });
}
