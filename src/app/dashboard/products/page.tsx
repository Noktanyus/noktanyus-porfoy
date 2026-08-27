/**
 * Dashboard — Kullanıcının satın aldığı dijital ürünler ve lisansları.
 * Auth zorunlu, oturum yoksa /giris'e yönlendir.
 *
 * - Orders: sipariş geçmişi (status, tutar, item detayları)
 * - Licenses: dijital ürün lisans anahtarları
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProductList } from '@/components/dashboard/ProductList';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Ürünlerim | Dashboard' };

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as { id: string }).id;

  const [orders, licenses] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.license.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ürünlerim</h1>
          <p className="text-sm text-muted-foreground">
            Satın aldığın dijital ürünler ve lisans anahtarların
          </p>
        </div>
        <a href="/magaza" className="admin-btn admin-btn-primary self-start sm:self-auto">
          Mağazaya Git
        </a>
      </div>
      <ProductList orders={orders} licenses={licenses} />
    </div>
  );
}