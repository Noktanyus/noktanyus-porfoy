/**
 * Dashboard Genel Bakış — kullanıcının monitör özet istatistikleri.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { monitoringService } from '@/modules/monitoring';
import { prisma } from '@/lib/prisma';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaPause, FaChartLine } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id;
  const stats = await monitoringService.getStats(userId);

  // Son 10 incident
  const recentMonitors = await prisma.monitor.findMany({
    where: { userId },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      incidents: {
        where: { resolvedAt: null },
        take: 1,
      },
    },
  });

  const cards = [
    { label: 'Toplam Monitör', value: stats.total, icon: FaChartLine, color: 'text-blue-500' },
    { label: 'Çalışıyor', value: stats.up, icon: FaCheckCircle, color: 'text-green-500' },
    { label: 'Çalışmıyor', value: stats.down, icon: FaTimesCircle, color: 'text-red-500' },
    { label: 'Duraklatılmış', value: stats.paused, icon: FaPause, color: 'text-gray-500' },
    { label: 'Beklemede', value: stats.pending, icon: FaSpinner, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hoş geldin, {session?.user?.name ?? 'kullanıcı'}</h1>
        <p className="text-sm text-muted-foreground">Monitoring sisteminizin genel durumu</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="glass-card-premium p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${c.color}`} />
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
              <p className="text-2xl font-bold">{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="glass-card-premium p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Ortalama Uptime (30 gün)</h2>
          <span className="text-2xl font-bold text-brand-primary">{stats.avgUptime}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-primary to-green-500 transition-all"
            style={{ width: `${stats.avgUptime}%` }}
          />
        </div>
      </div>

      <div className="glass-card-premium p-5">
        <h2 className="font-semibold mb-4">Son Monitörler</h2>
        {recentMonitors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Henüz monitör yok. <a href="/dashboard/monitors/new" className="text-brand-primary underline">Yeni monitör oluştur</a>.
          </p>
        ) : (
          <div className="space-y-2">
            {recentMonitors.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0 border-border/30">
                <div>
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">{m.url}</p>
                </div>
                <span className="text-xs text-muted-foreground">{m.uptimePct30d.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
