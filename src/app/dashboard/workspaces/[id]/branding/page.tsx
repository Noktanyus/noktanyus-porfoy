/**
 * @file /dashboard/workspaces/[id]/branding — Workspace branding ayarları sayfası.
 * @description Server component; branding bilgisini çekip BrandingForm'a geçirir.
 *   Sadece OWNER+ erişimine izin verilir.
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { brandingService } from '@/modules/workspaces/brandingService';
import { BrandingForm } from '@/components/dashboard/BrandingForm';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function BrandingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/giris');
  }
  const userId = (session.user as { id: string }).id;

  const ws = await prisma.workspace.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!ws) notFound();

  const memberRole = ws.members[0]?.role;
  const isOwner = ws.ownerId === userId;
  const isAdmin = memberRole === 'OWNER' || memberRole === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return (
      <div className="glass-card-premium p-8 max-w-md">
        <h2 className="text-xl font-bold mb-2">Yetkisiz Erişim</h2>
        <p className="text-muted-foreground text-sm">
          Branding ayarlarını yalnızca workspace sahibi ve adminler düzenleyebilir.
        </p>
      </div>
    );
  }

  const branding = await brandingService.getBranding(params.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branding & White-Label"
        description="Marka rengini, logoyu ve özel domain ayarlarını yönet."
        backHref={`/dashboard/workspaces/${ws.id}`}
        backLabel={ws.name}
        breadcrumb={
          <span>
            <Link
              href={`/dashboard/workspaces/${ws.id}`}
              className="hover:text-foreground transition-colors"
            >
              {ws.name}
            </Link>
            <span className="mx-1.5 opacity-60">/</span>
            <span className="text-foreground">Branding</span>
          </span>
        }
      />
      <BrandingForm workspaceId={ws.id} initial={branding} />
    </div>
  );
}
