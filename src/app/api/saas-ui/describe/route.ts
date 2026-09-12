/**
 * @file /api/saas-ui/describe - Session-based tekil AI üretim.
 * @description /api/saas/ai/describe API-key bazlıdır; UI (oturum açmış
 *              kullanıcı) için session-bridged sürüm. Body'de workspaceId
 *              yok, kullanıcının ilk workspace'i kullanılır.
 *
 *              Auth: getServerSession
 *              Scope davranışı: ai:describe:write (session user'a otomatik)
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ForbiddenError } from '@/modules/shared/errors';
import { AiDescribeSchema } from '@/modules/ai/schemas';
import { generateProductDescription } from '@/modules/ai/service';
import { checkAiQuota } from '@/lib/planGate';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');

    const userId = session.user.id as string;

    // Body parse
    const body = await req.json();
    const { brandVoiceId, ...rest } = body as { brandVoiceId?: string };
    const input = AiDescribeSchema.parse(rest);

    // Workspace resolve — üye olduğu ilk workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId },
      select: { workspaceId: true },
      orderBy: { joinedAt: 'desc' },
    });
    if (!membership) {
      throw new ForbiddenError('Önce bir workspace oluşturun');
    }
    const workspaceId = membership.workspaceId;

    // Brand voice workspace-scoped doğrulama
    if (brandVoiceId) {
      const voice = await prisma.brandVoice.findFirst({
        where: { id: brandVoiceId, workspaceId },
        select: { id: true },
      });
      if (!voice) {
        throw new ForbiddenError('Brand voice bu workspace\'e ait değil');
      }
    }

    // Quota
    const quota = await checkAiQuota(userId, 2100);
    if (!quota.allowed) {
      throw new ForbiddenError(quota.reason ?? 'AI kota limiti aşıldı');
    }

    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    const result = await generateProductDescription(input, {
      userId,
      userEmail: session.user.email ?? undefined,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    return ok(result);
  });
}
