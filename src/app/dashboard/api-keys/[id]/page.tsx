/**
 * Dashboard — API anahtarı düzenle (scopes, rate limit, isim)
 */

import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EditApiKeyForm } from '@/components/dashboard/EditApiKeyForm';
import { RotateApiKeyButton } from '@/components/dashboard/RotateApiKeyButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditApiKeyPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/giris?callbackUrl=/dashboard/api-keys/${params.id}`);

  const userId = (session.user as { id: string }).id;
  const key = await prisma.apiKey.findFirst({
    where: { id: params.id, userId, revokedAt: null },
  });
  if (!key) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={key.name}
        description={`Düzenle · ${key.prefix}…`}
        backHref="/dashboard/api-keys"
        backLabel="API anahtarları"
      />
      <RotateApiKeyButton keyId={key.id} />
      <EditApiKeyForm
        keyId={key.id}
        initial={{
          name: key.name,
          scopes: Array.isArray(key.scopes) ? (key.scopes as string[]) : [],
          rateLimit: key.rateLimit,
          monthlyQuota: key.monthlyQuota,
          allowedIps: Array.isArray(key.allowedIps)
            ? (key.allowedIps as string[])
            : [],
        }}
      />
    </div>
  );
}
