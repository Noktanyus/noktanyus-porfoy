/**
 * Dashboard Layout — kullanıcıya özel alan (monitörler, alert kanalları, vb.).
 * Auth zorunlu, oturum yoksa /giris'e yönlendir.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/giris');
  }
  // Admin kullanıcıyı admin panele yönlendir (karışmasın)
  const role = (session.user as any).role;
  if (role === 'admin') {
    redirect('/admin');
  }

  return (
    <main className="min-h-screen bg-blob-decoration">
      <div className="container-responsive py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-6">
          <DashboardSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
      <OnboardingFlow />
    </main>
  );
}
