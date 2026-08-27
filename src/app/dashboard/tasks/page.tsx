/**
 * Dashboard Tasks Page — Kullanıcının ilk workspace'inin task board'unu gösterir.
 * Workspace yoksa oluşturma sayfasına yönlendirir.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TaskBoard } from '@/components/dashboard/TaskBoard';
import Link from 'next/link';

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
      <div className="glass-card-premium p-12 text-center">
        <p className="text-5xl mb-3">🗂️</p>
        <p className="text-lg font-medium mb-2">Workspace&apos;iniz yok</p>
        <p className="text-sm text-muted-foreground mb-5">
          Görev yönetimi için önce bir workspace oluşturun.
        </p>
        <Link href="/api/workspaces" className="admin-btn admin-btn-primary inline-flex">
          Workspace Oluştur
        </Link>
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
    <TaskBoard
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      members={members.map((m) => ({
        id: m.userId,
        name: m.userName ?? m.userEmail,
      }))}
    />
  );
}