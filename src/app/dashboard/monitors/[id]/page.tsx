/**
 * Dashboard — Monitör Detayı
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { monitoringService } from '@/modules/monitoring';
import { prisma } from '@/lib/prisma';
import { MonitorDetailClient } from '@/components/dashboard/MonitorDetailClient';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const dynamic = 'force-dynamic';

export default async function MonitorDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as any).id;

  try {
    const monitor = await monitoringService.getMonitor(userId, params.id);
    const [checks, incidents] = await Promise.all([
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
    ]);

    return (
      <div className="space-y-6">
        <PageHeader
          title={monitor.name}
          description={monitor.url}
          backHref="/dashboard/monitors"
          backLabel="Tüm Monitörler"
        />
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
