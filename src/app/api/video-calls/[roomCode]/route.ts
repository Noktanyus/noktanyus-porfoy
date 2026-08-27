/**
 * GET /api/video-calls/[roomCode] — oda bilgisi getir (public, host bilgisi ile)
 */

import { NextRequest } from 'next/server';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { videoCallService } from '@/modules/video-calls';

export async function GET(
  _req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const call = await videoCallService.getByRoomCode(params.roomCode);
    if (!call) {
      return fail({ code: 'NOT_FOUND', message: 'Toplantı bulunamadı', statusCode: 404 } as any);
    }
    return ok({ call });
  });
}