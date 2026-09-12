/**
 * Video Call Page
 *
 * Oda kodu ile video call kaydini arar; gercek WebRTC peer connection
 * henuz aktif olmadigindan (signaling server kurulu degil) bu sayfa
 * kullanici dostu bir EmptyState ile "Video gorusmesi henuz kullanima
 * acik degil" mesaji gosterir. Kayit DB'de yoksa 404 dondurulur.
 *
 * Not: Eski VideoRoom client component'i (src/components/video/VideoRoom.tsx)
 * bu sayfadan kaldirildi; signaling server ve gercek WebRTC altyapisi
 * hazir oldugunda yeniden baglanabilir.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FaVideo } from 'react-icons/fa';
import { prisma } from '@/lib/prisma';
import { EmptyState } from '@/components/ui/ErrorDisplay';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Video Görüşmesi',
  description:
    'Video görüşmesi henüz kullanıma açık değil. Yakında kullanıma sunulacak.',
  robots: { index: false, follow: false },
};

export default async function VideoCallPage({
  params,
}: {
  params: { roomCode: string };
}) {
  // DB erisimi korunuyor: oda var mi yok mu kontrol edip notFound() dondurmek
  // icin. Yeni feature uydurulmuyor, sadece mevcut kontrat (roomCode -> call).
  const call = await prisma.videoCall.findUnique({
    where: { roomCode: params.roomCode },
    select: {
      id: true,
      title: true,
      roomCode: true,
      status: true,
      host: { select: { id: true, name: true } },
    },
  });

  if (!call) notFound();

  const hostName = call.host?.name?.trim();
  const description = hostName
    ? `${hostName} tarafından oluşturulan görüşme odası şu anda hazırlık aşamasında. Yakında kullanıma sunulacak.`
    : 'Bu görüşme odası şu anda hazırlık aşamasında. Yakında kullanıma sunulacak.';

  return (
    <main
      className="min-h-[60vh] flex items-center justify-center px-4 py-12 bg-blob-decoration"

    >
      <div className="w-full max-w-md flex flex-col gap-3">
        <EmptyState
          variant="page"
          icon={<FaVideo className="w-8 h-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />}
          title="Video görüşmesi henüz kullanıma açık değil"
          description={description}
          action={{
            label: 'Dashboard’a Dön',
            href: '/dashboard',
          }}
          secondaryAction={{
            label: 'Destek Al',
            href: '/iletisim',
          }}
        />
      </div>
    </main>
  );
}
