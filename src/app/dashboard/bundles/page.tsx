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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bundle Ürünlerim</h1>
          <p className="text-sm text-muted-foreground">
            Birden fazla dijital ürünü paketleyip indirimli satışa sunun
          </p>
        </div>
        <Link
          href="/dashboard/bundles/new"
          className="admin-btn admin-btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <FaPlus className="w-3 h-3" />
          Yeni Bundle
        </Link>
      </div>
      <BundleList bundles={bundles as any} />
    </div>
  );
}
