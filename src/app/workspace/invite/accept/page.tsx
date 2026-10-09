/**
 * Workspace davet kabul — /workspace/invite/accept?token=...
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AcceptInviteClient } from '@/components/dashboard/AcceptInviteClient';

export const dynamic = 'force-dynamic';

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  const token = searchParams?.token?.trim();
  if (!token) {
    return (
      <div className="container-responsive py-16 max-w-lg">
        <h1 className="text-2xl font-bold mb-2">Geçersiz davet</h1>
        <p className="text-muted-foreground mb-6">Davet bağlantısında token yok.</p>
        <Link href="/dashboard/workspaces" className="admin-btn admin-btn-primary">
          Workspaces
        </Link>
      </div>
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/giris?callbackUrl=${encodeURIComponent(`/workspace/invite/accept?token=${token}`)}`);
  }

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: { workspace: { select: { id: true, name: true, slug: true } } },
  });

  if (!invitation) {
    return (
      <div className="container-responsive py-16 max-w-lg">
        <h1 className="text-2xl font-bold mb-2">Davet bulunamadı</h1>
        <p className="text-muted-foreground">Token geçersiz veya silinmiş.</p>
      </div>
    );
  }

  const expired = invitation.expiresAt < new Date();
  const notPending = invitation.status !== 'PENDING';

  return (
    <div className="container-responsive py-16 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workspace daveti</h1>
        <p className="text-muted-foreground mt-2">
          <strong>{invitation.workspace.name}</strong> ({invitation.workspace.slug}) — rol:{' '}
          {invitation.role}
        </p>
        <p className="text-sm text-muted-foreground mt-1">Davet: {invitation.email}</p>
      </div>

      {expired || notPending ? (
        <div className="rounded-2xl border border-border bg-card/50 p-5 text-sm">
          {expired ? 'Bu davetin süresi dolmuş.' : `Davet durumu: ${invitation.status}`}
          <div className="mt-4">
            <Link href="/dashboard/workspaces" className="admin-btn admin-btn-secondary">
              Workspaces
            </Link>
          </div>
        </div>
      ) : (
        <AcceptInviteClient token={token} workspaceId={invitation.workspace.id} />
      )}
    </div>
  );
}
