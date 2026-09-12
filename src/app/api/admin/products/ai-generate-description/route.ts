/**
 * @file /api/admin/products/ai-generate-description - AI Product Description endpoint
 * @description POST: AI ile ürün açıklaması üretir (mock mode destekli).
 *              Auth: any authenticated user (Phase D.3 — planGate quota kontrolü yeterli).
 *              Body: AiDescribeSchema
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ForbiddenError } from '@/modules/shared/errors';
import { AiDescribeSchema } from '@/modules/ai/schemas';
import { generateProductDescription } from '@/modules/ai/service';
import { checkAiQuota } from '@/lib/planGate';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');

    const body = await req.json();
    const input = AiDescribeSchema.parse(body);

    const quota = await checkAiQuota(session.user.id, 800);
    if (!quota.allowed) {
      return fail(new ForbiddenError(quota.reason ?? 'AI kota limiti aşıldı'));
    }

    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    const result = await generateProductDescription(input, {
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    return ok(result);
  });
}
