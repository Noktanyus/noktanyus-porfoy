/**
 * Dashboard — Alert Kanalları Yönetimi
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AlertChannelsClient } from '@/components/dashboard/AlertChannelsClient';
import { monitoringService } from '@/modules/monitoring';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const dynamic = 'force-dynamic';

export default async function AlertChannelsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as any).id;
  const channels = await monitoringService.listAlertChannels(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert Kanalları"
        description="Monitör olayları için bildirim kanallarını yönetin"
      />
      <AlertChannelsClient initialChannels={channels as any} />
    </div>
  );
}
