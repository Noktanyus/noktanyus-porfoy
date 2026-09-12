/**
 * @file /api/compliance/policies - Privacy Policy listeleme
 * @description GET: siteId'ye ait policy versiyonlarını sayfalı listeler.
 *
 * Auth: authenticated user + workspace membership.
 *
 * Query:
 *   - workspaceId (required) — body'den de okunabilir
 *   - siteId (required)
 *   - page, pageSize (default 1, 20)
 *   - jurisdiction? (KVKK | GDPR | KVKK+GDPR)
 *   - onlyPublished? (boolean)
 *
 * Response: { items: PrivacyPolicy[], total, page, pageSize }
 */

import { NextRequest } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ValidationError } from '@/modules/shared/errors';
import { assertWorkspaceAccess } from '@/lib/saasWorkspace';
import { policyService } from '@/modules/compliance/policyService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }

    const wsCheck = await assertWorkspaceAccess(req, session.user.id);
    if (wsCheck.error) return wsCheck.error;
    const workspaceId = wsCheck.workspaceId;

    const siteId = req.nextUrl.searchParams.get('siteId');
    if (!siteId) {
      throw new ValidationError('siteId zorunlu (?siteId=...)');
    }

    const jurisdiction = req.nextUrl.searchParams.get('jurisdiction') ?? undefined;
    const onlyPublished =
      (req.nextUrl.searchParams.get('onlyPublished') ?? 'false').toLowerCase() === 'true';
    const page = req.nextUrl.searchParams.get('page') ?? undefined;
    const pageSize = req.nextUrl.searchParams.get('pageSize') ?? undefined;

    const result = await policyService.listPolicies(siteId, workspaceId, {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      jurisdiction: jurisdiction as 'KVKK' | 'GDPR' | 'KVKK+GDPR' | undefined,
      onlyPublished,
    });

    return ok(result);
  });
}
