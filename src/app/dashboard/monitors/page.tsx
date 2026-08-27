/**
 * Dashboard — Monitör Listesi
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { monitoringService } from '@/modules/monitoring';
import { redirect } from 'next/navigation';
import { MonitorList } from '@/components/dashboard/MonitorList';
import { MonitorStats } from '@/components/dashboard/MonitorStats';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

export default async function MonitorsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as any).id;
  const monitors = await monitoringService.listMonitors(userId);
  const stats = await monitoringService.getStats(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitörler</h1>
          <p className="text-sm text-muted-foreground">{monitors.length} monitör</p>
        </div>
        <Link href="/dashboard/monitors/new" className="admin-btn admin-btn-primary">
          <FaPlus className="w-3 h-3" />
          Yeni Monitör
        </Link>
      </div>

      <MonitorStats stats={stats} />
      <MonitorList monitors={monitors} />
    </div>
  );
}
