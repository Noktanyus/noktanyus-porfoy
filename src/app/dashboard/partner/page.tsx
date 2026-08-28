/**
 * Partner Dashboard Page
 *
 * Phase "Partner Program" kapsaminda eklendi.
 * Authenticated user kendi partner istatistiklerini goruntuler.
 *
 * Henuz partner kaydi yoksa onboarding formuna yonlendirir.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { partnerService } from '@/modules/partners';
import { PartnerDashboard } from '@/components/dashboard/PartnerDashboard';
import { PartnerOnboardingForm } from '@/components/dashboard/PartnerOnboardingForm';

export const dynamic = 'force-dynamic';

export default async function PartnerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/giris');
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    redirect('/giris');
  }

  const stats = await partnerService.getStats(userId);

  if (!stats) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-2 text-2xl font-bold">İş Ortağı Programı</h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Kendi landing sayfanızla lead toplayın, conversion başına %15 komisyon kazanın.
        </p>
        <PartnerOnboardingForm />
      </div>
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://noktanyus.com';
  const referralLink = `${baseUrl}/is-ortak/${stats.partner.slug}`;

  return (
    <div className="p-6">
      <PartnerDashboard stats={stats} referralLink={referralLink} />
    </div>
  );
}