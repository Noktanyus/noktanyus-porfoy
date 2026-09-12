/**
 * Admin Campaigns Page
 *
 * Tum email campaign'lerini istatistiklerle listeler.
 * Yeni campaign olusturma CampaignList client component'inde inline.
 *
 * Faz D: `campaigns as any` cast'i kaldirildi. Prisma `Date` alanlari client
 * component'e gecmeden once ISO string'e cevrilir (Next.js server→client
 * serialization sinirinda tip guvenligi).
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailCampaignRepository } from '@/modules/email-marketing/repository';
import { CampaignList, type CampaignRow } from '@/components/admin/CampaignList';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');

  const campaigns = await emailCampaignRepository.findWithStats();

  // Date -> ISO string: client component'e serialize edilebilir veri
  const rows: CampaignRow[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    campaignType: c.campaignType,
    status: c.status,
    subject: c.subject,
    totalSent: c.totalSent,
    totalOpened: c.totalOpened,
    totalClicked: c.totalClicked,
    scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    _count: { executions: c._count.executions },
  }));

  return <CampaignList campaigns={rows} />;
}
