/**
 * Dashboard — Bildirimler (tam liste)
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/modules/notifications';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { MarkAllReadButton } from '@/components/dashboard/MarkAllReadButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatTs(d: Date) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/notifications');

  const userId = (session.user as { id: string }).id;
  const [notifications, unreadCount] = await Promise.all([
    notificationService.list(userId, 100),
    notificationService.unreadCount(userId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bildirimler"
        description={
          unreadCount > 0
            ? `${unreadCount} okunmamış bildirim`
            : 'Sipariş, monitör ve sistem duyuruları'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 && <MarkAllReadButton />}
            <Link href="/dashboard/activity" className="admin-btn admin-btn-secondary">
              Aktivite
            </Link>
          </div>
        }
      />

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">Henüz bildirim yok.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border px-4 py-4 ${
                n.read
                  ? 'border-border bg-card/40'
                  : 'border-brand-primary/30 bg-brand-primary/5'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{n.title}</p>
                  {n.message && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {n.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                    {formatTs(n.createdAt)}
                    {n.type && (
                      <span className="ml-2 font-mono opacity-70">{n.type}</span>
                    )}
                  </p>
                </div>
                {!n.read && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-brand-primary shrink-0">
                    Yeni
                  </span>
                )}
              </div>
              {n.link && (
                <Link
                  href={n.link}
                  className="inline-block mt-3 text-sm text-brand-primary hover:underline"
                >
                  Detaya git →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
