/**
 * Dashboard — Uptime monitör listesi
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { MonitorList } from '@/components/dashboard/MonitorList';
import { MonitorStats } from '@/components/dashboard/MonitorStats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MonitorsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/monitors');

  const userId = (session.user as { id: string }).id;
  const monitors = await prisma.monitor.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      url: true,
      type: true,
      status: true,
      intervalSec: true,
      uptimePct30d: true,
      lastResponseMs: true,
      isPublic: true,
      publicSlug: true,
    },
  });

  const stats = {
    total: monitors.length,
    up: monitors.filter((m) => m.status === 'UP').length,
    down: monitors.filter((m) => m.status === 'DOWN').length,
    paused: monitors.filter((m) => m.status === 'PAUSED').length,
    pending: monitors.filter((m) => m.status === 'PENDING').length,
    avgUptime:
      monitors.length === 0
        ? 100
        : monitors.reduce((sum, m) => sum + m.uptimePct30d, 0) / monitors.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitörler"
        description="Endpoint ve site uptime takibi"
        actions={
          <Link href="/dashboard/monitors/new" className="admin-btn admin-btn-primary">
            Yeni monitör
          </Link>
        }
      />
      {monitors.length > 0 && <MonitorStats stats={stats} />}
      <MonitorList monitors={monitors} />
    </div>
  );
}
