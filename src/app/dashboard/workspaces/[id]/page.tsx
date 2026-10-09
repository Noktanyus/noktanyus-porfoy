/**
 * Dashboard — Workspace detay (üyeler, davetler, hızlı linkler)
 */

import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { workspaceRepository } from '@/modules/admin/workspaceRepository';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { InviteMemberForm } from '@/components/dashboard/InviteMemberForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WorkspaceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/giris?callbackUrl=/dashboard/workspaces/${params.id}`);

  const userId = (session.user as { id: string }).id;
  const role = await workspaceRepository.isMember(params.id, userId);
  if (!role) notFound();

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.id },
    include: {
      members: {
        orderBy: { joinedAt: 'asc' },
        select: {
          id: true,
          userEmail: true,
          userName: true,
          role: true,
          joinedAt: true,
        },
      },
      invitations: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          createdAt: true,
        },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!workspace) notFound();

  const canInvite = role === 'OWNER' || role === 'ADMIN';

  return (
    <div className="space-y-6">
      <PageHeader
        title={workspace.name}
        description={
          <>
            <span className="font-mono text-xs">{workspace.slug}</span>
            {workspace.description ? ` · ${workspace.description}` : ''}
          </>
        }
        actions={
          <Link href="/dashboard/workspaces" className="admin-btn admin-btn-secondary">
            Tüm workspaces
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Rolün</p>
          <p className="text-lg font-bold mt-1">{role}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Üyeler</p>
          <p className="text-lg font-bold mt-1">{workspace.members.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Görevler</p>
          <p className="text-lg font-bold mt-1">{workspace._count.tasks}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card/50 p-5">
        <h2 className="text-base font-bold mb-3">Hızlı erişim</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/tasks" className="admin-btn admin-btn-secondary text-sm">
            Görevler
          </Link>
          <Link href="/dashboard/api-keys" className="admin-btn admin-btn-secondary text-sm">
            API anahtarları
          </Link>
          <Link href="/dashboard/usage" className="admin-btn admin-btn-secondary text-sm">
            Kullanım
          </Link>
          <Link href="/dashboard/webhooks" className="admin-btn admin-btn-secondary text-sm">
            Webhooks
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/50 p-5">
        <h2 className="text-base font-bold mb-4">Üyeler</h2>
        <ul className="divide-y divide-border">
          {workspace.members.map((m) => (
            <li key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{m.userName || m.userEmail}</p>
                {m.userName && (
                  <p className="text-xs text-muted-foreground">{m.userEmail}</p>
                )}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wide rounded-full border border-border px-2 py-0.5">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {canInvite && (
        <section className="rounded-2xl border border-border bg-card/50 p-5">
          <h2 className="text-base font-bold mb-4">Üye davet et</h2>
          <InviteMemberForm workspaceId={workspace.id} workspaceName={workspace.name} />
        </section>
      )}

      {workspace.invitations.length > 0 && (
        <section className="rounded-2xl border border-border bg-card/50 p-5">
          <h2 className="text-base font-bold mb-4">Bekleyen davetler</h2>
          <ul className="space-y-2">
            {workspace.invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm border border-border rounded-xl px-3 py-2"
              >
                <span>{inv.email}</span>
                <span className="text-xs text-muted-foreground">
                  {inv.role} · {inv.expiresAt.toLocaleDateString('tr-TR')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
