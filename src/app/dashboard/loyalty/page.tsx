/**
 * Loyalty Dashboard Page
 *
 * Phase: Loyalty Program
 * Kullanicinin puan, tier ve odul islemlerini yonetir.
 * Auth-protected server component.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loyaltyService } from '@/modules/loyalty';
import { LoyaltyDashboard } from '@/components/dashboard/LoyaltyDashboard';

export const dynamic = 'force-dynamic';

export default async function LoyaltyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/giris');
  }
  const userId = (session.user as any).id;
  if (!userId) {
    redirect('/giris');
  }

  const stats = await loyaltyService.getStats(userId);

  return <LoyaltyDashboard stats={stats} />;
}