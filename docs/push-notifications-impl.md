# Push Notifications (Web Push) — Implementation Report

**Proje:** noktanyus-porfoy
**Tarih:** 2026-08-28
**Kapsam:** Web Push Notifications entegrasyonu (VAPID tabanli)

---

## 1. Genel Bakis

Tarayici bazli push notification altyapisi. Kullanici bir web sayfasini
acip "Push bildirimlere izin ver" dediginde, sunucu tarafindan VAPID ile
imzalanmis push mesajlari kullanici tarayicisina ulasabilir. Kullanici
siteyi kapattiktan sonra bile bildirim alabilir.

**Stack:**
- `web-push` SDK (server tarafi push gonderimi)
- `PushSubscription` Prisma modeli (kullanici aboneliklerini DB'de tutar)
- Service Worker (browser tarafi mesaj alma + gosterme)
- VAPID (Voluntary Application Server Identification) keys

**Yapilan is:**
- Prisma schema'ya `PushSubscription` modeli ve `User` relation'i eklendi (db push basarili).
- `src/modules/push-notifications/` altinda moduler service/repository/schemas yapisi kuruldu.
- `GET /api/push/vapid-key`, `POST/DELETE /api/push/subscribe` API route'lari yazildi.
- `usePushNotifications` client hook'u yazildi (permission → SW register → subscribe akisi).
- `public/sw.js` service worker push event + notificationclick handler'lariyla olusturuldu.
- 11 unit test (5 schema + 6 service) yazildi ve gecti.
- Tum repo test suite (540 test) hala yesil.

---

## 2. Olusturulan / Degistirilen Dosyalar

| Yol | Islem | Aciklama |
|------|-------|----------|
| `prisma/schema.prisma` | degisti | `PushSubscription` modeli + User relation eklendi |
| `src/lib/env.ts` | degisti | VAPID env alanlari (opsiyonel) eklendi |
| `.env`, `.env.example` | degisti | VAPID placeholder satirlari eklendi |
| `src/modules/push-notifications/schemas.ts` | yeni | Zod validation: SubscribePush, UnsubscribePush, PushPayload |
| `src/modules/push-notifications/repository.ts` | yeni | Prisma-backed veri erisim katmani (upsert, find, deactivate) |
| `src/modules/push-notifications/pushService.ts` | yeni | subscribe, unsubscribe, sendToUser, sendBroadcast (web-push SDK) |
| `src/modules/push-notifications/index.ts` | yeni | Barrel export |
| `src/modules/push-notifications/__tests__/pushService.test.ts` | yeni | 6 unit test (subscribe, unsubscribe, send, broadcast, 410 Gone) |
| `src/modules/push-notifications/__tests__/schemas.test.ts` | yeni | 5 schema validation testi |
| `src/app/api/push/vapid-key/route.ts` | yeni | GET public key endpoint |
| `src/app/api/push/subscribe/route.ts` | yeni | POST (subscribe) + DELETE (unsubscribe) |
| `src/hooks/usePushNotifications.ts` | yeni | Client hook: SW + pushManager + VAPID subscribe akisi |
| `public/sw.js` | yeni | Service worker: push + notificationclick + pushsubscriptionchange |

**Paket:** `web-push` zaten `package.json`'da `^3.6.7` olarak mevcut.
`@types/web-push` devDependency olarak eklendi (TS tip destegi icin).

---

## 3. Mimari

### 3.1 DB Katmani
```
User (1) ──< (N) PushSubscription
  └ endpoint (unique)
  └ p256dh, auth (ECDH public key + shared secret, base64url)
  └ active (boolean, soft-delete flag)
  └ @@index([userId, active])
```

Bir endpoint birden fazla user icin tekil olabilir (cihaz ortak kullanimi
edge case). Asagidaki `subscribe` endpoint'i upsert yaparak, ayni endpoint
ile tekrar subscribe edilirse user'i gunceller, eskiyi deaktif eder.

### 3.2 API Akisi
```
Browser                         Next.js API                       DB
  │                                │                               │
  │ GET /api/push/vapid-key        │                               │
  │ ─────────────────────────────> │                               │
  │                                │ env.NEXT_PUBLIC_VAPID_PUBLIC  │
  │ <──────── { publicKey } ────── │                               │
  │                                │                               │
  │ pushManager.subscribe(pubKey)  │                               │
  │  (returns PushSubscription)    │                               │
  │                                │                               │
  │ POST /api/push/subscribe       │                               │
  │ ─────────────────────────────> │ auth (session)                │
  │                                │ SubscribePushSchema.parse     │
  │                                │ pushRepository.upsert ─────>  │
  │                                │ <─────── sub record ──────── │
  │ <─────── { id, active } ────── │                               │
  │                                │                               │
  │ [server push tetikler]         │                               │
  │                                │ pushService.sendToUser        │
  │                                │ webpush.sendNotification      │
  │ <──── push event ──────────────│                               │
  │ self.registration.showNotif()  │                               │
```

### 3.3 Service Worker (`public/sw.js`)
- `install` → `skipWaiting()` (yeni SW hemen aktif olsun)
- `activate` → `clients.claim()` (mevcut client'lar kontrol altina alinsin)
- `push` → JSON payload parse, `showNotification(title, options)` ile goster
- `notificationclick` → ayni URL aciksa `focus`, yoksa `openWindow(targetUrl)`
- `pushsubscriptionchange` → yeni subscription'i otomatik backend'e POST

---

## 4. Servis Tasarimi

`pushService` 5 public metoda sahip:

| Method | Aciklama | Disable Davranisi (VAPID yok) |
|--------|----------|-------------------------------|
| `subscribe(userId, input)` | Upsert subscription | DB'ye yazar (calisir) |
| `unsubscribe(endpoint)` | Soft delete (active=false) | DB'ye yazar (calisir) |
| `sendToUser(userId, payload)` | Webpush.send x N subscriber | `{ sent: 0, failed: 0 }` |
| `sendBroadcast(payload)` | Tum aktif abonelere | `{ sent: 0, failed: 0 }` |
| `getPublicKey()` | VAPID public key | `''` (UI no-op) |
| `isEnabled()` | Feature flag | `false` |

**410 Gone / 404 Not Found** durumunda endpoint otomatik olarak
deaktif edilir (cunku tarayici aboneligi artik gecersiz). Bu durum
logger ile info seviyesinde loglanir, kullanicinin izni tekrar
istenmesi gerekmez — sadece bir daha push gelmez.

**Gonderim stratejisi:** `Promise.allSettled` ile paralel — bir abone
hatasinda digerleri etkilenmez. TTL 24 saat (push servisi 24 saat
icinde teslim edemezse otomatik drop eder).

---

## 5. Guvenlik Notlari

| Konu | Cozum |
|------|-------|
| Auth zorunlulugu | `getServerSession` her endpoint'te kontrol edilir |
| Admin hesap push | `userId === 'admin'` kontrolu — User tablosunda satir yok |
| Unsubscribe yetkisi | Endpoint'in sahibi olmayan user 403 alir |
| VAPID key guvenligi | Private key ASLA frontend'e gitmez (sadece public) |
| Input validation | Zod ile tum payload'lar dogrulanir |
| Rate limit | TODO — gelecekte per-user gonderim limiti eklenebilir |
| Click-jacking | Bildirim `targetUrl` self.clients.openWindow ile acilir (sadece kendi origin) |

---

## 6. Kurulum (Production)

```bash
# 1. VAPID key uret (bir kez)
npx web-push generate-vapid-keys

# Cikti:
#   Public Key:  BLc4xRzKlKORKWl9lXh7...
#   Private Key: Q3K9XzF8...
#   Subject:     mailto:admin@noktanyus.com

# 2. .env'e yaz (GERCEK degerlerle):
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLc4xRzKlKORKWl9lXh7...
VAPID_PRIVATE_KEY=Q3K9XzF8...
VAPID_SUBJECT=mailto:admin@noktanyus.com

# 3. DB push (zaten calistirildi)
npx prisma db push

# 4. Frontend'den kullan:
const { subscribe, isEnabled } = usePushNotifications();
if (isEnabled) await subscribe();
```

**Not:** VAPID yoksa `usePushNotifications().status === 'unconfigured'`
olur ve UI "Push notifications unavailable" mesaji gosterir.

---

## 7. Test Sonuclari

```
✓ src/modules/push-notifications/__tests__/schemas.test.ts (5 tests)
✓ src/modules/push-notifications/__tests__/pushService.test.ts (6 tests)

Test Files  2 passed (2)
     Tests  11 passed (11)
```

**Test edilen senaryolar:**
1. `SubscribePushSchema` valid input'u kabul eder
2. `SubscribePushSchema` missing keys reddeder
3. `SubscribePushSchema` non-url endpoint reddeder
4. `UnsubscribePushSchema` endpoint zorunlu
5. `PushPayloadSchema` title+body zorunlu
6. `pushService.isEnabled()` env presence ile dogru calisir
7. `pushService.subscribe()` repository upsert cagirir
8. `pushService.unsubscribe()` soft-delete yapar
9. `sendToUser()` VAPID yoksa 0/0 doner (no-op)
10. `sendToUser()` 410 Gone alinca subscription'i deaktif eder
11. `sendBroadcast()` tum subscriber'lara basarili push atar

**Tum repo:** 540 test / 57 dosya basarili, push-notifications modulu
eklenmesi ile herhangi bir regression yok.

**Type-check:** `npx tsc --noEmit` push ile ilgili dosyalarda 0 hata.

---

## 8. Kullanim Ornegi (Frontend)

```tsx
'use client';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationToggle() {
  const { status, isSubscribed, subscribe, unsubscribe, isSupported } =
    usePushNotifications();

  if (!isSupported) return <p>Bu tarayici push desteklemiyor.</p>;
  if (status === 'unconfigured')
    return <p>Push notifications sunucu tarafinda aktif degil.</p>;
  if (status === 'denied')
    return <p>Push izni reddedildi. Tarayici ayarlarindan acabilirsiniz.</p>;

  return (
    <button
      onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
      disabled={status === 'subscribing'}
    >
      {isSubscribed ? 'Bildirimleri kapat' : 'Bildirimlere abone ol'}
    </button>
  );
}
```

---

## 9. Gelecek Iyilestirmeler (TODO — bu PR'in parcasi degil)

- [ ] Admin panel'den broadcast UI'i (`sendBroadcast` zaten hazir)
- [ ] Kullanici basina gonderim rate limit (spam korumasi)
- [ ] In-app `Notification` tablosu ile push payload zenginlestirme
  (zaten mevcut `notificationService.dispatch` ile entegre edilebilir)
- [ ] VAPID key rotation script (yillik)
- [ ] E2E test (Playwright) — notification gosterim + click akisi
- [ ] Real-time push queue (Redis pub/sub ile olay tetikleme)

---

## 10. Bilinen Kisitlamalar

1. **iOS Safari destegi:** Safari 16.4+ push destekliyor ama sadece
   kullanici siteyi "Add to Home Screen" ile ekledikten sonra. Stand-alone
   web'de iOS push calismaz. Bu tarayici/API siniri, kod tarafinda cozu
   yok.
2. **Service Worker scope:** `/sw.js` root scope'ta kayit olur. Next.js
   alt route'larinda da push calisir (Service Worker tum origin'e yayilir).
3. **Subscription expiry:** Tarayici kendi insiyatifiyle subscription'i
   iptal edebilir (kullanici tarayici verilerini silerse). Bu durumda
   410 Gone doner ve otomatik deaktif edilir. Kullanici tekrar subscribe
   olmasi gerekir.