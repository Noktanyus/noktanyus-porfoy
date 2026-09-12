/**
 * @file Dashboard — API Anahtarları Listesi
 * @description Kullanıcının tüm aktif API anahtarlarını listele, iptal et.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiKeyService } from '@/modules/api-keys/service';
import { redirect } from 'next/navigation';
import { ApiKeyList } from '@/components/dashboard/ApiKeyList';
import { PageHeader } from '@/components/dashboard/PageHeader';
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
      <PageHeader
        title="API Anahtarları"
        description={`${keys.length} aktif anahtar`}
        actions={
          <Link
            href="/dashboard/api-keys/new"
            className="admin-btn admin-btn-primary"
          >
            <FaPlus className="w-3 h-3" aria-hidden="true" />
            Yeni API Anahtarı
          </Link>
        }
      />
      <ApiKeyList keys={keys as any} />
    </div>
  );
}
