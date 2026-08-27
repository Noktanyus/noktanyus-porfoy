/**
 * Public Status Page — /status/[slug]
 *
 * Bir kullanıcının public yaptığı monitörlerin özetini gösterir.
 * Auth gerektirmez. SEO-friendly.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaPause } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const first = await prisma.monitor.findFirst({
    where: { publicSlug: params.slug, isPublic: true },
    select: { name: true },
  });
  if (!first) {
    return { title: 'Status bulunamadı' };
  }
  return {
    title: `${first.name} — Sistem Durumu`,
    description: 'Gerçek zamanlı servis durumu ve uptime istatistikleri',
    robots: { index: true, follow: true },
  };
}

const STATUS_ICON: Record<string, any> = {
  UP: FaCheckCircle,
  DOWN: FaTimesCircle,
  PAUSED: FaPause,
  PENDING: FaSpinner,
};
const STATUS_COLOR: Record<string, string> = {
  UP: 'text-green-500',
  DOWN: 'text-red-500',
  PAUSED: 'text-gray-500',
  PENDING: 'text-yellow-500',
};
const STATUS_LABEL: Record<string, string> = {
  UP: 'Çalışıyor',
  DOWN: 'Çalışmıyor',
  PAUSED: 'Duraklatıldı',
  PENDING: 'Beklemede',
};

export default async function StatusPage({ params }: { params: { slug: string } }) {
  const monitors = await prisma.monitor.findMany({
    where: { publicSlug: params.slug, isPublic: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      url: true,
      status: true,
      uptimePct30d: true,
      lastCheckedAt: true,
      lastResponseMs: true,
      type: true,
    },
  });

  if (monitors.length === 0) notFound();

  const allUp = monitors.every((m) => m.status === 'UP');
  const anyDown = monitors.some((m) => m.status === 'DOWN');

  return (
    <main className="min-h-screen bg-blob-decoration">
      <div className="container-responsive py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Sistem Durumu</h1>
          <p className="text-sm text-muted-foreground mb-4">Anlık servis sağlığı</p>
          <div
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium ${
              allUp
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : anyDown
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
            }`}
          >
            {allUp ? <FaCheckCircle /> : anyDown ? <FaTimesCircle /> : <FaSpinner className="animate-spin" />}
            {allUp ? 'Tüm Sistemler Çalışıyor' : anyDown ? 'Bazı Servislerde Sorun Var' : 'Kontrol Ediliyor'}
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {monitors.map((monitor) => {
            const Icon = STATUS_ICON[monitor.status] ?? FaSpinner;
            const color = STATUS_COLOR[monitor.status] ?? 'text-yellow-500';
            return (
              <div
                key={monitor.id}
                className="glass-card-premium p-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">{monitor.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{monitor.url}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted">{monitor.type}</span>
                    {monitor.lastResponseMs != null && <span>{monitor.lastResponseMs}ms</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">30 gün</p>
                    <p className="text-sm font-semibold">{monitor.uptimePct30d.toFixed(2)}%</p>
                  </div>
                  <div className="flex flex-col items-center min-w-[88px]">
                    <Icon
                      className={`w-5 h-5 ${color} ${monitor.status === 'PENDING' ? 'animate-spin' : ''}`}
                    />
                    <p className={`text-xs mt-1 ${color}`}>{STATUS_LABEL[monitor.status]}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Powered by Noktanyus Monitor
        </p>
      </div>
    </main>
  );
}
