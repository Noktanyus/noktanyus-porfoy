/**
 * Dashboard — Monitör detay
 */

import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MonitorDetailClient } from '@/components/dashboard/MonitorDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MonitorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/giris?callbackUrl=/dashboard/monitors/${params.id}`);

  const userId = (session.user as { id: string }).id;
  const monitor = await prisma.monitor.findFirst({
    where: { id: params.id, userId },
    include: {
      checks: { orderBy: { timestamp: 'desc' }, take: 48 },
      incidents: { orderBy: { startedAt: 'desc' }, take: 20 },
    },
  });

  if (!monitor) notFound();

  const { checks, incidents, ...rest } = monitor;

  return (
    <MonitorDetailClient
      monitor={rest}
      checks={checks}
      incidents={incidents}
    />
  );
}
