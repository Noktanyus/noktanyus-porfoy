/**
 * @file Dashboard — Yeni API Anahtarı Oluştur
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NewApiKeyForm } from '@/components/dashboard/NewApiKeyForm';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const dynamic = 'force-dynamic';

export default async function NewApiKeyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/api-keys/new');

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Yeni API Anahtarı"
        description="Programatik erişim için yeni bir anahtar oluşturun"
        backHref="/dashboard/api-keys"
        backLabel="API Anahtarları"
      />
      <NewApiKeyForm />
    </div>
  );
}
