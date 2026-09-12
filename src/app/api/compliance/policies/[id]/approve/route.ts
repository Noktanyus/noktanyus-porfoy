/**
 * @file /api/compliance/policies/[id]/approve - Privacy Policy onaylama
 * @description POST: Draft policy'yi onaylar (approvedAt set edilir).
 *
 * Auth: authenticated user + workspace membership.
 * Body: { workspaceId: string }
 * Response: güncellenen PrivacyPolicy
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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }

    const params = await Promise.resolve(context.params);
    const policyId = params.id;
    if (!policyId) {
      throw new ValidationError('Policy ID zorunlu');
    }

    const body = await req.json().catch(() => ({}));
    const wsCheck = await assertWorkspaceAccess(req, session.user.id, { body });
    if (wsCheck.error) return wsCheck.error;
    const workspaceId = wsCheck.workspaceId;

    const updated = await policyService.approvePolicy({
      policyId,
      workspaceId,
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
    });

    return ok(updated);
  });
}
