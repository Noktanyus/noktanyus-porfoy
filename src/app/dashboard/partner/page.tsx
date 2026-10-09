/**
 * Dashboard — İş ortağı paneli
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PartnerDashboard } from '@/components/dashboard/PartnerDashboard';
import { PartnerApplyForm } from '@/components/dashboard/PartnerApplyForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PartnerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/partner');

  const userId = (session.user as { id: string }).id;
  const partner = await prisma.partner.findUnique({
    where: { userId },
    include: {
      leads: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!partner) {
    return (
      <div className="space-y-6 max-w-xl">
        <PageHeader
          title="İş ortağı ol"
          description="Referral ile komisyon kazan — başvuru sonrası doğrulama"
        />
        <PartnerApplyForm
          defaultEmail={session.user.email ?? ''}
          defaultName={session.user.name ?? ''}
        />
      </div>
    );
  }

  const leads = partner.leads;
  const counts = {
    total: leads.length,
    pending: leads.filter((l) => l.status === 'pending').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    converted: leads.filter((l) => l.status === 'converted').length,
    rejected: leads.filter((l) => l.status === 'rejected').length,
  };

  const revenue = leads.reduce(
    (acc, l) => ({
      totalCommissionCents: acc.totalCommissionCents + (l.commissionCents ?? 0),
      totalOrderCents: acc.totalOrderCents + (l.orderAmountCents ?? 0),
    }),
    { totalCommissionCents: 0, totalOrderCents: 0 }
  );

  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? 'https://noktanyus.com';
  const referralLink = `${base}/is-ortak/${partner.slug}`;

  const stats = {
    partner: {
      id: partner.id,
      companyName: partner.companyName,
      slug: partner.slug,
      commissionPercent: partner.commissionPercent,
      verified: partner.verified,
      active: partner.active,
      totalLeads: partner.totalLeads,
      totalConversions: partner.totalConversions,
      createdAt: partner.createdAt.toISOString(),
    },
    leads: counts,
    revenue,
    recentLeads: leads.map((l) => ({
      id: l.id,
      customerEmail: l.customerEmail,
      customerName: l.customerName,
      status: l.status,
      orderAmountCents: l.orderAmountCents,
      commissionCents: l.commissionCents,
      createdAt: l.createdAt.toISOString(),
      convertedAt: l.convertedAt ? l.convertedAt.toISOString() : null,
    })),
  };

  return (
    <div className="space-y-6">
      <PageHeader title="İş ortağı paneli" description={partner.companyName} />
      <PartnerDashboard stats={stats} referralLink={referralLink} />
    </div>
  );
}
