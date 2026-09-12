/**
 * /dashboard/workspaces/[id] — Workspace özet sayfası.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { FaPalette, FaShieldAlt, FaTasks, FaUsers } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function WorkspaceDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/giris?callbackUrl=/dashboard/workspaces/${params.id}`);
  }
  const userId = (session.user as { id: string }).id;

  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId: params.id, userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
              complianceSites: true,
            },
          },
        },
      },
    },
  });

  if (!membership) notFound();
  const ws = membership.workspace;

  const cards = [
    {
      href: '/dashboard/tasks',
      label: 'Görevler',
      desc: 'Kanban görev tahtası',
      icon: FaTasks,
    },
    {
      href: `/dashboard/workspaces/${ws.id}/branding`,
      label: 'Branding',
      desc: 'Logo, renk, white-label',
      icon: FaPalette,
    },
    {
      href: '/dashboard/compliance',
      label: 'Compliance',
      desc: `${ws._count.complianceSites} site`,
      icon: FaShieldAlt,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={ws.name}
        description={ws.description || `Slug: ${ws.slug}`}
        backHref="/dashboard/workspaces"
        backLabel="Workspace'ler"
      />

      <div className="glass-card-premium p-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <FaUsers className="w-4 h-4" aria-hidden="true" />
          {ws._count.members} üye · Rolünüz: {membership.role}
        </span>
        <span className="font-mono text-xs">{ws.slug}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="glass-card-premium p-5 hover:border-brand-primary/40 transition-colors group"
            >
              <Icon className="w-5 h-5 text-brand-primary mb-3" aria-hidden="true" />
              <p className="font-semibold text-foreground group-hover:text-brand-primary transition-colors">
                {c.label}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
