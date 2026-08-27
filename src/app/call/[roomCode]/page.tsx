/**
 * Video Call Page (WebRTC stub)
 *
 * Phase "Video Calls + Affiliate" kapsaminda eklendi.
 * roomCode ile video call odasini getirir ve VideoRoom client component'ini renderlar.
 */

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { VideoRoom } from '@/components/video/VideoRoom';

export const dynamic = 'force-dynamic';

export default async function VideoCallPage({
  params,
}: {
  params: { roomCode: string };
}) {
  const call = await prisma.videoCall.findUnique({
    where: { roomCode: params.roomCode },
    include: {
      host: { select: { id: true, name: true, image: true } },
    },
  });

  if (!call) notFound();

  return <VideoRoom call={call} />;
}