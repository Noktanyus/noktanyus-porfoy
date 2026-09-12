/**
 * @file Dashboard — Kullanıcının Template Lisansları
 * @description Phase 3 B.3: Kullanıcının workspace'lerine ait tüm template
 *              lisanslarını listeler.
 *
 *              - getServerSession ile auth kontrolu
 *              - Kullanicinin workspaceId'leri (owner + member) bulunur
 *              - prisma.templateLicense.findMany ile workspace + buyerEmail match
 *              - Bos durum: "Marketplace'i Kesfet" CTA
 *
 * Pattern: src/app/dashboard/products/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { FaStore, FaKey, FaCopy } from 'react-icons/fa';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TemplateLicensesClient } from '@/components/dashboard/TemplateLicensesClient';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Template Lisanslarım | Dashboard' };

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

const LICENSE_TYPE_LABEL: Record<string, string> = {
  single: 'Single',
  'white-label': 'White-Label',
  agency: 'Agency',
};

const CATEGORY_LABEL: Record<string, string> = {
  ecommerce: 'E-Ticaret',
  saas: 'SaaS',
  portfolio: 'Portfolyo',
  blog: 'Blog',
};

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

export default async function DashboardTemplatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as { id: string }).id;
  const userEmail = session.user.email ?? '';

  // 1. Kullanicinin uye oldugu workspace'ler (owner + member)
  const [ownedWorkspaces, memberRows] = await Promise.all([
    prisma.workspace.findMany({
      where: { ownerId: userId },
      select: { id: true },
    }),
    prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    }),
  ]);

  const workspaceIds = Array.from(
    new Set([
      ...ownedWorkspaces.map((w) => w.id),
      ...memberRows.map((m) => m.workspaceId),
    ])
  );

  // 2. Lisanslari workspace + buyerEmail uzerinden topla
  const licenses = await prisma.templateLicense.findMany({
    where: {
      OR: [
        ...(workspaceIds.length > 0 ? [{ workspaceId: { in: workspaceIds } }] : []),
        ...(userEmail ? [{ buyerEmail: userEmail }] : []),
      ],
    },
    include: {
      template: {
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          category: true,
          previewImages: true,
          version: true,
          demoUrl: true,
        },
      },
      workspace: { select: { id: true, name: true } },
      _count: { select: { installations: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Serialize for client component (Date → ISO string)
  const serialized = licenses.map((l) => ({
    id: l.id,
    licenseKey: l.licenseKey,
    type: l.type,
    status: l.status,
    expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
    purchasePriceCents: l.purchasePriceCents,
    currency: l.currency,
    buyerEmail: l.buyerEmail,
    workspaceName: l.workspace?.name ?? null,
    installationsCount: l._count.installations,
    template: {
      id: l.template.id,
      slug: l.template.slug,
      name: l.template.name,
      tagline: l.template.tagline,
      category: l.template.category,
      previewImage: asStringArray(l.template.previewImages)[0] ?? null,
      version: l.template.version,
      demoUrl: l.template.demoUrl,
    },
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <FaKey className="w-5 h-5 text-brand-primary" aria-hidden="true" />
            Template Lisanslarım
          </span>
        }
        description="Satın aldığın template lisansları ve kurulumlarını buradan yönet."
        actions={
          <Link
            href="/marketplace"
            className="admin-btn admin-btn-secondary inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <FaStore className="w-3 h-3" aria-hidden="true" />
            Marketplace'i Keşfet
          </Link>
        }
      />

      <TemplateLicensesClient
        licenses={serialized}
        licenseTypeLabels={LICENSE_TYPE_LABEL}
        categoryLabels={CATEGORY_LABEL}
        statusBadges={STATUS_BADGE}
      />

      <p className="text-xs text-muted-foreground text-center">
        <FaCopy className="inline w-3 h-3 mr-1" aria-hidden="true" />
        Lisans anahtarını kopyalamak için satırdaki butona tıkla.
      </p>
    </div>
  );
}
