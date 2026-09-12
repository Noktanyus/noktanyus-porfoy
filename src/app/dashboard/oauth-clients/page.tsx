/**
 * @file Dashboard — OAuth Clients Yönetim Sayfası
 * @description Kullanıcının OAuth 2.0 client'larını listele, oluştur, iptal et.
 *              Server Component: session kontrolü + initial data fetch.
 *              Client Component: dialog + list (shadcn-style modal).
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { OAuthClientList } from '@/components/dashboard/OAuthClientList';
import { CreateOAuthClientDialog } from '@/components/dashboard/CreateOAuthClientDialog';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { FaKey } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

interface PublicClient {
  id: string;
  clientId: string;
  name: string;
  redirectUris: string[];
  scopes: string[];
  createdAt: string;
  revokedAt: string | null;
}

export default async function OAuthClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/oauth-clients');

  const userId = (session.user as any).id as string;

  const clients = await prisma.oAuthClient.findMany({
    where: { ownerId: userId },
    orderBy: [{ revokedAt: 'asc' }, { createdAt: 'desc' }],
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

  const data: PublicClient[] = clients.map((c) => ({
    id: c.id,
    clientId: c.clientId,
    name: c.name,
    redirectUris: c.redirectUris as string[],
    scopes: c.scopes as string[],
    createdAt: c.createdAt.toISOString(),
    revokedAt: c.revokedAt ? c.revokedAt.toISOString() : null,
  }));

  const activeCount = data.filter((c) => !c.revokedAt).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <FaKey className="w-5 h-5" />
            OAuth 2.0 Clients
          </span>
        }
        description={
          <>
            3rd party uygulamaların API'na erişmesi için OAuth 2.0 (RFC 6749 + PKCE)
            client'ları oluşturun.
            <span className="block mt-1">
              {activeCount} aktif / {data.length} toplam client
            </span>
          </>
        }
        actions={<CreateOAuthClientDialog />}
      />

      <div className="glass-card-premium p-4 text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Authorization Code + PKCE akışı:</strong> Client
          <code className="mx-1 px-1 rounded bg-muted font-mono">
            /api/auth/oauth/authorize
          </code>
          → user consent →
          <code className="mx-1 px-1 rounded bg-muted font-mono">
            /api/auth/oauth/token
          </code>
        </p>
        <p>
          Yeni oluşturulan <code className="px-1 rounded bg-muted font-mono">client_secret</code>
          {' '}sadece oluşturma anında gösterilir — kopyalamayı unutmayın.
        </p>
      </div>

      <OAuthClientList clients={data} />
    </div>
  );
}
