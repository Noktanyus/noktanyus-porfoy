/**
 * Dashboard — Yeni Monitör
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NewMonitorForm } from '@/components/dashboard/NewMonitorForm';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const dynamic = 'force-dynamic';

export default async function NewMonitorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as any).id;
  const channels = await prisma.alertChannel.findMany({
    where: { userId, active: true },
    select: { id: true, name: true, type: true },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Yeni Monitör"
        description="Bir URL/host izlemeye başlayın"
        backHref="/dashboard/monitors"
        backLabel="Tüm Monitörler"
      />
      <NewMonitorForm alertChannels={channels} />
    </div>
  );
}
