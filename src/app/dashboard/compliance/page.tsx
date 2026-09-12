/**
 * Compliance Dashboard — Ana sayfa.
 *
 * KVKK/GDPR uyumluluk takip sisteminin ana dashboard'u.
 * Stats, sites grid, recent scans ve "Add Site" butonu.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AddComplianceSiteDialog } from '@/components/compliance/AddComplianceSiteDialog';
import { ComplianceScoreCard } from '@/components/compliance/ComplianceScoreCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaGlobe,
  FaFileContract,
  FaChartLine,
} from 'react-icons/fa';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getDashboardData(userId: string) {
  // Kullanıcının workspace'leri
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true, workspace: { select: { id: true, name: true } } },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);
  const workspaces = memberships
    .map((m) => m.workspace)
    .filter((w): w is { id: string; name: string } => Boolean(w));

  if (workspaceIds.length === 0) {
    return {
      workspaces: [],
      sites: [],
      recentScans: [],
      stats: {
        totalSites: 0,
        avgScore: null as number | null,
        openBreaches: 0,
        upcomingScans: 0,
        compliantSites: 0,
        warningSites: 0,
        criticalSites: 0,
      },
    };
  }

  // Tüm siteler
  const sites = await prisma.complianceSite.findMany({
    where: { workspaceId: { in: workspaceIds } },
    orderBy: { updatedAt: 'desc' },
    include: {
      scans: {
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: { id: true, score: true, status: true, startedAt: true },
      },
      _count: {
        select: { breaches: true, policies: true },
      },
    },
  });

  // Recent scans
  const recentScans = await prisma.cookieScan.findMany({
    where: { site: { workspaceId: { in: workspaceIds } } },
    orderBy: { startedAt: 'desc' },
    take: 8,
    include: {
      site: { select: { domain: true, name: true } },
    },
  });

  // Stats
  const totalSites = sites.length;
  const scoresArray = sites
    .map((s) => s.complianceScore)
    .filter((s): s is number => s != null);
  const avgScore =
    scoresArray.length > 0
      ? Math.round(scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length)
      : null;

  const compliantSites = sites.filter((s) => s.status === 'compliant').length;
  const warningSites = sites.filter((s) => s.status === 'warning').length;
  const criticalSites = sites.filter((s) => s.status === 'critical').length;

  const openBreaches = await prisma.dataBreachIncident.count({
    where: {
      workspaceId: { in: workspaceIds },
      resolvedAt: null,
    },
  });

  const upcomingScans = await prisma.complianceSite.count({
    where: {
      workspaceId: { in: workspaceIds },
      nextScanAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    },
  });

  return {
    workspaces,
    sites: sites.map((s) => ({
      id: s.id,
      domain: s.domain,
      name: s.name,
      status: s.status,
      complianceScore: s.complianceScore,
      lastScanAt: s.lastScanAt?.toISOString() ?? null,
      nextScanAt: s.nextScanAt?.toISOString() ?? null,
      scanCount: s._count.policies,
      breachCount: s._count.breaches,
      latestScan: s.scans[0]
        ? {
            score: s.scans[0].score,
            status: s.scans[0].status,
            startedAt: s.scans[0].startedAt.toISOString(),
          }
        : null,
    })),
    recentScans: recentScans.map((s) => ({
      id: s.id,
      siteId: s.siteId,
      siteName: s.site.name,
      siteDomain: s.site.domain,
      status: s.status,
      score: s.score,
      startedAt: s.startedAt.toISOString(),
      pagesScanned: s.pagesScanned,
    })),
    stats: {
      totalSites,
      avgScore,
      openBreaches,
      upcomingScans,
      compliantSites,
      warningSites,
      criticalSites,
    },
  };
}

export default async function ComplianceDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/compliance');
  const userId = (session.user as any).id as string;

  const data = await getDashboardData(userId);

  if (data.workspaces.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <FaShieldAlt className="text-blue-500" aria-hidden="true" />
              KVKK / GDPR Compliance
            </span>
          }
          description="Web sitelerinizin KVKK ve GDPR uyumluluğunu izleyin"
        />
        <EmptyState
          title="Henüz workspace'iniz yok"
          description="Compliance takibi için önce bir workspace oluşturmalısınız."
          icon="🛡️"
          action={{ label: 'Workspace Oluştur', href: '/dashboard/workspaces?new=1' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <FaShieldAlt className="text-blue-500" aria-hidden="true" />
            KVKK / GDPR Compliance
          </span>
        }
        description={`${data.stats.totalSites} site izleniyor`}
        actions={<AddComplianceSiteDialog workspaces={data.workspaces} />}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="admin-card">
          <div className="flex items-center justify-between mb-2">
            <FaGlobe className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{data.stats.totalSites}</p>
          <p className="text-xs text-muted-foreground">Toplam Site</p>
          <p className="text-xs mt-1">
            <span className="text-green-600 dark:text-green-400">
              {data.stats.compliantSites} uyumlu
            </span>
            {' · '}
            <span className="text-yellow-600 dark:text-yellow-400">
              {data.stats.warningSites} uyarı
            </span>
            {' · '}
            <span className="text-red-600 dark:text-red-400">
              {data.stats.criticalSites} kritik
            </span>
          </p>
        </div>

        <div className="admin-card">
          <div className="flex items-center justify-between mb-2">
            <FaChartLine className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold">
            {data.stats.avgScore ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground">Ortalama Skor</p>
          <p className="text-xs text-muted-foreground mt-1">0-100 arası</p>
        </div>

        <Link
          href="/dashboard/compliance/incidents"
          className="admin-card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <FaExclamationTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold">{data.stats.openBreaches}</p>
          <p className="text-xs text-muted-foreground">Açık İhlal</p>
          {data.stats.openBreaches > 0 && (
            <p className="text-xs text-red-600 mt-1">Aksiyon gerekli</p>
          )}
        </Link>

        <div className="admin-card">
          <div className="flex items-center justify-between mb-2">
            <FaCalendarAlt className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold">{data.stats.upcomingScans}</p>
          <p className="text-xs text-muted-foreground">Yaklaşan Tarama</p>
          <p className="text-xs text-muted-foreground mt-1">7 gün içinde</p>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Link
          href="/dashboard/compliance/sites"
          className="admin-card hover:shadow-md transition-shadow text-center"
        >
          <FaGlobe className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className="font-medium text-sm">Siteler</p>
        </Link>
        <Link
          href="/dashboard/compliance/policies"
          className="admin-card hover:shadow-md transition-shadow text-center"
        >
          <FaFileContract className="w-6 h-6 mx-auto mb-2 text-purple-500" />
          <p className="font-medium text-sm">Policies</p>
        </Link>
        <Link
          href="/dashboard/compliance/incidents"
          className="admin-card hover:shadow-md transition-shadow text-center"
        >
          <FaExclamationTriangle className="w-6 h-6 mx-auto mb-2 text-red-500" />
          <p className="font-medium text-sm">İhlaller</p>
        </Link>
      </div>

      {/* Sites Grid */}
      <DashboardSection
        title="İzlenen Siteler"
        description="İlk 6 site"
        padding="md"
      >
        {data.sites.length === 0 ? (
          <EmptyState
            title="Henüz site eklenmemiş"
            description="Yeni bir site ekleyerek uyumluluk taramasını başlatabilirsin."
            icon="🌐"
            variant="inline"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.sites.slice(0, 6).map((site) => (
              <ComplianceScoreCard
                key={site.id}
                siteName={`${site.name} (${site.domain})`}
                score={site.complianceScore}
                status={site.status}
              />
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Recent Scans */}
      <DashboardSection
        title="Son Taramalar"
        description="En son 8 tarama"
        padding="none"
      >
        {data.recentScans.length === 0 ? (
          <EmptyState
            title="Henüz tarama yapılmadı"
            description="Site eklediğinde taramalar burada listelenir."
            icon="✅"
            variant="inline"
          />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.recentScans.map((scan) => (
              <li
                key={scan.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/compliance/sites/${scan.siteId}`}
                    className="font-medium text-sm hover:underline truncate block"
                  >
                    {scan.siteName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {scan.siteDomain} · {scan.pagesScanned} sayfa ·{' '}
                    {new Date(scan.startedAt).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {scan.score != null && (
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        scan.score >= 80
                          ? 'text-green-600'
                          : scan.score >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {scan.score}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      scan.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : scan.status === 'failed'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}
                  >
                    {scan.status === 'completed'
                      ? 'Tamamlandı'
                      : scan.status === 'failed'
                      ? 'Başarısız'
                      : 'Çalışıyor'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
