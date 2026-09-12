/**
 * Compliance Incidents — Veri ihlali olayları listesi.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BreachIncidentForm } from '@/components/compliance/BreachIncidentForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  FaExclamationTriangle,
  FaShieldAlt,
  FaCheckCircle,
  FaPlus,
  FaClock,
} from 'react-icons/fa';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { new?: string };
}

async function getIncidentsData(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: {
      workspaceId: true,
      workspace: { select: { id: true, name: true } },
    },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);
  if (workspaceIds.length === 0) {
    return {
      workspaces: [],
      sites: [],
      incidents: [],
      stats: { open: 0, resolved: 0, critical: 0 },
    };
  }

  const incidents = await prisma.dataBreachIncident.findMany({
    where: { workspaceId: { in: workspaceIds } },
    orderBy: { detectedAt: 'desc' },
    include: {
      site: { select: { domain: true, name: true } },
    },
  });

  const sites = await prisma.complianceSite.findMany({
    where: { workspaceId: { in: workspaceIds } },
    select: { id: true, domain: true, name: true },
    orderBy: { domain: 'asc' },
  });

  const open = incidents.filter((i) => !i.resolvedAt).length;
  const resolved = incidents.filter((i) => i.resolvedAt).length;
  const critical = incidents.filter(
    (i) => i.severity === 'CRITICAL' && !i.resolvedAt
  ).length;

  return {
    workspaces: memberships
      .map((m) => m.workspace)
      .filter((w): w is { id: string; name: string } => Boolean(w)),
    sites,
    incidents: incidents.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      severity: i.severity,
      detectedAt: i.detectedAt.toISOString(),
      reportedAt: i.reportedAt?.toISOString() ?? null,
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
      notifyKvkk: i.notifyKvkk,
      affectedUsers: i.affectedUsers,
      dataCategories: i.dataCategories,
      siteName: i.site?.name ?? null,
      siteDomain: i.site?.domain ?? null,
    })),
    stats: { open, resolved, critical },
  };
}

const SEVERITY_META: Record<
  string,
  { label: string; className: string }
> = {
  CRITICAL: {
    label: 'Kritik',
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700',
  },
  HIGH: {
    label: 'Yüksek',
    className:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  },
  MEDIUM: {
    label: 'Orta',
    className:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  },
  LOW: {
    label: 'Düşük',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  },
};

export default async function ComplianceIncidentsPage({
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    redirect('/giris?callbackUrl=/dashboard/compliance/incidents');
  const userId = (session.user as any).id as string;

  const data = await getIncidentsData(userId);

  if (data.workspaces.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <FaExclamationTriangle className="text-red-500" />
              Veri İhlalleri
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
            <FaExclamationTriangle className="text-red-500" />
            Veri İhlalleri
          </span>
        }
        description="KVKK Madde 12 — 72 saat içinde bildirim zorunluluğu"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="admin-card">
          <FaClock className="w-5 h-5 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold">{data.stats.open}</p>
          <p className="text-xs text-muted-foreground">Açık Olay</p>
        </div>
        <div className="admin-card">
          <FaCheckCircle className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{data.stats.resolved}</p>
          <p className="text-xs text-muted-foreground">Çözülmüş</p>
        </div>
        <div className="admin-card">
          <FaExclamationTriangle className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold">{data.stats.critical}</p>
          <p className="text-xs text-muted-foreground">Açık Kritik</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents List */}
        <div className="lg:col-span-2">
          {data.incidents.length === 0 ? (
            <div className="admin-card text-center py-12">
              <FaShieldAlt className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">İhlal kaydı yok</p>
              <p className="text-sm text-muted-foreground mt-2">
                Harika! Şu anda açık veya geçmiş veri ihlali bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.incidents.map((inc) => {
                const meta = SEVERITY_META[inc.severity] ?? SEVERITY_META.MEDIUM;
                const cats = (inc.dataCategories as string[] | null) ?? [];
                return (
                  <div
                    key={inc.id}
                    className={`admin-card border-l-4 ${meta.className.split(' ').slice(-1)[0]}`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.className.split(' ').slice(0, 2).join(' ')}`}
                          >
                            {meta.label}
                          </span>
                          {inc.notifyKvkk ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <FaCheckCircle className="w-3 h-3" />
                              KVKK'ya bildirildi
                            </span>
                          ) : (
                            <span className="text-xs text-yellow-600">
                              KVKK bildirimi bekliyor
                            </span>
                          )}
                          {inc.resolvedAt ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <FaCheckCircle className="w-3 h-3" />
                              Çözüldü
                            </span>
                          ) : (
                            <span className="text-xs text-orange-600">
                              Açık
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold mt-1">{inc.title}</h3>
                        {inc.siteName && (
                          <Link
                            href={`/dashboard/compliance/sites/${
                              data.sites.find((s) => s.name === inc.siteName)?.id ?? ''
                            }`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {inc.siteName} ({inc.siteDomain})
                          </Link>
                        )}
                        <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                          {inc.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                          <span className="text-muted-foreground">
                            Tespit: {new Date(inc.detectedAt).toLocaleString('tr-TR')}
                          </span>
                          {inc.affectedUsers != null && (
                            <span className="text-red-600">
                              · {inc.affectedUsers} kullanıcı etkilendi
                            </span>
                          )}
                        </div>
                        {cats.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {cats.map((c) => (
                              <span
                                key={c}
                                className="text-xs px-2 py-0.5 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Report Form */}
        <div>
          {searchParams.new ? (
            <BreachIncidentForm
              workspaceId={data.workspaces[0].id}
              sites={data.sites}
            />
          ) : (
            <div className="admin-card text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Yeni ihlal mi tespit ettiniz?
              </p>
              <Link
                href="/dashboard/compliance/incidents?new=1"
                className="admin-btn admin-btn-primary w-full"
              >
                <FaPlus className="w-3 h-3" />
                İhlal Bildir
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
