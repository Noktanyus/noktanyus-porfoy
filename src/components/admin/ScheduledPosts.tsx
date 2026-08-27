/**
 * @file ScheduledPosts - Taslak ve zamanlanmis yazilari yoneten client component.
 * @description Taslaklari zamanlama, zamanlanmis yazilari anlik yayinlama,
 *              ve taslaklari duzenleme icin UI saglar.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaCalendar, FaPlay, FaEdit, FaTrash } from 'react-icons/fa';
import { formatDate, formatDateTime } from '@/lib/utils';

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: string;
  scheduledAt?: Date | string | null;
  draftSavedAt?: Date | string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

interface ScheduledPostsProps {
  drafts: BlogPost[];
  scheduled: BlogPost[];
}

export function ScheduledPosts({ drafts, scheduled }: ScheduledPostsProps) {
  const router = useRouter();

  const handleSchedule = async (id: string) => {
    const when = prompt('Yayin zamani (YYYY-MM-DDTHH:mm):');
    if (!when) return;
    const scheduledAt = new Date(when);
    if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      toast.error('Gecerli bir gelecek tarih girin');
      return;
    }

    const res = await fetch(`/api/blogs/${id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt: scheduledAt.toISOString() }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Zamanlandi');
      router.refresh();
    } else {
      toast.error(data.error?.message ?? 'Zamanlama basarisiz');
    }
  };

  const handlePublishNow = async (id: string) => {
    const res = await fetch(`/api/blogs/${id}/schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    if (res.ok) {
      toast.success('Yayinda');
      router.refresh();
    } else {
      toast.error('Yayinlama basarisiz');
    }
  };

  return (
    <div className="space-y-8">
      {/* Zamanlanmis */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          Zamanlanmis ({scheduled.length})
        </h2>
        {scheduled.length === 0 ? (
          <div className="glass-card-premium p-6 text-center text-muted-foreground">
            Zamanlanmis yazi yok
          </div>
        ) : (
          <div className="space-y-2">
            {scheduled.map((p) => (
              <div
                key={p.id}
                className="glass-card-premium p-4 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{p.title}</p>
                  <p className="text-sm text-muted-foreground">
                    <FaCalendar className="inline mr-1" />
                    {p.scheduledAt ? formatDateTime(p.scheduledAt) : '-'}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/admin/blog/edit/${p.slug}`}
                    className="admin-btn admin-btn-secondary text-sm"
                  >
                    <FaEdit /> Duzenle
                  </Link>
                  <button
                    onClick={() => handlePublishNow(p.id)}
                    className="admin-btn admin-btn-primary text-sm"
                  >
                    <FaPlay /> Simdi Yayinla
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Taslaklar */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          Taslaklar ({drafts.length})
        </h2>
        {drafts.length === 0 ? (
          <div className="glass-card-premium p-6 text-center text-muted-foreground">
            Taslak yok
          </div>
        ) : (
          <div className="space-y-2">
            {drafts.map((p) => (
              <div
                key={p.id}
                className="glass-card-premium p-4 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{p.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Son kayit: {p.draftSavedAt ? formatDate(p.draftSavedAt) : '-'}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/admin/blog/edit/${p.slug}`}
                    className="admin-btn admin-btn-secondary text-sm"
                  >
                    <FaEdit /> Duzenle
                  </Link>
                  <button
                    onClick={() => handleSchedule(p.id)}
                    className="admin-btn admin-btn-primary text-sm"
                  >
                    <FaCalendar /> Zamanla
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
