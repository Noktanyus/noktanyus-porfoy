# TODO List

Bu dosya, codebase'de tespit edilen ve ileride ele alınması gereken
teknik borç / eksik / açık konuları içerir.

> **Kural:** Yeni TODO eklerken kategori ve öncelik belirtin. Süresi geçen
> veya tamamlanan TODO'ları bu dosyadan kaldırıp `docs/CHANGELOG.md` veya
> commit mesajına taşıyın.

> **Son tarama:** 2026-09-11 — planlanan ama yapılmamış işlemler, stub'lar,
> çift implementasyonlar ve ops kablolama boşlukları kod + docs üzerinden
> doğrulandı.

---

## Sistemik kök nedenler

Bu listedeki çoğu madde rastgele unutulmuş iş değil; aynı birkaç yapısal
desenin tekrarı:

1. **Faz yığılması, entegrasyon yok.** Video Calls, SAML, Partner, Loyalty,
   GraphQL, Branding gibi fazlar schema + service + test ile kapatılmış;
   production kablolaması (cron, admin UI, gerçek protokol, session) sonraya
   bırakılmış ve bir daha alınmamış.
2. **Gölge implementasyon.** Aynı domain için stub + “asıl” modül yan yana
   duruyor; HTTP route’lar genelde stub’ı çağırıyor. Örnek: `lib/saml.ts`
   vs `modules/saml`, `lib/rateLimit.ts` vs `lib/rate-limiter.ts`,
   `lib/sandbox.ts` vs `modules/sandbox`, `lib/graphql` vs `modules/graphql`.
3. **Ops kablolaması ters.** Kodda cron route’ları var, `vercel.json`’daki
   cron path’leri ise mevcut olmayan endpoint’lere bakıyor. README/DEPLOYMENT
   üçüncü bir (eski) liste tutuyor.
4. **Admin yüzey eksik.** Campaigns, partners, loyalty rewards, push
   broadcast, SAML config gibi backend’ler var; sidebar’da/moderation
   panelinde yok. Kullanıcı feature’ı “tamam” sanıyor, operasyon yapılamıyor.
5. **Dokümantasyon sapması.** Bu dosyadaki CSP maddesi güncel koda uymuyordu
   (`middleware.ts` CSP’yi kapatmıyor, `unsafe-inline` ile açık).
   `docs/CHANGELOG.md` referans ediliyor ama dosya yok.

---

## 🔴 Yüksek Öncelik

### Security / Auth

- **SAML SSO production’da stub.** `src/app/api/auth/saml/route.ts` ve
  `callback/route.ts` `@/lib/saml` stub’ını kullanıyor: AuthnRequest
  `SAMLRequest=stub`, `processCallback` boş email döner, session
  başlatılmaz (sadece `/giris?status=saml_ok` redirect). Asıl
  `@node-saml/node-saml` akışı `src/modules/saml/service.ts` içinde duruyor
  ama route’lara bağlanmamış. Üstüne `prisma.ssoConfig` çağrılıyor oysa
  `prisma/schema.prisma` içinde `SsoConfig` modeli **yok** — production
  wiring yapılsa bile Prisma kırılır.
  - Yapılacak: schema’ya workspace-scoped `SsoConfig` ekle; ACS route’u
    `samlAuthService` + NextAuth JWT’ye bağla; stub `lib/saml.ts`’i sil
    veya ince wrapper’a indir.
- **CSP hâlâ `unsafe-inline`.** `src/middleware.ts` CSP’yi kapatmıyor
  (eski TODO yanlıştı); `script-src` / `style-src` içinde `'unsafe-inline'`
  var, nonce yok. `unsafe-eval` bu sürümde yok. next-intl çıktıları için
  nonce enjeksiyonu hâlâ yapılmadı. Matcher API’yi hariç tutuyor
  (`/((?!api|_next/static|...)`) — API yanıtlarında bu CSP uygulanmaz.
- **Partner lead formu botsuz + SSRF.** `POST /api/partners/lead` public,
  Turnstile yok (`PartnerLeadForm` sadece email regex). `notifyPartner`
  `webhookUrl`’e ham `fetch` atıyor; private IP / metadata host allowlist’i
  yok. `webhookSecret` DB’de düz metin.
  Kaynak: `docs/PARTNER_PROGRAM.md` §6–7.
- **Turnstile env tutarsızlığı.** Bileşen
  `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` okuyor
  (`CloudflareTurnstile.tsx`); iletişim formu production bayrağı
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ile karar veriyor (`IletisimForm.tsx`).
  README hâlâ eski ismi listeliyor. Production’da form “prod” sanıp
  widget’ı atlayabilir veya tersi.

### Ops / Cron (planlandı, scheduler’a hiç bağlanmadı)

`vercel.json` şu an **olmayan** 3 path’i cronluyor:

| vercel.json path | Durum |
|---|---|
| `/api/cron/cleanup-funnel-events` | Route yok |
| `/api/cron/refresh-exchange-rates` | Route yok |
| `/api/cron/subscription-renewal-check` | Route yok |

Kodda **var** ama `vercel.json`’da **yok** (production’da hiç çalışmaz):

| Mevcut route | Amaç |
|---|---|
| `/api/cron/publish-scheduled` | Zamanlanmış blog yayını |
| `/api/cron/webhook-retry` | Webhook DLQ retry |
| `/api/cron/subscription-resume` | Pause süresi biten abonelikleri aç |
| `/api/cron/run-campaigns` | Email marketing campaign runner |
| `/api/monitors/check-all` | Uptime check (README “her 5 dk” der) |

`docs/DEPLOYMENT.md` hâlâ yalnızca `check-all` */5 listeler.
Sonuç: scheduled blog, webhook retry, campaign runner, monitor check ve
subscription auto-resume Vercel’de tetiklenmez; tanımlı cron’lar 404 üretir.

- **Kırık admin redirect.** `vercel.json` `/admin` →
  `/admin/(protected)/dashboard`. Route group URL’de yoktur; doğru hedef
  `/admin/dashboard`.

---

## 🟡 Orta Öncelik

### Security / CSP (devam)

- Nonce-based CSP’ye geçiş (yüksek maddenin uygulama adımı).
- Partner webhook allowlist + secret encryption-at-rest.
- GraphQL public `monitors { url, status }` — auth/scope yok; tenant
  URL’leri sızabilir (`src/lib/graphql/schema.ts`).
- Middleware audit: admin write’lar `console.info(AUDIT_PENDING)` ile
  loglanıyor, `auditLog` tablosuna yazılmıyor (`src/middleware.ts`).

### Duplicate / gölge katmanlar (bakım borcu)

- **Rate limit:** `src/lib/rateLimit.ts` (token bucket, çoğu API) +
  `src/lib/rate-limiter.ts` (fixed window, yalnızca `/api/contact`).
  Serverless’te ikisi de in-memory; instance’lar paylaşmaz. TODO’daki
  sliding-window geçişi hâlâ yapılmadı; önce tek implementasyona inmek
  gerekir.
- **Sandbox:** `src/lib/sandbox.ts` admin reset guard’ı; `src/modules/sandbox`
  (detector / mock-payment / fake-data) test dışında neredeyse kullanılmıyor.
- **GraphQL:** `src/lib/graphql/*` + `src/lib/apollo.ts` cache placeholder
  (`globalThis.__gqlCache`) ile `src/modules/graphql/*` (context/validation)
  yan yana. Mutation yok (bilinçli, D4). Redis cache “genişletilebilir”
  denmiş, yapılmamış.
- **Queue:** `ImageOptimize` ve `OrderExpire` job adları tanımlı, handler
  kayıtlı değil (`src/lib/queueHandlers.ts` yalnızca Email / Monitor /
  Newsletter). REDIS_URL yoksa in-memory; Vercel’de job kaybı beklenen
  davranış, dokümante ama prod riski.

### Stub / yarım protokoller

- **WebRTC Video Calls:** DB + REST lifecycle var; UI
  `getUserMedia` local preview. PeerConnection, signaling (Socket.IO),
  TURN yok. `recordingEnabled` / `recordingUrl` kolonları kullanılmıyor.
  `assertHostHasCredits` create’de var, kredi düşümü / endCall’da debit yok.
  `VideoRoom.tsx` “demo mode” banner’ı gösteriyor.
- **Custom domain DNS:** `GET /api/custom-domain/[domain]` format geçerse
  `verified: true` döner; CNAME/A lookup yok
  (`brandingService.validateCustomDomain`).
- **Chat:** `ChatWidget` + API tam; widget hiçbir layout’a mount edilmemiş
  (ölü UI). Real-time yok (polling/SSE/socket yok). Admin chat inbox yok.
- **i18n:** `next-intl` plugin + `NextIntlClientProvider` var; middleware
  yorumu “next-intl devre dışı - prod build'de parse hatası”. Locale
  prefix routing (`/en/...`) middleware’den geçmiyor; TR/EN mesaj dosyaları
  var ama URL tabanlı locale switch yarım.

### Planlanan admin / ürün yüzeyleri (docs’ta açık, kodda yok)

**Partner (`docs/PARTNER_PROGRAM.md` §7):**

- [ ] `/admin/partners` moderation (verified toggle) — sidebar’da da yok
- [ ] Lead formuna Turnstile
- [ ] Partner webhook retry + DLQ (`WebhookEvent` pattern’i yeniden kullanılabilir)
- [ ] `PartnerPayout` modeli + payout lifecycle (schema’da yok; AffiliatePayout var)
- [ ] Lead CSV export
- [ ] Slug rename endpoint
- [ ] Partner branding (logo, renk) landing customization

**Push (`docs/push-notifications-impl.md` §9):**

- [ ] Admin broadcast UI (`sendBroadcast` serviste hazır)
- [ ] Per-user gönderim rate limit
- [ ] In-app `Notification` tablosu ile payload zenginleştirme
- [ ] VAPID key rotation script
- [ ] Playwright E2E (gösterim + click)
- [ ] Redis pub/sub ile event tetikleme

**Loyalty (`docs/LOYALTY-PROGRAM-RAPOR.md` §12):**

- [ ] `LoyaltyReward` seed data
- [ ] Birthday bonus cron (kural + `onBirthday` var, scheduler yok)
- [ ] Refund’ta puan geri alma (`order.refunded` webhook)
- [ ] Tier yükseliş e-postası
- [ ] Admin reward CRUD
- [ ] `stock` kolonu şema’da var, serviste kullanılmıyor
- [ ] `onReview` / `onSignup` / `onReferral` serviste var, commerce/auth
      hook’larından çağrılmıyor (yalnızca `onPurchase` bağlı)

**Email marketing:**

- `/admin/campaigns` sayfası var, `AdminSidebar` navLinks içinde yok —
  URL bilinmeden erişilemez.
- `run-campaigns` cron’u scheduler’a bağlı değil (yüksek öncelik).

### Tip güvenliği

- Dashboard / API yüzeyinde `(session.user as any).id` hâlâ yaygın
  (`dashboard/page.tsx`, monitors, loyalty, affiliate, api-keys, reports…).
  NextAuth augmentation mevcut; önceki refinement yalnızca
  `email-preferences` route’unu temizlemiş.
- `src/lib/auth.ts` JWT callback’lerinde `as any` zinciri.
- Chat `increment` Prisma operatörü `{ increment: 1 } as any`.

### Performans / a11y (bilinen sınırlar)

- Admin dashboard ~23 paralel Prisma count/aggregate
  (`src/app/admin/(protected)/dashboard/page.tsx`). Helper’a indirgeme
  hâlâ yapılmadı.
- Accent color runtime: `--accent` set edilir, Tailwind sınıfları anlık
  güncellenmez (`docs/PHASE_F1_F2_REPORT.md`).
- Guest accent localStorage’da persist edilmiyor (yenilemede kaybolur).
- `validateA11y` / `modules/accessibility/audit.ts` regex/DOM kontrolü;
  axe-core “gelecek phase” olarak bırakılmış.

---

## 🟢 Düşük Öncelik

### Gelecek iyileştirmeler

- **API Gateway rate limit:** token-bucket → Redis-backed sliding window
  (önce tek limiter’a birleşmeli).
- **GraphQL:** Redis cache backend; SHA-256 cache key (şu an 32-bit hash);
  write mutation’lar bilinçli olarak REST’te.
- **Report builder schedule:** `CustomReport.schedule` / `recipients` alanları
  var; daily/weekly cron + e-posta gönderimi yok.
- **Affiliate payout ops:** `requestPayout` pending kayıt açar, bakiye
  sıfırlar; admin onay / Stripe/PayPal gerçek ödeme akışı yok.
- **Video recording + signaling** (yüksek/orta stub’ın tam production’ı).
- **Mobile:** Expo uygulaması ayrı paket; faz raporları “Expo SDK eksik /
  module-not-found” diyor. Web CI mobile’ı type-check etmiyor.
- **E2E boşlukları:** Playwright seti public sayfalar (home, blog, store,
  auth, a11y). Dashboard, admin, checkout, SAML, push, partner lead,
  video call yok.
- **`docs/CHANGELOG.md` yok** — TODO kuralı buraya arşivlemeyi söylüyor.
- **Test kirliliği:** `pushService.test.ts` env eksikken 0 test ile geçebilir
  (`log.txt`); GlobalSearch `act(...)` uyarıları.
- **`force-dynamic` global** (`src/app/layout.tsx`) — RSC cache / ISR
  bilinçli kapatılmış; içerik sayfalarında maliyet.

### Dokümantasyon sapması (düzeltilecek)

- README “SAML SSO stub”, “Video calls stub” doğru; cron cümlesi
  (`check-all` her 5 dk) `vercel.json` ile çelişiyor.
- `docs/DEPLOYMENT.md` cron örneği tek path, güncel değil.
- Bu dosyadaki eski “CSP geçici devre dışı” maddesi kaldırıldı
  (kodda CSP açık, zayıf).

---

## ✅ Tamamlanan (Arşiv)

Aşağıdaki öğeler önceki refinement turunda düzeltildi:

- [x] `src/lib/apiResponse.ts` — `withErrorHandling` overload imzaları
  generic `T` parametresi ile güncellendi; route handler'lar artık tip
  güvenli.
- [x] `src/modules/email-marketing/service.ts` — Prisma `{ increment }`
  operatörü için `BaseRepository.update` daraltması yerine yeni
  `incrementCounter` metodu eklendi.
- [x] `src/modules/email-marketing/repository.ts` — `incrementCounter`
  helper'ı ile atomik sayaç artışları tip güvenli hale getirildi.
- [x] `src/app/api/cron/run-campaigns/route.ts` — Unauthorized response
  generic `Response` yerine `NextResponse.json` ile standartlaştırıldı.
- [x] `src/app/api/user/email-preferences/route.ts` — `(session.user as any).id`
  kullanımı kaldırıldı (NextAuth type augmentation zaten mevcut).
- [x] `src/app/api/blogs/[slug]/comments/route.ts`,
  `src/app/api/comments/[id]/route.ts` — Yanlış `as NextResponse` cast'i
  kaldırıldı; `fail()` zaten `NextResponse<ApiError>` döndürüyor.
- [x] `.env.example` — `TOTP_ISSUER` eklendi.
- [x] `README.md` — Yeni eklenen modüller (Auth, i18n, SEO, Payments,
  Advanced, vb.) özellikler bölümüne eklendi.
