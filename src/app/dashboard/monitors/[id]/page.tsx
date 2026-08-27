/**
 * Dashboard — Monitör Detayı
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { monitoringService } from '@/modules/monitoring';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { MonitorDetailClient } from '@/components/dashboard/MonitorDetailClient';

export const dynamic = 'force-dynamic';

export default async function MonitorDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as any).id;

  try {
    const monitor = await monitoringService.getMonitor(userId, params.id);
    const [checks, incidents, stats] = await Promise.all([
      prisma.monitorCheck.findMany({
        where: { monitorId: params.id },
        orderBy: { timestamp: 'desc' },
        take: 100,
      }),
      prisma.incident.findMany({
        where: { monitorId: params.id },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
      monitoringService.getStats(userId),
    ]);

    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/monitors"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <FaArrowLeft className="w-3 h-3" />
          Tüm Monitörler
        </Link>

        <MonitorDetailClient
          monitor={monitor}
          checks={checks}
          incidents={incidents}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
