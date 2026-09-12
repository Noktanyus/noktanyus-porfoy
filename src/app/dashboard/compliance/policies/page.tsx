/**
 * Compliance Policies — Tüm policy'ler (site bazlı gruplu).
 *
 * Version karşılaştırma, approve/publish aksiyonları.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  FaShieldAlt,
  FaCheckCircle,
  FaCheck,
  FaRocket,
  FaFileContract,
  FaHistory,
} from 'react-icons/fa';
import { PoliciesActions } from '@/components/compliance/PoliciesActions';

export const dynamic = 'force-dynamic';

async function getPoliciesData(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);
  if (workspaceIds.length === 0) return { grouped: [] };

  const sites = await prisma.complianceSite.findMany({
    where: { workspaceId: { in: workspaceIds } },
    orderBy: { domain: 'asc' },
    include: {
      policies: {
        orderBy: { version: 'desc' },
      },
    },
  });

  return {
    grouped: sites
      .filter((s) => s.policies.length > 0)
      .map((s) => ({
        siteId: s.id,
        siteName: s.name,
        siteDomain: s.domain,
        policies: s.policies.map((p) => ({
          id: p.id,
          version: p.version,
          title: p.title,
          jurisdiction: p.jurisdiction,
          generatedBy: p.generatedBy,
          approvedAt: p.approvedAt?.toISOString() ?? null,
          publishedAt: p.publishedAt?.toISOString() ?? null,
          publishedUrl: p.publishedUrl,
          createdAt: p.createdAt.toISOString(),
        })),
      })),
  };
}

export default async function CompliancePoliciesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/compliance/policies');
  const userId = (session.user as any).id as string;

  const data = await getPoliciesData(userId);

  const totalPolicies = data.grouped.reduce((sum, g) => sum + g.policies.length, 0);
  const totalPublished = data.grouped.reduce(
    (sum, g) => sum + g.policies.filter((p) => p.publishedAt).length,
    0
  );
  const totalApproved = data.grouped.reduce(
    (sum, g) => sum + g.policies.filter((p) => p.approvedAt && !p.publishedAt).length,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <FaFileContract className="text-purple-500" />
            Privacy Policies
          </span>
        }
        description={`${totalPolicies} policy · ${totalPublished} yayında · ${totalApproved} onaylı`}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="admin-card">
          <FaFileContract className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{totalPolicies}</p>
          <p className="text-xs text-muted-foreground">Toplam Versiyon</p>
        </div>
        <div className="admin-card">
          <FaCheckCircle className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{totalPublished}</p>
          <p className="text-xs text-muted-foreground">Yayında</p>
        </div>
        <div className="admin-card">
          <FaCheck className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{totalApproved}</p>
          <p className="text-xs text-muted-foreground">Onaylı (taslak)</p>
        </div>
      </div>

      {data.grouped.length === 0 ? (
        <div className="admin-card text-center py-12">
          <FaFileContract className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium">Henüz policy oluşturulmadı</p>
          <p className="text-sm text-muted-foreground mt-2">
            Bir site için policy üretmek için site detayına gidin.
          </p>
          <Link
            href="/dashboard/compliance/sites"
            className="admin-btn admin-btn-primary mt-4 inline-flex"
          >
            Siteleri Gör
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {data.grouped.map((group) => (
            <section key={group.siteId} className="admin-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    <FaShieldAlt className="text-blue-500 w-4 h-4" />
                    {group.siteName}
                  </h2>
                  <p className="text-xs text-muted-foreground">{group.siteDomain}</p>
                </div>
                <Link
                  href={`/dashboard/compliance/sites/${group.siteId}?tab=policies`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Site Detayı →
                </Link>
              </div>

              {/* Version karşılaştırma - yan yana */}
              <div className="space-y-3">
                {group.policies.map((p, idx) => {
                  const prev = group.policies[idx + 1];
                  return (
                    <div
                      key={p.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">v{p.version}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                              {p.jurisdiction}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {p.generatedBy === 'ai' ? 'AI' : 'Manuel'}
                            </span>
                            {p.publishedAt ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <FaCheckCircle className="w-3 h-3" />
                                Yayında
                              </span>
                            ) : p.approvedAt ? (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                <FaCheck className="w-3 h-3" />
                                Onaylı
                              </span>
                            ) : (
                              <span className="text-xs text-yellow-600">Taslak</span>
                            )}
                          </div>
                          <p className="text-sm mt-1 truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(p.createdAt).toLocaleDateString('tr-TR')}
                            {prev && (
                              <span className="ml-2 italic">
                                <FaHistory className="inline w-3 h-3" /> Önceki: v
                                {prev.version}
                              </span>
                            )}
                          </p>
                        </div>
                        <PoliciesActions
                          policy={{
                            id: p.id,
                            approvedAt: p.approvedAt,
                            publishedAt: p.publishedAt,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
