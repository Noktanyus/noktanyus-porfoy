/**
 * @file Taslak & Zamanlanmis Blog Yonetimi Sayfasi
 * @description Admin panelinden draft ve scheduled blog yazilarini yonetir.
 *              Zamanlama, anlik yayinlama ve taslak duzenleme aksiyonlari sunar.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ScheduledPosts } from '@/components/admin/ScheduledPosts';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard, StatCardGrid } from '@/components/ui/StatCard';

export const dynamic = 'force-dynamic';

export default async function ScheduledPostsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/giris');
  }

  // Taslaklar - en son guncellenen once
  const drafts = await prisma.blog.findMany({
    where: { status: 'draft' },
    orderBy: { updatedAt: 'desc' },
  });

  // Zamanlanmis - en yakin tarih once
  const scheduled = await prisma.blog.findMany({
    where: { status: 'scheduled' },
    orderBy: { scheduledAt: 'asc' },
  });

  return (
    <div className="admin-content-spacing">
      <PageHeader
        title="Taslaklar & Zamanlanmış"
        description="Yayına alınmayı bekleyen yazıları buradan yönetin."
        backHref="/admin/blog"
        backLabel="Blog Yönetimi"
        breadcrumb={<span>Admin / Blog / Taslaklar</span>}
        actions={
          <Link href="/admin/blog/new" className="admin-btn admin-btn-primary">
            Yeni Yazı
          </Link>
        }
      />

      {/* Sayılar doğrudan sorgu sonuçlarından gelir */}
      <StatCardGrid columns={2}>
        <StatCard label="Taslak" value={drafts.length} />
        <StatCard
          label="Zamanlanmış"
          value={scheduled.length}
          tone={scheduled.length > 0 ? 'info' : 'default'}
        />
      </StatCardGrid>

      <ScheduledPosts drafts={drafts} scheduled={scheduled} />
    </div>
  );
}
