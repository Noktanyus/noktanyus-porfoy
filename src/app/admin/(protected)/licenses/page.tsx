/**
 * @file Admin — Lisans Yönetimi Sayfası.
 * @description Masaüstü ve dijital yazılım lisanslarının listesi, süre uzatma,
 *              dondurma (askıya alma), iptal etme ve cihaz aktivasyon sıfırlama işlemleri.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { LicensesManager, type LicenseItem } from '@/components/admin/licenses/LicensesManager';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lisans Yönetimi | Admin',
  description: 'Masaüstü uygulaması ve dijital yazılım lisanslarının kontrolü.',
};

export default async function AdminLicensesPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return null;
  }

  const now = new Date();

  const [licensesRaw, allLicensesCounts, products] = await Promise.all([
    prisma.license.findMany({
      include: {
        customer: { select: { id: true, email: true, name: true } },
        product: { select: { id: true, title: true, slug: true, category: true } },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalCents: true,
            currency: true,
            createdAt: true,
          },
        },
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.license.findMany({
      select: {
        id: true,
        status: true,
        expiresAt: true,
      },
    }),
    prisma.digitalProduct.findMany({
      where: { active: true },
      select: { id: true, title: true, category: true },
      orderBy: { title: 'asc' },
    }),
  ]);

  let activeCount = 0;
  let expiredCount = 0;
  let suspendedCount = 0;
  let revokedCount = 0;

  for (const lic of allLicensesCounts) {
    if (lic.status === 'revoked') {
      revokedCount++;
    } else if (lic.status === 'suspended') {
      suspendedCount++;
    } else if (lic.expiresAt && lic.expiresAt <= now) {
      expiredCount++;
    } else {
      activeCount++;
    }
  }

  const stats = {
    total: allLicensesCounts.length,
    active: activeCount,
    expired: expiredCount,
    suspended: suspendedCount,
    revoked: revokedCount,
  };

  const licenses: LicenseItem[] = licensesRaw.map((lic) => ({
    ...lic,
    createdAt: lic.createdAt.toISOString(),
    updatedAt: lic.updatedAt.toISOString(),
    expiresAt: lic.expiresAt ? lic.expiresAt.toISOString() : null,
    revokedAt: lic.revokedAt ? lic.revokedAt.toISOString() : null,
    order: lic.order
      ? {
          ...lic.order,
          createdAt: lic.order.createdAt.toISOString(),
        }
      : null,
  }));

  return (
    <div className="admin-content-spacing space-y-6">
      <PageHeader
        title="Lisans Yönetimi"
        description="Masaüstü ve dijital yazılımlar için lisans sürelerini uzatın, askıya alın veya iptal edin."
        breadcrumb={<span>Admin / Lisanslar</span>}
      />

      <DashboardSection padding="md" contained>
        <LicensesManager
          initialLicenses={licenses}
          initialStats={stats}
          products={products}
        />
      </DashboardSection>
    </div>
  );
}
