/**
 * @file /api/admin/blog/ai-generate - AI Blog Writer endpoint
 * @description POST: AI ile blog yazısı üretir (mock mode destekli).
 *              Auth: any authenticated user (planGate quota kontrolü yeterli).
 *              Phase D.3 kapsamında admin-only check kaldırıldı; Pro/Enterprise
 *              planlı kullanıcılar da erişebilir.
 *              Body: AiWriteSchema (prompt, tone, length, language, keywords?, existingTitle?, existingDescription?)
 *              Response: AiWriteResponse (title, description, content, tags, tokensUsed, mock)
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ForbiddenError } from '@/modules/shared/errors';
import { AiWriteSchema } from '@/modules/ai/schemas';
import { generateBlog } from '@/modules/ai/service';
import { checkAiQuota } from '@/lib/planGate';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }

    const body = await req.json();
    const input = AiWriteSchema.parse(body);

    // Tier quota kontrolü (Pro/Enterprise — Phase D.3 ile admin kisitlamasi kaldirildi)
    const quota = await checkAiQuota(session.user.id, 1500);
    if (!quota.allowed) {
      return fail(new ForbiddenError(quota.reason ?? 'AI kota limiti aşıldı'));
    }

    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    const result = await generateBlog(input, {
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    return ok(result);
  });
}
