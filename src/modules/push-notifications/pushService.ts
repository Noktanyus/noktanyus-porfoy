/**
 * Push Notifications Module — Service Layer
 *
 * Web Push subscription yonetimi ve gonderim islemleri.
 * web-push SDK'sini kullanir. VAPID keys zorunlu.
 *
 * VAPID keys yoksa servis 'disabled' modunda calisir (no-op).
 * Boylece development ortaminda kolayca bos gecilebilir.
 */

import webpush from 'web-push';
import { logger } from '@/lib/logger';
import { pushRepository } from './repository';
import { env } from '@/lib/env';
import type { PushPayload } from './schemas';

// VAPID config her push isleminde yeniden set edilir.
// web-push.setVapidDetails() idempotent ve hizli; singleton cache'e gerek yok.
// process.env uzerinden okunur ki test'lerde env.ts yeniden import etmeden
// davranis degistirilebilsin.
function ensureVapidConfigured(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY || env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || env.VAPID_SUBJECT || 'mailto:admin@noktanyus.com';

  if (!pub || !priv) {
    return false;
  }

  try {
    webpush.setVapidDetails(subject, pub, priv);
    return true;
  } catch (err) {
    logger.error('VAPID configuration failed', { error: err });
    return false;
  }
}

export const pushService = {
  /**
   * Tarayicidan gelen PushSubscription'i DB'ye kaydeder (idempotent upsert).
   * Ayni endpoint birden fazla user'a bagli olabilir; her kullanici
   * icin ayri aktif subscription olarak tutulur.
   */
  async subscribe(
    userId: string,
    input: { endpoint: string; p256dh: string; auth: string }
  ) {
    return pushRepository.upsert({
      userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    });
  },

  /**
   * Endpoint'i pasif yapar. Hard delete yerine soft delete tercih edildi
   * cunku ayni endpoint birden fazla kez subscribe edilebilir (farkli user
   * farkli cihaz). Boylece audit trail korunur.
   */
  async unsubscribe(endpoint: string) {
    return pushRepository.deactivate(endpoint);
  },

  /**
   * Tek bir kullaniciya push gonderir. Tum aktif aboneliklerine paralel
   * olarak webpush.sendNotification cagirir. Hata olursa subscription
   * otomatik olarak deactivate edilir (404/410 expired anlamina gelir).
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<{
    sent: number;
    failed: number;
  }> {
    if (!ensureVapidConfigured()) {
      return { sent: 0, failed: 0 };
    }

    const subs = await pushRepository.findActiveByUser(userId);
    if (subs.length === 0) return { sent: 0, failed: 0 };

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 } // 24 saat
        )
      )
    );

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const sub = subs[i];
      if (r.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        const statusCode = (r.reason as { statusCode?: number })?.statusCode;
        // 404 (Not Found) veya 410 (Gone) → endpoint artik gecerli degil
        if (statusCode === 404 || statusCode === 410) {
          await pushRepository.deactivate(sub.endpoint).catch(() => undefined);
          logger.info('Push subscription auto-deactivated', {
            endpoint: sub.endpoint,
            statusCode,
          });
        } else {
          logger.warn('Push notification failed', {
            endpoint: sub.endpoint,
            statusCode,
            error: r.reason,
          });
        }
      }
    }

    return { sent, failed };
  },

  /**
   * Tum aktif aboneliklere broadcast — admin/system bildirimleri icin.
   */
  async sendBroadcast(payload: PushPayload): Promise<{
    sent: number;
    failed: number;
  }> {
    if (!ensureVapidConfigured()) {
      return { sent: 0, failed: 0 };
    }

    const subs = await pushRepository.findAllActive();
    if (subs.length === 0) return { sent: 0, failed: 0 };

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 }
        )
      )
    );

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const sub = subs[i];
      if (r.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        const statusCode = (r.reason as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await pushRepository.deactivate(sub.endpoint).catch(() => undefined);
        }
      }
    }

    return { sent, failed };
  },

  /**
   * Public API: VAPID public key'i doner. Frontend subscribe islemi icin gerekli.
   * Key yoksa bos string doner (frontend no-op olur).
   */
  getPublicKey(): string {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  },

  /**
   * Push sistemi aktif mi? VAPID keys set edilmis mi kontrol eder.
   * Frontend bu degeri kullanarak UI'da enable/disable yapabilir.
   */
  isEnabled(): boolean {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY || env.VAPID_PRIVATE_KEY;
    return Boolean(publicKey && privateKey);
  },
};