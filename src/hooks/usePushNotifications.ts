'use client';

/**
 * usePushNotifications — Client Hook
 *
 * Tarayicida Web Push API'sini yonetir:
 * 1. Service worker kayit
 * 2. VAPID public key'i fetch
 * 3. Notification permission iste
 * 4. pushManager.subscribe
 * 5. Backend'e subscription'i POST
 * 6. unsubscribe
 *
 * Tarayici destegi yoksa veya VAPID key yoksa sessizce no-op olur.
 */

import { useCallback, useEffect, useState } from 'react';

type Status =
  | 'idle'
  | 'unsupported'
  | 'unconfigured'
  | 'denied'
  | 'subscribing'
  | 'subscribed'
  | 'error';

interface UsePushNotificationsResult {
  status: Status;
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'unknown';
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

const SW_PATH = '/sw.js';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = typeof window !== 'undefined' ? window.atob(base64) : '';
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_PATH, { scope: '/' });
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [status, setStatus] = useState<Status>('idle');
  const [permission, setPermission] = useState<NotificationPermission | 'unknown'>(
    'unknown'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  // Mount: destek + permission + mevcut subscription state
  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported');
      return;
    }

    setPermission(Notification.permission);

    if (Notification.permission === 'denied') {
      setStatus('denied');
    }

    void (async () => {
      try {
        const reg = await ensureServiceWorker();
        if (!reg) return;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(Boolean(sub));
      } catch {
        // ignore — UI yine de subscribe butonu gostersin
      }
    })();
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setStatus('unsupported');
      return false;
    }

    try {
      setStatus('subscribing');

      // 1. Permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setStatus('denied');
        return false;
      }

      // 2. VAPID key fetch
      const keyRes = await fetch('/api/push/vapid-key');
      if (!keyRes.ok) {
        setStatus('unconfigured');
        return false;
      }
      const keyData = (await keyRes.json()) as {
        success: boolean;
        data?: { publicKey: string };
      };
      if (!keyData.success || !keyData.data?.publicKey) {
        setStatus('unconfigured');
        return false;
      }

      // 3. Service worker + pushManager
      const reg = await ensureServiceWorker();
      if (!reg) {
        setStatus('unsupported');
        return false;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.data.publicKey),
      });

      const json = subscription.toJSON();

      // 4. Backend'e kaydet
      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      if (!saveRes.ok) {
        // Backend reddettiyse browser subscription'i da iptal et
        await subscription.unsubscribe().catch(() => undefined);
        setStatus('error');
        return false;
      }

      setIsSubscribed(true);
      setStatus('subscribed');
      return true;
    } catch {
      setStatus('error');
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      const reg = await ensureServiceWorker();
      if (!reg) return false;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setIsSubscribed(false);
        return true;
      }

      const json = sub.toJSON();

      // Backend'i once bilgilendir (auth gerekli)
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ endpoint: json.endpoint }),
      }).catch(() => undefined);

      const ok = await sub.unsubscribe();
      setIsSubscribed(!ok);
      return ok;
    } catch {
      return false;
    }
  }, [isSupported]);

  return { status, isSupported, isSubscribed, permission, subscribe, unsubscribe };
}