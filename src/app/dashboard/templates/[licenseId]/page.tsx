/**
 * @file Dashboard — Tek Template Lisans Detay Sayfası
 * @description Phase 3 B.3: Belirli bir template lisansının detayları.
 *
 *              - Lisans bilgileri (key, type, status, expires)
 *              - Template detayları (preview, features, techStack)
 *              - Kurulumlar (TemplateInstallation listesi)
 *              - "Şimdi Kur" formu (subdomain + primaryColor config)
 *              - "Lisansı İptal Et" admin-only butonu (support note)
 *              - Download link (template.demoUrl veya github repo)
 *
 * Authz:
 *   - License.workspaceId kullanıcının workspace'i olmalı (owner veya member)
 *   - License.buyerEmail kullanıcının email'i ile eşleşmeli (workspace bağlı değilse)
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { FaArrowLeft, FaKey, FaCopy } from 'react-icons/fa';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { InstallTemplateForm } from '@/components/dashboard/InstallTemplateForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { licenseId: string } }): Promise<Metadata> {
  return {
    title: 'Lisans Detayı | Dashboard',
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active: {
    label: 'Aktif',
    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  expired: {
    label: 'Süresi Dolmuş',
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  revoked: {
    label: 'İptal',
    cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

const LICENSE_TYPE_LABEL: Record<string, string> = {
  single: 'Single Domain',
  'white-label': 'White-Label + Custom Domain',
  agency: 'Agency (Multi-Client)',
};

export default async function LicenseDetailPage({
  params,
}: {
  params: { licenseId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as { id: string }).id;
  const userEmail = session.user.email ?? '';
  const isAdmin = (session.user as { role?: string }).role === 'admin';

  // 1. Lisansi getir
  const license = await prisma.templateLicense.findUnique({
    where: { id: params.licenseId },
    include: {
      template: true,
      workspace: { select: { id: true, name: true, ownerId: true } },
      installations: {
        orderBy: { startedAt: 'desc' },
        include: {
          workspace: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!license) notFound();

  // 2. Authz — kullanici ya workspace uyesi olmali, ya da buyerEmail eslesmeli,
  //    ya da admin olmali
  const workspaceMembership = license.workspaceId
    ? await prisma.workspaceMember.findFirst({
        where: { workspaceId: license.workspaceId, userId },
        select: { role: true },
      })
    : null;
  const isWorkspaceOwner = license.workspace?.ownerId === userId;
  const ownsByEmail = license.buyerEmail === userEmail;

  const hasAccess =
    isAdmin || isWorkspaceOwner || !!workspaceMembership || ownsByEmail;

  if (!hasAccess) {
    redirect('/dashboard/templates');
  }

  // 3. Kullanici icin uygun workspace'ler (sadece OWNER/ADMIN olanlar kurabilir)
  const userWorkspaces = await prisma.workspace.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true, name: true, slug: true, ownerId: true },
    orderBy: { createdAt: 'desc' },
  });

  // Kurulum yetkisi olan workspace'ler
  const installableWorkspaces = userWorkspaces.filter(
    (w) => w.ownerId === userId || isAdmin
  );

  const badge = STATUS_BADGE[license.status] ?? STATUS_BADGE.expired;
  const expiresAt = license.expiresAt ? new Date(license.expiresAt) : null;
  const isExpired = expiresAt && expiresAt.getTime() < Date.now();
  const canInstall = license.status === 'active' && !isExpired;

  const previewImages = asStringArray(license.template.previewImages);
  const features = asStringArray(license.template.features);
  const techStack = asStringArray(license.template.techStack);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/templates"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <FaArrowLeft className="w-3 h-3" />
        Lisanslarıma dön
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{license.template.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {license.template.tagline}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOL: Lisans detay + template */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lisans bilgi kartı */}
          <div className="glass-card-premium p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaKey className="w-4 h-4 text-brand-primary" />
              Lisans Bilgileri
            </h2>
            <div>
              <label className="text-xs text-muted-foreground">Lisans Anahtarı</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded break-all">
                  {license.licenseKey}
                </code>
                <CopyButton text={license.licenseKey} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Tip</label>
                <p className="font-medium mt-1 text-sm">
                  {LICENSE_TYPE_LABEL[license.type] ?? license.type}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Versiyon</label>
                <p className="font-medium mt-1 text-sm">v{license.template.version}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Satın Alma</label>
                <p className="font-medium mt-1 text-sm">
                  {new Date(license.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bitiş</label>
                <p className="font-medium mt-1 text-sm">
                  {expiresAt
                    ? expiresAt.toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Süresiz'}
                </p>
              </div>
              {license.workspace && (
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Workspace</label>
                  <p className="font-medium mt-1 text-sm">
                    {license.workspace.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Template önizleme */}
          <div className="glass-card-premium overflow-hidden">
            {previewImages[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImages[0]}
                alt={license.template.name}
                className="w-full aspect-video object-cover"
              />
            )}
            <div className="p-6 space-y-4">
              <h3 className="text-base font-semibold">{license.template.name}</h3>
              <p className="text-sm text-muted-foreground">
                {license.template.description}
              </p>
              {features.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Özellikler
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-brand-primary mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {techStack.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Teknoloji Yığını
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {techStack.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kurulumlar */}
          <div className="glass-card-premium p-6">
            <h2 className="text-lg font-semibold mb-4">Kurulumlar ({license.installations.length})</h2>
            {license.installations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Henüz kurulum yapılmamış. Aşağıdaki form ile workspace'inize kurabilirsiniz.
              </p>
            ) : (
              <div className="space-y-3">
                {license.installations.map((install) => {
                  const installStatusBadge: Record<string, string> = {
                    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    cloning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    ready: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  };
                  const badgeCls =
                    installStatusBadge[install.status] ?? installStatusBadge.pending;
                  return (
                    <div
                      key={install.id}
                      className="flex items-center justify-between gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {install.workspace?.name ?? 'Workspace'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(install.startedAt).toLocaleString('tr-TR')}
                        </p>
                        {install.deployedUrl && (
                          <a
                            href={install.deployedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-primary hover:underline mt-1 inline-block"
                          >
                            {install.deployedUrl}
                          </a>
                        )}
                        {install.errorMessage && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Hata: {install.errorMessage}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${badgeCls}`}
                      >
                        {install.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SAĞ: Install form + actions */}
        <div className="space-y-6">
          {canInstall && installableWorkspaces.length > 0 && (
            <InstallTemplateForm
              licenseKey={license.licenseKey}
              templateSlug={license.template.slug}
              templateName={license.template.name}
              workspaces={installableWorkspaces.map((w) => ({
                id: w.id,
                name: w.name,
                slug: w.slug,
              }))}
              alreadyLinkedWorkspaceId={license.workspaceId ?? undefined}
            />
          )}

          {canInstall && installableWorkspaces.length === 0 && (
            <div className="glass-card-premium p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Kurulum için bir workspace'e sahip olmalısın.{' '}
                <Link
                  href="/dashboard/workspaces"
                  className="text-brand-primary hover:underline font-medium"
                >
                  Workspace oluştur
                </Link>
              </p>
            </div>
          )}

          {/* Download / repo */}
          {license.template.demoUrl && (
            <div className="glass-card-premium p-6 space-y-3">
              <h3 className="text-sm font-semibold">İndir / Demo</h3>
              <a
                href={license.template.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition"
              >
                Demo'yu Aç
              </a>
              <p className="text-xs text-muted-foreground">
                Template kaynak kodu lisans tipine göre repo veya zip olarak sağlanır.
              </p>
            </div>
          )}

          {/* Admin-only revoke */}
          {isAdmin && license.status === 'active' && (
            <div className="glass-card-premium p-6 border-red-200 dark:border-red-900/40 space-y-3">
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                Admin İşlemleri
              </h3>
              <p className="text-xs text-muted-foreground">
                Lisansı iptal etmek destek ekibi tarafından yapılır.
              </p>
              <Link
                href={`/admin/audit?resource=TemplateLicense&resourceId=${license.id}`}
                className="block w-full text-center px-4 py-2 rounded-lg border border-red-300 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition"
              >
                Audit Kaydı Aç
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =================== CLIENT COMPONENT (copy button) ===================

function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
      }}
      className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
      aria-label="Lisans anahtarını kopyala"
      title="Kopyala"
    >
      <FaCopy className="w-3 h-3" />
    </button>
  );
}
