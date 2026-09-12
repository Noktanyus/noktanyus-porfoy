/**
 * /dashboard/workspaces — Kullanıcının workspace listesi + oluşturma CTA.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateWorkspaceForm } from '@/components/dashboard/CreateWorkspaceForm';
import { FaArrowRight, FaPalette, FaTasks } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

export default async function WorkspacesPage({
  searchParams,
}: {
  searchParams?: { new?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/workspaces');
  const userId = (session.user as { id: string }).id;

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          updatedAt: true,
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  const showCreate = searchParams?.new === '1' || memberships.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace'ler"
        description="Çalışma alanlarınızı yönetin"
        actions={
          !showCreate ? (
            <Link href="/dashboard/workspaces?new=1" className="admin-btn admin-btn-primary">
              Yeni Workspace
            </Link>
          ) : undefined
        }
      />

      {showCreate && (
        <CreateWorkspaceForm redirectTo="detail" />
      )}

      {memberships.length === 0 && !showCreate ? (
        <EmptyState
          title="Henüz workspace yok"
          description="Görevler, compliance ve şablon kurulumu için bir workspace oluşturun."
          icon="box"
          action={{ label: 'Workspace Oluştur', href: '/dashboard/workspaces?new=1' }}
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memberships.map((m) => {
            const ws = m.workspace;
            return (
              <li key={ws.id} className="glass-card-premium p-5 flex flex-col gap-4">
                <div>
                  <Link
                    href={`/dashboard/workspaces/${ws.id}`}
                    className="text-lg font-semibold text-foreground hover:text-brand-primary transition-colors"
                  >
                    {ws.name}
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{ws.slug}</p>
                  {ws.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ws.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{m.role}</span>
                  <span>·</span>
                  <span>{ws._count.members} üye</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-border/40">
                  <Link
                    href={`/dashboard/workspaces/${ws.id}`}
                    className="admin-btn text-sm min-h-[40px]"
                  >
                    Aç <FaArrowRight className="w-3 h-3" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/dashboard/tasks"
                    className="admin-btn text-sm min-h-[40px]"
                  >
                    <FaTasks className="w-3 h-3" aria-hidden="true" /> Görevler
                  </Link>
                  <Link
                    href={`/dashboard/workspaces/${ws.id}/branding`}
                    className="admin-btn text-sm min-h-[40px]"
                  >
                    <FaPalette className="w-3 h-3" aria-hidden="true" /> Branding
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
