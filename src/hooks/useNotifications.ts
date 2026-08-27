'use client';

/**
 * useNotifications — Real-time Notification Hook
 *
 * SSE stream'ine bağlanır, fallback olarak 30 saniyede polling yapar,
 * ve markRead aksiyonu sağlar.
 */

import { useEffect, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  icon?: string | null;
  read: boolean;
  createdAt: string;
}

interface ApiOk<T> {
  success: true;
  data: T;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/user/notifications', { credentials: 'include' });
      if (!res.ok) return;
      const data = (await res.json()) as ApiOk<{
        notifications: Notification[];
        unreadCount: number;
      }>;
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      // silent — hook shouldn't crash UI
      // eslint-disable-next-line no-console
      console.error('Notifications fetch error', err);
    }
  }, []);

  const markRead = useCallback(
    async (ids?: string[]) => {
      try {
        await fetch('/api/user/notifications/read', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(ids ? { ids } : { all: true }),
        });
        await fetchNotifications();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('markRead failed', err);
      }
    },
    [fetchNotifications]
  );

  useEffect(() => {
    fetchNotifications();

    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    const eventSource = new EventSource('/api/notifications/stream', {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'notifications' && Array.isArray(payload.notifications)) {
          setNotifications(payload.notifications);
          setUnreadCount(
            payload.notifications.filter((n: Notification) => !n.read).length
          );
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('SSE parse error', err);
      }
    };

    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => {
      setConnected(false);
      // EventSource otomatik olarak yeniden bağlanır; biz sadece state'i güncelliyoruz
    };

    // Fallback polling (SSE yoksa veya bağlantı koparsa)
    const interval = setInterval(fetchNotifications, 30_000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  return { notifications, unreadCount, connected, markRead, refresh: fetchNotifications };
}
