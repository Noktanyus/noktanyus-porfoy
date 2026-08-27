/**
 * @file Dashboard — API Anahtarları Listesi
 * @description Kullanıcının tüm aktif API anahtarlarını listele, iptal et.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiKeyService } from '@/modules/api-keys/service';
import { redirect } from 'next/navigation';
import { ApiKeyList } from '@/components/dashboard/ApiKeyList';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/api-keys');

  const userId = (session.user as any).id as string;
  const keys = await apiKeyService.listApiKeys(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">API Anahtarları</h1>
          <p className="text-sm text-muted-foreground">
            {keys.length} aktif anahtar
          </p>
        </div>
        <Link
          href="/dashboard/api-keys/new"
          className="admin-btn admin-btn-primary"
        >
          <FaPlus className="w-3 h-3" />
          Yeni API Anahtarı
        </Link>
      </div>
      <ApiKeyList keys={keys as any} />
    </div>
  );
}