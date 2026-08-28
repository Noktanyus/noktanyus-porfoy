/**
 * Custom Reports Dashboard Page
 *
 * Phase: G3 Custom Report Builder
 * Auth-protected server component — kullanicinin raporlarini listeler
 * ve ReportBuilder client component'ini hydrate eder.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reportService } from '@/modules/reports';
import { ReportBuilder } from '@/components/dashboard/ReportBuilder';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/giris');
  }
  const userId = (session.user as any).id;
  if (!userId) {
    redirect('/giris');
  }

  const reports = await reportService.list(userId);
  return <ReportBuilder initialReports={reports as any} />;
}