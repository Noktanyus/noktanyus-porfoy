/**
 * Dashboard Tasks Page — Kullanıcının ilk workspace'inin task board'unu gösterir.
 * Workspace yoksa oluşturma sayfasına yönlendirir.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TaskBoard } from '@/components/dashboard/TaskBoard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default async function DashboardTasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/giris');
  }
  const userId = (session.user as { id: string }).id;

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: { select: { id: true, name: true, slug: true } } },
    orderBy: { joinedAt: 'asc' },
    take: 1,
  });

  if (memberships.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Görevler"
          description="Workspace'lerinde görevleri yönet"
        />
        <EmptyState
          title="Workspace'iniz yok"
          description="Görev yönetimi için önce bir workspace oluşturun."
          icon="🗂️"
          action={{ label: 'Workspace Oluştur', href: '/api/workspaces' }}
        />
      </div>
    );
  }

  const workspace = memberships[0].workspace;

  // Üye listesi (assign dropdown için)
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    select: { userId: true, userName: true, userEmail: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Görevler"
        description={workspace.name}
      />
      <TaskBoard
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        members={members.map((m) => ({
          id: m.userId,
          name: m.userName ?? m.userEmail,
        }))}
      />
    </div>
  );
}
