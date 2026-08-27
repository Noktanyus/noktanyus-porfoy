/**
 * @file Taslak & Zamanlanmis Blog Yonetimi Sayfasi
 * @description Admin panelinden draft ve scheduled blog yazilarini yonetir.
 *              Zamanlama, anlik yayinlama ve taslak duzenleme aksiyonlari sunar.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ScheduledPosts } from '@/components/admin/ScheduledPosts';

export const dynamic = 'force-dynamic';

export default async function ScheduledPostsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/admin/login');
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
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Taslaklar & Zamanlanmis</h1>
          <p className="admin-subtitle">
            {drafts.length} taslak, {scheduled.length} zamanlanmis yazi
          </p>
        </div>
      </div>
      <ScheduledPosts drafts={drafts} scheduled={scheduled} />
    </div>
  );
}
