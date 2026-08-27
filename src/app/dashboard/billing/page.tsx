/**
 * @file Dashboard — Faturalandırma
 * @description Abonelik, siparişler ve lisansları yönet.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BillingOverview } from '@/components/dashboard/BillingOverview';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Faturalandırma | Dashboard',
  description: 'Abonelik, siparişler ve lisanslarını yönet',
};

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/billing');

  const userId = (session.user as { id: string }).id;
  const userEmail = session.user.email ?? '';

  const [subscription, orders, licenses, plans] = await Promise.all([
    prisma.userSubscription.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.license.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.plan.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Faturalandırma</h1>
        <p className="text-sm text-muted-foreground">Abonelik ve siparişlerin</p>
      </div>
      <BillingOverview
        subscription={subscription}
        orders={orders}
        licenses={licenses}
        plans={plans}
        userEmail={userEmail}
      />
    </div>
  );
}