/**
 * Dashboard — Kullanıcının sipariş geçmişi.
 * Auth zorunlu, oturum yoksa /giris'e yönlendir.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrdersList } from '@/components/dashboard/OrdersList';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Siparişler | Dashboard' };

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as { id: string }).id;

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Siparişler"
        description="Tüm siparişlerin ve ödeme durumların"
        actions={
          <a
            href="/magaza"
            className="admin-btn admin-btn-primary self-start sm:self-auto"
          >
            Mağazaya Git
          </a>
        }
      />
      <OrdersList orders={orders} />
    </div>
  );
}
