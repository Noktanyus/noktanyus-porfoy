/**
 * GET  /api/admin/partners — tüm partnerleri listele
 * PATCH /api/admin/partners — verified/active güncelle
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { partnerService } from '@/modules/partners';
import { UnauthorizedError } from '@/modules/shared/errors';

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      throw new UnauthorizedError('Admin yetkisi gerekli');
    }
    const partners = await partnerService.listAll();
    return ok({ partners });
  });
}

const PatchSchema = z.object({
  id: z.string().min(1),
  verified: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      throw new UnauthorizedError('Admin yetkisi gerekli');
    }

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

    const data = PatchSchema.parse(body);
    if (data.verified === undefined && data.active === undefined) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'verified veya active gerekli',
        statusCode: 400,
      } as any);
    }

    const partner = await partnerService.setModeration(data.id, {
      verified: data.verified,
      active: data.active,
    });
    return ok({ partner });
  });
}
