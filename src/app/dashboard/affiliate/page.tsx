/**
 * Affiliate Dashboard Page
 *
 * Phase "Video Calls + Affiliate" kapsaminda eklendi.
 * Kullanicinin affiliate istatistiklerini, referral linkini ve
 * payout bilgilerini gosterir.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { affiliateService } from '@/modules/affiliate';
import { AffiliateDashboard } from '@/components/dashboard/AffiliateDashboard';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const dynamic = 'force-dynamic';

export default async function AffiliatePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/giris');
  }
  const userId = (session.user as any).id;
  if (!userId) {
    redirect('/giris');
  }

  const stats = await affiliateService.getStats(userId);
  const commissions = await affiliateService.listCommissions(userId, 20);

  const sessionEmail = session.user.email ?? '';
  const referralCode = stats.referralCode ?? sessionEmail;
  const referralLink = `${process.env.NEXTAUTH_URL ?? 'https://noktanyus.com'}?ref=${referralCode}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate Programı"
        description={
          <>
            Davet et, kazanç elde et. Komisyon oranın:{' '}
            <strong>%{stats.percent}</strong>
          </>
        }
      />
      <AffiliateDashboard
        stats={stats}
        referralCode={referralCode}
        referralLink={referralLink}
        commissions={commissions.map((c) => ({
          id: c.id,
          status: c.status,
          commissionCents: c.commissionCents,
          commissionPercent: c.commissionPercent,
          orderAmountCents: c.orderAmountCents,
          createdAt: c.createdAt.toISOString(),
          referred: c.referred
            ? { name: c.referred.name ?? null, email: c.referred.email }
            : null,
          order: c.order
            ? { orderNumber: c.order.orderNumber }
            : null,
        }))}
      />
    </div>
  );
}
