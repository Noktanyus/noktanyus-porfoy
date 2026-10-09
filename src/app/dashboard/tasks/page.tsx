/**
 * Dashboard — Workspace görev panosu
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TaskBoard } from '@/components/dashboard/TaskBoard';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: { workspace?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/tasks');

  const userId = (session.user as { id: string }).id;

  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      members: {
        select: {
          userId: true,
          userName: true,
          userEmail: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (workspaces.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Görevler" description="Workspace seçerek kanban panosu" />
        <EmptyState
          icon="inbox"
          title="Önce workspace oluştur"
          description="Görevler workspace’e bağlıdır."
          action={{ label: 'Workspace oluştur', href: '/dashboard/workspaces?new=1' }}
        />
      </div>
    );
  }

  const selected =
    workspaces.find((w) => w.id === searchParams?.workspace) ?? workspaces[0];

  const members = selected.members
    .filter((m) => m.userId)
    .map((m) => ({
      id: m.userId!,
      name: m.user?.name || m.userName || m.userEmail,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Görevler"
        description={selected.name}
        actions={
          <div className="flex flex-wrap gap-2">
            {workspaces.map((w) => (
              <Link
                key={w.id}
                href={`/dashboard/tasks?workspace=${w.id}`}
                className={`admin-btn text-sm ${
                  w.id === selected.id ? 'admin-btn-primary' : 'admin-btn-secondary'
                }`}
              >
                {w.name}
              </Link>
            ))}
          </div>
        }
      />
      <TaskBoard
        workspaceId={selected.id}
        workspaceName={selected.name}
        members={members}
      />
    </div>
  );
}
