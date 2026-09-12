/**
 * @file /api/compliance/policy/generate - AI Privacy Policy Generator
 * @description POST: AI ile KVKK/GDPR privacy policy üretir, draft olarak kaydeder.
 *
 * Auth: authenticated user + workspace membership (workspaceId body'de gelir)
 * Quota: planGate.checkAiQuota() ile aylık AI token kontrolü
 *
 * Body: GeneratePolicyRequest
 *   - workspaceId (required)
 *   - siteId (required)
 *   - jurisdiction: 'KVKK' | 'GDPR' | 'KVKK+GDPR'
 *   - companyName, domain, country (required)
 *   - language?, customClauses?, contactEmail?, companyAddress?, companyPhone?,
 *     dpoName?, dpoEmail?, mersisNo?, taxOffice?, taxNumber?
 *   - manualContent? (verilirse AI çağrılmaz)
 *
 * Response: 201 + PrivacyPolicy + aiMeta (token, cost, model, baseTemplate)
 */

import { NextRequest } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { checkAiQuota } from '@/lib/planGate';
import { UnauthorizedError, ForbiddenError } from '@/modules/shared/errors';
import { assertWorkspaceAccess } from '@/lib/saasWorkspace';
import { policyService } from '@/modules/compliance/policyService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }

    const body = await req.json().catch(() => ({}));

    // Workspace doğrulama (body.workspaceId zorunlu)
    const wsCheck = await assertWorkspaceAccess(req, session.user.id, { body });
    if (wsCheck.error) return wsCheck.error;
    const workspaceId = wsCheck.workspaceId;

    // Manuel içerik verilmemişse AI quota kontrolü
    if (!body?.manualContent || (body.manualContent as string).trim().length === 0) {
      const quota = await checkAiQuota(session.user.id, 3000);
      if (!quota.allowed) {
        return fail(
          new ForbiddenError(quota.reason ?? 'AI kota limiti aşıldı — Privacy Policy için')
        );
      }
    }

    const ipAddress =
      req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    const result = await policyService.generatePolicy({
      workspaceId,
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      ipAddress,
      userAgent,
      request: body,
    });

    return ok(result, { status: 201 });
  });
}
