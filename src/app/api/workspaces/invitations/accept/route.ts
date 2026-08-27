/**
 * POST /api/workspaces/invitations/accept — Workspace davetini kabul eder.
 *
 * Body: { token: string }
 * Auth: zorunlu (NextAuth session)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { workspaceService } from '@/modules/admin/workspaceService';
import { logAudit } from '@/lib/audit';

const BodySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({ code: 'VALIDATION_ERROR', message: 'Geçersiz JSON gövdesi', statusCode: 400 } as any);
    }

    const { token } = BodySchema.parse(body);

    const invitation = await workspaceService.acceptInvitation(token, userId);

    await logAudit({
      userId,
      userEmail: session.user.email ?? undefined,
      action: 'CREATE',
      resource: 'WorkspaceMember',
      resourceId: invitation.workspaceId,
      details: { invitationId: invitation.id, role: invitation.role },
    });

    return ok({ invitation });
  });
}
