/**
 * Compliance Site Detail — Tek site için detay sayfası.
 *
 * Tabs: Overview / Cookies / Scripts / Forms / Threats / Policies.
 * Butonlar: Start Scan, Download Report, Generate Policy.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ComplianceScoreCard } from '@/components/compliance/ComplianceScoreCard';
import { ThreatList } from '@/components/compliance/ThreatList';
import { ScanTimeline } from '@/components/compliance/ScanTimeline';
import { CookieTable } from '@/components/compliance/CookieTable';
import { PolicyGeneratorDialog } from '@/components/compliance/PolicyGeneratorDialog';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ComplianceSiteActions } from '@/components/compliance/ComplianceSiteActions';
import Link from 'next/link';
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaFileContract,
  FaCode,
  FaWpforms,
  FaCookie,
} from 'react-icons/fa';
import type {
  CookieRecord,
  TrackingScript,
  FormRecord,
  Threat,
} from '@/modules/compliance/schemas';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

async function getSiteData(userId: string, siteId: string) {
  // Authz — user must be workspace member
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const site = await prisma.complianceSite.findFirst({
    where: {
      id: siteId,
      workspaceId: { in: workspaceIds.length > 0 ? workspaceIds : [''] },
    },
    include: {
      scans: {
        orderBy: { startedAt: 'desc' },
        take: 50,
      },
      policies: {
        orderBy: { version: 'desc' },
        take: 10,
      },
      breaches: {
        orderBy: { detectedAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!site) return null;

  const latestScan = site.scans[0];

  return {
    site: {
      id: site.id,
      workspaceId: site.workspaceId,
      domain: site.domain,
      name: site.name,
      contactEmail: site.contactEmail,
      country: site.country,
      language: site.language,
      status: site.status,
      scanInterval: site.scanInterval,
      complianceScore: site.complianceScore,
      lastScanAt: site.lastScanAt?.toISOString() ?? null,
      nextScanAt: site.nextScanAt?.toISOString() ?? null,
      notes: site.notes,
      createdAt: site.createdAt.toISOString(),
    },
    latestScan: latestScan
      ? {
          id: latestScan.id,
          status: latestScan.status,
          score: latestScan.score,
          startedAt: latestScan.startedAt.toISOString(),
          completedAt: latestScan.completedAt?.toISOString() ?? null,
          pagesScanned: latestScan.pagesScanned,
          durationMs: latestScan.durationMs,
          cookies: (latestScan.cookies ?? []) as unknown as CookieRecord[],
          trackingScripts: (latestScan.trackingScripts ??
            []) as unknown as TrackingScript[],
          forms: (latestScan.forms ?? []) as unknown as FormRecord[],
          threats: (latestScan.threats ?? []) as unknown as Threat[],
        }
      : null,
    scans: site.scans.map((s) => ({
      id: s.id,
      status: s.status as 'running' | 'completed' | 'failed',
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
      score: s.score,
      pagesScanned: s.pagesScanned,
      durationMs: s.durationMs,
      errorMessage: s.errorMessage,
    })),
    policies: site.policies.map((p) => ({
      id: p.id,
      version: p.version,
      title: p.title,
      jurisdiction: p.jurisdiction,
      generatedBy: p.generatedBy,
      approvedAt: p.approvedAt?.toISOString() ?? null,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    breaches: site.breaches.map((b) => ({
      id: b.id,
      title: b.title,
      severity: b.severity,
      detectedAt: b.detectedAt.toISOString(),
      resolvedAt: b.resolvedAt?.toISOString() ?? null,
      affectedUsers: b.affectedUsers,
    })),
  };
}

const TABS = [
  { id: 'overview', label: 'Genel Bakış', icon: FaShieldAlt },
  { id: 'cookies', label: 'Çerezler', icon: FaCookie },
  { id: 'scripts', label: 'Scriptler', icon: FaCode },
  { id: 'forms', label: 'Formlar', icon: FaWpforms },
  { id: 'threats', label: 'Tehditler', icon: FaExclamationTriangle },
  { id: 'policies', label: 'Policies', icon: FaFileContract },
] as const;

export default async function ComplianceSiteDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    redirect(`/giris?callbackUrl=/dashboard/compliance/sites/${params.id}`);
  const userId = (session.user as any).id as string;

  const data = await getSiteData(userId, params.id);
  if (!data) notFound();

  const activeTab = searchParams.tab ?? 'overview';

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        backHref="/dashboard/compliance/sites"
        backLabel="Tüm siteler"
        title={
          <span className="flex items-center gap-2">
            <FaShieldAlt className="text-blue-500" />
            {data.site.name}
          </span>
        }
        description={`${data.site.domain} · ${data.site.country} · ${data.site.scanInterval} taramalar`}
        actions={
          <div className="flex gap-2 flex-wrap items-center">
            <ComplianceSiteActions
              siteId={data.site.id}
              workspaceId={data.site.workspaceId}
            />
            <PolicyGeneratorDialog
              site={{ id: data.site.id, domain: data.site.domain, name: data.site.name }}
            />
          </div>
        }
      />

      {/* Score */}
      <ComplianceScoreCard
        score={data.site.complianceScore}
        siteName={data.site.name}
        status={data.site.status}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Tabs">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <Link
                key={t.id}
                href={`/dashboard/compliance/sites/${data.site.id}?tab=${t.id}`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap inline-flex items-center gap-2 ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3 h-3" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">Tarama Geçmişi</h2>
              <ScanTimeline scans={data.scans} />
            </section>

            {data.latestScan && data.latestScan.threats.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">
                  Aktif Tehditler ({data.latestScan.threats.length})
                </h2>
                <ThreatList threats={data.latestScan.threats} />
              </section>
            )}
          </div>

          <div className="space-y-4">
            <div className="admin-card">
              <h3 className="font-semibold mb-3">Site Bilgileri</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Domain</dt>
                  <dd className="font-mono">{data.site.domain}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ülke</dt>
                  <dd>{data.site.country}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Dil</dt>
                  <dd>{data.site.language.toUpperCase()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tarama Sıklığı</dt>
                  <dd>{data.site.scanInterval}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">İletişim</dt>
                  <dd className="text-xs">{data.site.contactEmail}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sonraki Tarama</dt>
                  <dd className="text-xs">
                    {data.site.nextScanAt
                      ? new Date(data.site.nextScanAt).toLocaleString('tr-TR')
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="admin-card">
              <h3 className="font-semibold mb-3">Hızlı İstatistikler</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <FaCookie className="text-orange-500 w-3 h-3" />
                    Çerez
                  </span>
                  <span className="font-medium">
                    {data.latestScan?.cookies.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <FaCode className="text-blue-500 w-3 h-3" />
                    Script
                  </span>
                  <span className="font-medium">
                    {data.latestScan?.trackingScripts.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <FaWpforms className="text-purple-500 w-3 h-3" />
                    Form
                  </span>
                  <span className="font-medium">
                    {data.latestScan?.forms.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <FaExclamationTriangle className="text-red-500 w-3 h-3" />
                    Tehdit
                  </span>
                  <span className="font-medium">
                    {data.latestScan?.threats.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <FaFileContract className="text-green-500 w-3 h-3" />
                    Policy
                  </span>
                  <span className="font-medium">{data.policies.length}</span>
                </div>
              </div>
            </div>

            {data.breaches.length > 0 && (
              <div className="admin-card border-red-200 dark:border-red-800">
                <h3 className="font-semibold mb-3 flex items-center gap-1.5">
                  <FaExclamationTriangle className="text-red-500 w-4 h-4" />
                  Son İhlaller
                </h3>
                <ul className="space-y-2 text-xs">
                  {data.breaches.slice(0, 3).map((b) => (
                    <li
                      key={b.id}
                      className="border-l-2 border-red-400 pl-2 py-1"
                    >
                      <p className="font-medium">{b.title}</p>
                      <p className="text-muted-foreground">
                        {b.severity} ·{' '}
                        {new Date(b.detectedAt).toLocaleDateString('tr-TR')}
                        {b.affectedUsers && ` · ${b.affectedUsers} kullanıcı`}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'cookies' && (
        <CookieTable cookies={data.latestScan?.cookies ?? []} />
      )}

      {activeTab === 'scripts' && (
        <ScriptsTable scripts={data.latestScan?.trackingScripts ?? []} />
      )}

      {activeTab === 'forms' && (
        <FormsTable forms={data.latestScan?.forms ?? []} />
      )}

      {activeTab === 'threats' && (
        <ThreatList threats={data.latestScan?.threats ?? []} />
      )}

      {activeTab === 'policies' && (
        <PoliciesSection siteId={data.site.id} policies={data.policies} />
      )}
    </div>
  );
}

function ScriptsTable({ scripts }: { scripts: TrackingScript[] }) {
  if (scripts.length === 0) {
    return (
      <div className="admin-card text-center py-10 text-muted-foreground">
        <FaCode className="w-10 h-10 mx-auto mb-3 opacity-50" />
        Hiç script tespit edilmedi.
      </div>
    );
  }
  return (
    <div className="admin-card p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <th scope="col" className="text-left p-3 font-medium">URL</th>
            <th scope="col" className="text-left p-3 font-medium">Sağlayıcı</th>
            <th scope="col" className="text-left p-3 font-medium">Bilinen Tracker</th>
            <th scope="col" className="text-left p-3 font-medium">GDPR</th>
          </tr>
        </thead>
        <tbody>
          {scripts.map((s, i) => (
            <tr
              key={`${s.url}-${i}`}
              className="border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <td className="p-3 font-mono text-xs break-all max-w-xs">{s.url}</td>
              <td className="p-3 text-xs">{s.provider}</td>
              <td className="p-3 text-xs">{s.knownTracker ?? '—'}</td>
              <td className="p-3">
                {s.gdprCompliant ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <FaCheckCircle className="w-3 h-3" />
                    Uyumlu
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                    <FaExclamationTriangle className="w-3 h-3" />
                    Onay gerekli
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormsTable({ forms }: { forms: FormRecord[] }) {
  if (forms.length === 0) {
    return (
      <div className="admin-card text-center py-10 text-muted-foreground">
        <FaWpforms className="w-10 h-10 mx-auto mb-3 opacity-50" />
        Hiç form tespit edilmedi.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {forms.map((f, i) => (
        <div key={`${f.url}-${i}`} className="admin-card">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="font-mono text-xs break-all">{f.url}</p>
              <p className="text-xs text-muted-foreground">
                {f.method} · {f.fields.length} alan
              </p>
            </div>
            {f.consentRequired ? (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Onay mekanizması var
              </span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                Onay mekanizması YOK
              </span>
            )}
          </div>
          {f.fields.length > 0 && (
            <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
              <p className="text-xs font-medium mb-1">Alanlar:</p>
              <div className="flex flex-wrap gap-1.5">
                {f.fields.map((field, fi) => (
                  <span
                    key={`${field.name}-${fi}`}
                    className={`text-xs px-2 py-0.5 rounded ${
                      field.sensitive
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {field.name} ({field.type})
                    {field.required && ' *'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PoliciesSection({
  siteId,
  policies,
}: {
  siteId: string;
  policies: Array<{
    id: string;
    version: number;
    title: string;
    jurisdiction: string;
    generatedBy: string;
    approvedAt: string | null;
    publishedAt: string | null;
    createdAt: string;
  }>;
}) {
  if (policies.length === 0) {
    return (
      <div className="admin-card text-center py-10 text-muted-foreground">
        <FaFileContract className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p>Henüz policy oluşturulmadı.</p>
        <PolicyGeneratorDialog
          site={{ id: siteId, domain: '', name: '' }}
        />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {policies.map((p) => (
        <div key={p.id} className="admin-card flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">v{p.version}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                {p.jurisdiction}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {p.generatedBy}
              </span>
              {p.publishedAt ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <FaCheckCircle className="w-3 h-3" />
                  Yayında
                </span>
              ) : p.approvedAt ? (
                <span className="text-xs text-blue-600">Onaylı</span>
              ) : (
                <span className="text-xs text-yellow-600">Taslak</span>
              )}
            </div>
            <p className="text-sm mt-1">{p.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(p.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
          <Link
            href={`/dashboard/compliance/policies?policy=${p.id}`}
            className="admin-btn text-xs"
          >
            Yönet
          </Link>
        </div>
      ))}
    </div>
  );
}
