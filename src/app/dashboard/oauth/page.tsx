/**
 * Dashboard — OAuth uygulama istemcileri (Authorization Code + PKCE)
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { OAuthClientList } from '@/components/dashboard/OAuthClientList';
import { CreateOAuthClientDialog } from '@/components/dashboard/CreateOAuthClientDialog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OAuthClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/oauth');

  const userId = (session.user as { id: string }).id;
  const clients = await prisma.oAuthClient.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      clientId: true,
      name: true,
      redirectUris: true,
      scopes: true,
      createdAt: true,
      revokedAt: true,
    },
  });

  const rows = clients.map((c) => ({
    id: c.id,
    clientId: c.clientId,
    name: c.name,
    redirectUris: Array.isArray(c.redirectUris) ? (c.redirectUris as string[]) : [],
    scopes: Array.isArray(c.scopes) ? (c.scopes as string[]) : [],
    createdAt: c.createdAt.toISOString(),
    revokedAt: c.revokedAt ? c.revokedAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="OAuth uygulamaları"
        description="Authorization Code + PKCE istemcileri — third-party entegrasyon"
        actions={
          <div className="flex flex-wrap gap-2">
            <CreateOAuthClientDialog />
            <Link href="/docs" className="admin-btn admin-btn-secondary">
              API docs
            </Link>
          </div>
        }
      />
      <OAuthClientList clients={rows} />
    </div>
  );
}
