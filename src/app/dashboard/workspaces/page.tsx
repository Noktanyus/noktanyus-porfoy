/**
 * Dashboard — Workspace listesi (SaaS multi-tenant iskeleti)
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { CreateWorkspaceForm } from '@/components/dashboard/CreateWorkspaceForm';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WorkspacesPage({
  searchParams,
}: {
  searchParams?: { new?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/workspaces');

  const userId = (session.user as { id: string }).id;
  const showNew = searchParams?.new === '1';

  const [owned, memberRows] = await Promise.all([
    prisma.workspace.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            createdAt: true,
            ownerId: true,
          },
        },
      },
    }),
  ]);

  const byId = new Map<string, (typeof owned)[number] & { role: string }>();
  for (const w of owned) {
    byId.set(w.id, { ...w, role: 'owner' });
  }
  for (const m of memberRows) {
    if (!byId.has(m.workspace.id)) {
      byId.set(m.workspace.id, {
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        description: m.workspace.description,
        createdAt: m.workspace.createdAt,
        role: m.role ?? 'member',
      });
    }
  }

  const workspaces = Array.from(byId.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspaces"
        description={`${workspaces.length} çalışma alanı`}
        actions={
          <Link
            href="/dashboard/workspaces?new=1"
            className="admin-btn admin-btn-primary"
          >
            Yeni workspace
          </Link>
        }
      />

      {showNew && (
        <section className="rounded-2xl border border-border bg-card/50 p-5">
          <h2 className="text-base font-bold mb-4">Yeni workspace</h2>
          <CreateWorkspaceForm redirectTo="list" />
        </section>
      )}

      {workspaces.length === 0 && !showNew ? (
        <EmptyState
          icon="inbox"
          title="Henüz workspace yok"
          description="Şablon kurulumu ve ekip işleri için bir çalışma alanı oluştur."
          action={{ label: 'Workspace oluştur', href: '/dashboard/workspaces?new=1' }}
        />
      ) : (
        <ul className="space-y-3">
          {workspaces.map((w) => (
            <li key={w.id}>
              <Link
                href={`/dashboard/workspaces/${w.id}`}
                className="block rounded-2xl border border-border bg-card/50 p-4 sm:p-5 hover:border-brand-primary/40 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-foreground">{w.name}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{w.slug}</p>
                    {w.description && (
                      <p className="text-sm text-muted-foreground mt-2">{w.description}</p>
                    )}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide rounded-full border border-border px-2 py-0.5">
                    {w.role}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
