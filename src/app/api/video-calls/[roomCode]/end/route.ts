/**
 * POST /api/video-calls/[roomCode]/end — toplantiyi sonlandir (host only)
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { videoCallService } from '@/modules/video-calls';

export async function POST(
  _req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const call = await videoCallService.endCall(params.roomCode, userId);
    return ok({ call });
  });
}