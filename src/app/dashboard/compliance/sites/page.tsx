/**
 * Compliance Sites List — Workspace bazlı izlenen siteler tablosu.
 *
 * Filtreler: status, country.
 * Toplu aksiyonlar: scan başlat, durum güncelle, sil.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { AddComplianceSiteDialog } from '@/components/compliance/AddComplianceSiteDialog';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  FaShieldAlt,
  FaSearch,
  FaTrash,
  FaPlay,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';

export const dynamic = 'force-dynamic';

interface ComplianceSitesPageProps {
  searchParams: {
    status?: string;
    country?: string;
    search?: string;
  };
}

async function getSitesData(
  userId: string,
  filters: { status?: string; country?: string; search?: string }
) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: {
      workspaceId: true,
      workspace: { select: { id: true, name: true } },
    },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);
  const workspaces = memberships
    .map((m) => m.workspace)
    .filter((w): w is { id: string; name: string } => Boolean(w));

  if (workspaceIds.length === 0) {
    return { workspaces: [], sites: [], countries: [] as string[] };
  }

  const sites = await prisma.complianceSite.findMany({
    where: {
      workspaceId: { in: workspaceIds },
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.country ? { country: filters.country.toUpperCase() } : {}),
      ...(filters.search
        ? {
            OR: [
              { domain: { contains: filters.search, mode: 'insensitive' as const } },
              { name: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: 'asc' }, { domain: 'asc' }],
    include: {
      scans: {
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: { startedAt: true, score: true, status: true },
      },
      _count: { select: { scans: true, breaches: true, policies: true } },
    },
  });

  // Distinct countries for filter
  const countriesRaw = await prisma.complianceSite.findMany({
    where: { workspaceId: { in: workspaceIds } },
    select: { country: true },
    distinct: ['country'],
  });
  const countries = countriesRaw.map((c) => c.country).sort();

  return {
    workspaces,
    sites: sites.map((s) => ({
      id: s.id,
      domain: s.domain,
      name: s.name,
      country: s.country,
      language: s.language,
      status: s.status,
      complianceScore: s.complianceScore,
      lastScanAt: s.lastScanAt?.toISOString() ?? null,
      nextScanAt: s.nextScanAt?.toISOString() ?? null,
      scanInterval: s.scanInterval,
      scanCount: s._count.scans,
      breachCount: s._count.breaches,
      policyCount: s._count.policies,
      latestScan: s.scans[0]
        ? {
            score: s.scans[0].score,
            status: s.scans[0].status,
            startedAt: s.scans[0].startedAt.toISOString(),
          }
        : null,
    })),
    countries,
  };
}

function StatusBadge({ status }: { status: string }) {
  const meta: Record<string, { label: string; className: string }> = {
    compliant: {
      label: 'Uyumlu',
      className:
        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    },
    warning: {
      label: 'Uyarı',
      className:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    },
    critical: {
      label: 'Kritik',
      className:
        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    },
    scanning: {
      label: 'Taranıyor',
      className:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    pending: {
      label: 'Beklemede',
      className:
        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
  };
  const m = meta[status] ?? meta.pending;
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.className}`}>
      {m.label}
    </span>
  );
}

function ScoreCell({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={`text-lg font-bold tabular-nums ${
        score >= 80
          ? 'text-green-600'
          : score >= 50
          ? 'text-yellow-600'
          : 'text-red-600'
      }`}
    >
      {score}
    </span>
  );
}

export default async function ComplianceSitesPage({
  searchParams,
}: ComplianceSitesPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/compliance/sites');
  const userId = (session.user as any).id as string;

  const data = await getSitesData(userId, searchParams);

  if (data.workspaces.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <FaShieldAlt className="text-blue-500" />
              Uyumluluk Siteleri
            </span>
          }
        />
        <div className="admin-card text-center py-10 text-muted-foreground">
          Önce bir workspace oluşturmalısınız.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <FaShieldAlt className="text-blue-500" />
            Uyumluluk Siteleri
          </span>
        }
        description={`${data.sites.length} site · Workspace filtrelenmiş liste`}
        actions={<AddComplianceSiteDialog workspaces={data.workspaces} />}
      />

      {/* Filters */}
      <form className="admin-card flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Ara</label>
          <div className="relative">
            <FaSearch className="absolute left-2.5 top-2.5 w-3 h-3 text-muted-foreground" />
            <input
              name="search"
              defaultValue={searchParams.search ?? ''}
              placeholder="domain veya isim"
              className="admin-input pl-7 w-48"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Durum</label>
          <select
            name="status"
            defaultValue={searchParams.status ?? ''}
            className="admin-input"
          >
            <option value="">Tümü</option>
            <option value="pending">Beklemede</option>
            <option value="scanning">Taranıyor</option>
            <option value="compliant">Uyumlu</option>
            <option value="warning">Uyarı</option>
            <option value="critical">Kritik</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Ülke</label>
          <select
            name="country"
            defaultValue={searchParams.country ?? ''}
            className="admin-input"
          >
            <option value="">Tümü</option>
            {data.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="admin-btn admin-btn-primary">
          Filtrele
        </button>
        <Link
          href="/dashboard/compliance/sites"
          className="admin-btn text-sm"
        >
          Sıfırla
        </Link>
      </form>

      {/* Sites Table */}
      <div className="admin-card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th scope="col" className="text-left p-3 font-medium">Domain</th>
              <th scope="col" className="text-left p-3 font-medium">Durum</th>
              <th scope="col" className="text-left p-3 font-medium">Skor</th>
              <th scope="col" className="text-left p-3 font-medium">Son Tarama</th>
              <th scope="col" className="text-left p-3 font-medium">Sonraki</th>
              <th scope="col" className="text-left p-3 font-medium">Tehdit</th>
              <th scope="col" className="text-right p-3 font-medium">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {data.sites.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  <FaShieldAlt className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  Eşleşen site bulunamadı.
                </td>
              </tr>
            ) : (
              data.sites.map((site) => (
                <tr
                  key={site.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                >
                  <td className="p-3">
                    <Link
                      href={`/dashboard/compliance/sites/${site.id}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">{site.domain}</div>
                      <div className="text-xs text-muted-foreground">
                        {site.name} · {site.country}
                      </div>
                    </Link>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={site.status} />
                  </td>
                  <td className="p-3">
                    <ScoreCell score={site.complianceScore} />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {site.lastScanAt
                      ? new Date(site.lastScanAt).toLocaleString('tr-TR')
                      : '—'}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {site.nextScanAt
                      ? new Date(site.nextScanAt).toLocaleString('tr-TR')
                      : '—'}
                  </td>
                  <td className="p-3">
                    {site.breachCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600">
                        <FaExclamationTriangle className="w-3 h-3" />
                        {site.breachCount}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <FaCheckCircle className="w-3 h-3" />
                        0
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/dashboard/compliance/sites/${site.id}`}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:opacity-80"
                    >
                      <FaPlay className="w-2.5 h-2.5" />
                      Detay
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions Legend */}
      <div className="text-xs text-muted-foreground">
        <FaTrash className="inline w-3 h-3 mr-1" />
        Toplu aksiyonlar: site detay sayfasından scan başlatabilir, durum
        güncelleyebilir ve silebilirsiniz.
      </div>
    </div>
  );
}
