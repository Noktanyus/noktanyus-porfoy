/**
 * Dashboard — Public status page yönetimi
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatusPagesClient } from '@/components/dashboard/StatusPagesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StatusPagesDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/status-pages');

  const userId = (session.user as { id: string }).id;
  const [pages, monitors] = await Promise.all([
    prisma.statusPage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.monitor.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const initialPages = pages.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    isPublic: p.isPublic,
    monitorIds: Array.isArray(p.monitorIds) ? (p.monitorIds as string[]) : [],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Status pages"
        description="Public uptime sayfaları — /status/[slug]"
      />
      <StatusPagesClient initialPages={initialPages} monitors={monitors} />
    </div>
  );
}
