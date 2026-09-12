/**
 * Dashboard — Kullanıcının oluşturduğu bundle ürünleri.
 * Auth zorunlu, oturum yoksa /giris'e yönlendir.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { FaPlus } from 'react-icons/fa';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BundleList } from '@/components/dashboard/BundleList';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const dynamic = 'force-dynamic';

export default async function BundlesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as { id: string }).id;

  const bundles = await prisma.bundle.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bundle Ürünlerim"
        description="Birden fazla dijital ürünü paketleyip indirimli satışa sunun"
        actions={
          <Link
            href="/dashboard/bundles/new"
            className="admin-btn admin-btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <FaPlus className="w-3 h-3" aria-hidden="true" />
            Yeni Bundle
          </Link>
        }
      />
      <BundleList bundles={bundles as any} />
    </div>
  );
}
