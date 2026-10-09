/**
 * Dashboard — Alert kanalları
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AlertChannelsClient } from '@/components/dashboard/AlertChannelsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AlertChannelsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/alert-channels');

  const userId = (session.user as { id: string }).id;
  const channels = await prisma.alertChannel.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const initial = channels.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type as 'EMAIL' | 'WEBHOOK' | 'SLACK' | 'DISCORD' | 'TELEGRAM',
    config: (c.config as Record<string, unknown>) ?? {},
    events: Array.isArray(c.events) ? (c.events as string[]) : [],
    active: c.active,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert kanalları"
        description="Monitör down/up bildirimleri için e-posta, Slack, Discord veya Telegram"
      />
      <AlertChannelsClient initialChannels={initial} />
    </div>
  );
}
