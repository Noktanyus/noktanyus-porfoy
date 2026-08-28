/**
 * @file /api/workspaces/[id]/branding — workspace branding GET/PATCH.
 * @description
 *   - GET: ilgili workspace'in branding bilgisi (OWNER+ yetkisi gerekir).
 *   - PATCH: branding güncelle (sadece OWNER yetkisi).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { brandingService } from '@/modules/workspaces/brandingService';

const UpdateBrandingSchema = z.object({
  brandColor: z.string().trim().min(1).max(50).optional(),
  brandLogo: z
    .union([z.string().trim().url('Geçerli bir URL gir'), z.null()])
    .optional(),
  brandFavicon: z
    .union([z.string().trim().url('Geçerli bir URL gir'), z.null()])
    .optional(),
  customDomain: z
    .union([
      z
        .string()
        .trim()
        .max(253)
        .regex(/^[a-z0-9.-]+$/i, 'Geçersiz domain formatı'),
      z.null(),
    ])
    .optional(),
  whiteLabelEnabled: z.boolean().optional(),
});

async function ensureOwner(workspaceId: string): Promise<
  { ok: false; response: ReturnType<typeof fail> } | { ok: true; userId: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false,
      response: fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any),
    };
  }
  const userId = (session.user as { id: string }).id;
  if (!userId) {
    return {
      ok: false,
      response: fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any),
    };
  }

  // Workspace var mı ve kullanıcı OWNER+ mi?
  const { prisma } = await import('@/lib/prisma');
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (member && ['OWNER', 'ADMIN'].includes(member.role)) {
    return { ok: true, userId };
  }
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  if (ws?.ownerId === userId) {
    return { ok: true, userId };
  }
  return {
    ok: false,
    response: fail({
      code: 'FORBIDDEN',
      message: 'Bu işlem için OWNER yetkisi gerekli',
      statusCode: 403,
    } as any),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const guard = await ensureOwner(params.id);
    if (!guard.ok) return guard.response;
    const branding = await brandingService.getBranding(params.id);
    return ok({ branding });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const guard = await ensureOwner(params.id);
    if (!guard.ok) return guard.response;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Geçersiz JSON gövdesi',
        statusCode: 400,
      } as any);
    }

    const data = UpdateBrandingSchema.parse(body);

    if (typeof data.customDomain === 'string') {
      const check = brandingService.validateCustomDomain(data.customDomain);
      if (!check.valid) {
        return fail({
          code: 'VALIDATION_ERROR',
          message: check.reason ?? 'Geçersiz domain',
          statusCode: 400,
        } as any);
      }
    }

    const updated = await brandingService.updateBranding(params.id, data);
    return ok({ branding: updated });
  });
}
