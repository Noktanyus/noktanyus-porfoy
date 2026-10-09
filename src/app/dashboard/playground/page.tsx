/**
 * Dashboard — API playground (kendi anahtarınla canlı deneme)
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ApiPlaygroundClient } from '@/components/dashboard/ApiPlaygroundClient';

export const dynamic = 'force-dynamic';

export default async function PlaygroundPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/playground');

  const userId = (session.user as { id: string }).id;
  const key = await prisma.apiKey.findFirst({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { prefix: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Playground"
        description="Anahtarını yapıştırıp TR API uçlarını tarayıcıdan dene"
        actions={
          <Link href="/dashboard/api-keys/new" className="admin-btn admin-btn-secondary">
            Anahtar oluştur
          </Link>
        }
      />
      <ApiPlaygroundClient suggestedKeyPrefix={key?.prefix} />
    </div>
  );
}
