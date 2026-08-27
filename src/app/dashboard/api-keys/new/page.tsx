/**
 * @file Dashboard — Yeni API Anahtarı Oluştur
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NewApiKeyForm } from '@/components/dashboard/NewApiKeyForm';

export const dynamic = 'force-dynamic';

export default async function NewApiKeyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/api-keys/new');

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Yeni API Anahtarı</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Programatik erişim için yeni bir anahtar oluşturun
        </p>
      </div>
      <NewApiKeyForm />
    </div>
  );
}