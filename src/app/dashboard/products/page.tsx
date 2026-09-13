/**
 * Dashboard — Satın alınan dijital ürünler ve lisanslar.
 * Kullanıcı ürün yayınlayamaz; yalnızca admin mağazaya ürün ekler.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { FaStore } from 'react-icons/fa';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProductList } from '@/components/dashboard/ProductList';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Satın Aldıklarım | Dashboard' };

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as { id: string }).id;
  const email = session.user.email?.trim().toLowerCase() ?? null;

  const customer = email
    ? await prisma.customer.findFirst({
        where: { OR: [{ userId }, { email }] },
        select: { id: true },
      })
    : await prisma.customer.findFirst({
        where: { userId },
        select: { id: true },
      });

  const orderWhere = {
    OR: [
      { userId },
      ...(email ? [{ customerEmail: email }] : []),
      ...(customer ? [{ customerId: customer.id }] : []),
    ],
  };
  const licenseWhere = {
    OR: [
      { userId },
      ...(customer ? [{ customerId: customer.id }] : []),
    ],
  };

  const [orders, licenses] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.license.findMany({
      where: licenseWhere,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Satın Aldıklarım"
        description="Satın aldığınız sanal ürünler ve lisans anahtarlarınız"
        actions={
          <Link href="/magaza" className="admin-btn admin-btn-primary inline-flex items-center gap-2">
            <FaStore className="w-3 h-3" aria-hidden="true" />
            Mağazaya Git
          </Link>
        }
      />
      <ProductList orders={orders} licenses={licenses} />
    </div>
  );
}
