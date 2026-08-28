'use client';

/**
 * NotificationBell — Dashboard üst barındaki bildirim çanı.
 *
 * useNotifications hook'u üzerinden gerçek zamanlı veri çeker.
 * Tıklanınca son 10 bildirimi dropdown'da gösterir.
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { FaBell, FaCheck } from 'react-icons/fa';
import { formatDate } from '@/lib/utils';

const ICONS: Record<string, string> = {
  'order.created': '🛒',
  'order.paid': '✅',
  'order.refunded': '↩️',
  'monitor.down': '🔴',
  'monitor.up': '�',
  'monitor.ssl_expiry': '🔒',
  'comment.reply': '�',
  'newsletter.subscribed': '📧',
};

export function NotificationBell() {
  const { notifications, unreadCount, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors focus-ring touch-target"
        aria-label={unreadCount > 0 ? `Bildirimler (${unreadCount} okunmamış)` : 'Bildirimler'}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="notification-dropdown"
      >
        <FaBell className="w-4 h-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notification-dropdown"
          role="menu"
          aria-label="Bildirim listesi"
          className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-card-premium z-50"
        >
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold text-sm">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markRead()}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <FaCheck className="inline" /> Tümünü okundu işaretle
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Bildirim yok</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.slice(0, 10).map((n: Notification) => (
                <li key={n.id}>
                  <Link
                    href={n.link ?? '#'}
                    onClick={() => {
                      if (!n.read) markRead([n.id]);
                    }}
                    className={`block p-3 hover:bg-muted transition-colors ${
                      !n.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <span className="text-xl" aria-hidden>
                        {ICONS[n.type] ?? '🔔'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            !n.read ? 'font-bold' : ''
                          }`}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && (
                        <span
                          className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"
                          aria-label="Okunmadı"
                        />
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
