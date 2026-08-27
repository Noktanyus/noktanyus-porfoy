/**
 * POST /api/video-calls/[roomCode]/join — toplantiya katil (public, guest destegi)
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { videoCallService } from '@/modules/video-calls';
import { JoinVideoCallSchema } from '@/modules/video-calls/schemas';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const data = JoinVideoCallSchema.parse(body);

    const userId = session ? (session.user as any).id ?? null : null;

    const { call, participant } = await videoCallService.joinRoom(
      params.roomCode,
      userId,
      data.name,
      data.email
    );

    return ok({
      roomCode: params.roomCode,
      joined: true,
      callId: call.id,
      participantId: participant.id,
    });
  });
}