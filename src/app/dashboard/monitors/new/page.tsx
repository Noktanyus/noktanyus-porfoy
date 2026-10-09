/**
 * Dashboard — Yeni monitör
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { NewMonitorForm } from '@/components/dashboard/NewMonitorForm';

export const dynamic = 'force-dynamic';

export default async function NewMonitorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/monitors/new');

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Yeni monitör"
        description="HTTPS / keyword / JSON path kontrolleri"
        backHref="/dashboard/monitors"
        backLabel="Monitörler"
        actions={
          <Link href="/dashboard/monitors" className="admin-btn admin-btn-secondary">
            İptal
          </Link>
        }
      />
      <NewMonitorForm />
    </div>
  );
}
