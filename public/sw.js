/* eslint-disable no-restricted-globals */
/**
 * Service Worker — Web Push Receiver
 *
 * Server tarafindan gelen push notification'lari alir ve
 * kullaniciya gosterir. Tiklanma durumunda ilgili URL'i acar.
 *
 * Self.addEventListener('install'|'activate') standard SW lifecycle.
 * push event: web-push SDK tarafindan uretilen mesaj.
 * notificationclick: kullanici notification'a tikladiginda.
 */

self.addEventListener('install', (event) => {
  // Yeni SW hemen aktif olsun — push subscription'lari etkilenmesin.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Tum acik client'lar kontrol altina alinsin.
  event.waitUntil(self.clients.claim());
});

/**
 * Push mesaji geldiginde calisir.
 * Payload icerigi (server'dan JSON.stringify ile gonderildi):
 *   { title, body, icon?, badge?, url?, tag?, data? }
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'Yeni Bildirim',
      body: event.data.text(),
    };
  }

  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/badge-72.png',
    tag: payload.tag,
    data: payload.data || {},
    url: payload.url || '/',
    requireInteraction: false,
    // Tarayicinin varsayilan action'larini ac.
    actions: [
      {
        action: 'open',
        title: 'Ac',
      },
      {
        action: 'dismiss',
        title: 'Kapat',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title || 'Bildirim', options));
});

/**
 * Kullanici notification'a tikladiginda calisir.
 * Payload.data.url varsa onu acar; yoksa root'a gider.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) ||
                    event.notification.url ||
                    '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      // Ayni URL aciksa focus, degilse yeni pencere ac.
      for (const client of clientsArr) {
        if ('focus' in client) {
          try {
            const url = new URL(client.url);
            if (url.pathname === targetUrl) {
              return client.focus();
            }
          } catch {
            // URL parsing hatasi — yeni pencere ac.
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

/**
 * Push subscription gecersiz hale geldiginde (Chrome 80+).
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        endpoint: event.newSubscription ? event.newSubscription.endpoint : null,
        keys: event.newSubscription ? event.newSubscription.toJSON().keys : null,
      }),
    }).catch(() => undefined)
  );
});