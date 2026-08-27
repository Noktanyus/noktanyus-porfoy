/**
 * GET /api/video-calls — kullanicinin toplantilarini listele
 * POST /api/video-calls — yeni video call olustur
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { videoCallService } from '@/modules/video-calls';
import { CreateVideoCallSchema } from '@/modules/video-calls/schemas';

export async function GET(_req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const calls = await videoCallService.listMyCalls(userId);
    return ok({ calls });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const body = await req.json();
    const data = CreateVideoCallSchema.parse(body);

    // Credit kontrolu
    await videoCallService.assertHostHasCredits(userId, data.durationMin);

    const call = await videoCallService.create(userId, data);
    return ok({ call }, { status: 201 });
  });
}