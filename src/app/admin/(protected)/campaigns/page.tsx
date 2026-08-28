/**
 * Admin Campaigns Page
 *
 * Tum email campaign'lerini istatistiklerle listeler.
 * Yeni campaign olusturma CampaignList client component'inde inline.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailCampaignRepository } from '@/modules/email-marketing/repository';
import { CampaignList } from '@/components/admin/CampaignList';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/admin/login');

  const campaigns = await emailCampaignRepository.findWithStats();

  return <CampaignList campaigns={campaigns as any} />;
}