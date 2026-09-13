/**
 * Dashboard Layout — satış sonrası hesap alanı.
 * Siparişler, ürünler, API anahtarları, faturalandırma.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { shouldRedirectSyntheticAdminFromDashboard } from '@/lib/appRole';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/giris');
  }
  // Env ile giren sentetik admin'in müşteri hesabı yoktur.
  // Hesap bazlı admin'ler dashboard'u da kullanır (header'dan Yönetim).
  if (shouldRedirectSyntheticAdminFromDashboard(session.user.id)) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-blob-decoration">
      <div className="container-responsive py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-6">
          <DashboardSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
      <OnboardingFlow />
    </div>
  );
}
