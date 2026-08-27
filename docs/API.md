# API Reference

Tüm endpoint'ler JSON döner. Next.js App Router RESTful pattern kullanılır
(`/app/api/<resource>/route.ts`).

> **Base URL (dev):** `http://localhost:3000`
> **Base URL (prod):** `https://<your-domain>`

---

## İçindekiler

- [Standard Response Format](#standard-response-format)
- [Authentication](#authentication)
- [Content](#content)
- [Commerce](#commerce)
- [Monitoring](#monitoring)
- [Workspaces & Members](#workspaces--members)
- [API Keys](#api-keys)
- [Newsletter](#newsletter)
- [Comments](#comments)
- [User Account](#user-account)
- [Admin](#admin)
- [Misc](#misc)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)

---

## Standard Response Format

`src/lib/apiResponse.ts` içindeki `ok()` / `created()` / `fail()` yardımcıları
ile her endpoint aynı zarfı döner:

### Başarılı (2xx)

```json
{
  "success": true,
  "data": { "id": "ckxxxx", "name": "Example" },
  "meta": { "total": 100, "page": 1, "limit": 20 }
}
```

- `meta.total / page / limit` opsiyoneldir; sadece pagination dönen
  endpoint'lerde görünür (`/api/products`, `/api/blogs/[slug]/comments` vb.).

### Hata (4xx / 5xx)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validasyon hatası",
    "details": {
      "fieldErrors": { "email": ["Geçerli bir e-posta girin"] },
      "formErrors": []
    }
  }
}
```

`withErrorHandling()` sarmalayıcısı beklenmeyen hataları yakalar ve 500 ile
döner. Hassas veri (şifre, API key) response veya log'a **asla** düşmez.

---

## Authentication

NextAuth session cookie ile. `getServerSession()` veya `signIn()` kullanılır.
Session JWT içinde `userId` ve (admin ise) `role: "admin"` taşınır.

Bir kısım endpoint admin-only'dir (`withAdminAuth` wrapper). Bir kısım ise
giriş zorunlu tutar (`requireUser` / `getCurrentUser`).

### `POST /api/auth/[...nextauth]`

NextAuth catch-all rotası. Credentials provider ile email + şifre doğrular.

- **Request body (form-encoded):** `email`, `password`, `csrfToken`
- **Response:** `200 { url: "..." }` veya `401`
- **Not:** Doğrudan çağrılmaz; `signIn("credentials", ...)` tarafından kullanılır.

### `POST /api/auth/register`

Yeni kullanıcı hesabı oluşturur.

- **Rate limit:** `api` (10 req / dk)
- **Body:**
  ```json
  { "name": "Yunus", "email": "yunus@example.com", "password": "StrongP@ss123" }
  ```
- **Validation (Zod):**
  - `name`: 2-100 karakter
  - `email`: geçerli format, lowercase + trim
  - `password`: min 8, max 128
- **Response:** `201 { success: true, data: { id, email, name } }`
- **Errors:** `CONFLICT` (email zaten kayıtlı), `VALIDATION_ERROR`,
  `RATE_LIMITED`

---

## Content

### `GET /api/about`

Hakkımda sayfası verisini (isim, başlık, sosyal medya, deneyimler, yetenekler)
döner.

- **Auth:** Public
- **Response:** `200 { success: true, data: About }`

### `GET /api/blogs/[slug]/comments`

Bir blog yazısına ait onaylanmış yorumları sayfalı döner.

- **Query:** `?page=1&limit=20`
- **Auth:** Public
- **Response:** `200 { success: true, data: Comment[], meta: { total, page, limit } }`

### `GET /api/search`

Global arama (blog, proje, ürün, popup).

- **Query:** `?q=nextjs`
- **Backend:** Fuse.js fuzzy search (in-memory)
- **Auth:** Public
- **Response:** `200 { success: true, data: SearchResult[] }`

### `GET /api/popups/[slug]`

Aktif popup içeriğini slug ile döner. Slug bulunamazsa `404 NOT_FOUND`.

### `GET /api/static/[...file]`

Statik dosya proxy'si (private assets).

### `GET /api/images/[...filename]`

R2 veya local filesystem'ten görsel döner. Cache header'ları ile birlikte.

---

## Commerce

### `GET /api/products`

Aktif dijital ürünleri listeler.

- **Query:** `?category=<slug>&take=<n>&skip=<n>`
- **Auth:** Public
- **Response:** `200 { success: true, data: Product[] }`

### `GET /api/products/[slug]`

Tek bir ürünün detayını döner.

- **Auth:** Public
- **Errors:** `404 NOT_FOUND` (slug yoksa)

### `GET /api/plans`

Mevcut abonelik planlarını döner (Starter / Pro / Enterprise).

- **Auth:** Public
- **Response:** `200 { success: true, data: Plan[] }`

### `POST /api/coupons/validate`

Kupon kodunu doğrular, indirim tutarını hesaplar.

- **Rate limit:** `api`
- **Body:** `{ "code": "WELCOME10", "subtotal": 100 }`
- **Response:** `200 { success: true, data: { valid: true, discount: 10, finalAmount: 90 } }`
- **Errors:** `404 NOT_FOUND`, `VALIDATION_ERROR`

### `POST /api/checkout/product`

Tek-seferlik dijital ürün satın alma (Stripe Checkout session oluşturur).

- **Rate limit:** `api`
- **Auth:** User
- **Body:** `{ "productId": "...", "couponCode": "WELCOME10" }`
- **Response:** `200 { success: true, data: { url: "https://checkout.stripe.com/..." } }`

### `POST /api/checkout/subscription`

Abonelik başlatma (Stripe Checkout subscription session).

- **Rate limit:** `api`
- **Auth:** User
- **Body:** `{ "planId": "...", "provider": "stripe" | "iyzico" }`
- **Response:** `200 { success: true, data: { url: "..." } }`

### `POST /api/checkout/subscription-portal`

Mevcut aboneliği yönetmek için Stripe Billing Portal URL'i döner.

- **Rate limit:** `api`
- **Auth:** User
- **Response:** `200 { success: true, data: { url: "..." } }`

### `POST /api/webhooks/stripe`

Stripe webhook receiver. Signature doğrular, idempotency kontrolü yapar.

- **Auth:** Stripe signature header
- **Body:** Raw Stripe event payload
- **Events handled:** `checkout.session.completed`,
  `customer.subscription.created/updated/deleted`,
  `invoice.payment_succeeded/failed`
- **Errors:** `400 MISSING_SIGNATURE`, `INVALID_SIGNATURE`

### `GET /api/user/products`

Kullanıcının satın aldığı dijital ürünleri + aktif lisans anahtarlarını listeler.

- **Auth:** User
- **Response:** `200 { success: true, data: UserProduct[] }`

### `POST /api/user/products`

Kullanıcıya manuel ürün atama (admin işlemi).

- **Auth:** Admin
- **Body:** `{ "userId": "...", "productId": "..." }`

### `POST /api/user/orders/[id]/refund`

Stripe üzerinden iade işlemi başlatır.

- **Auth:** User (sipariş sahibi) veya Admin
- **Response:** `200 { success: true, data: Refund }`

---

## Monitoring

### `GET /api/monitors`

Workspace'e ait tüm monitor'leri listeler.

- **Auth:** User
- **Response:** `200 { success: true, data: Monitor[] }`

### `GET /api/monitors/[id]`

Tek bir monitor'ün son durumunu + kontrol geçmişini döner.

- **Auth:** User
- **Response:** `200 { success: true, data: Monitor & { checks: MonitorCheck[] } }`

### `POST /api/monitors` (create/update)

Yeni monitor oluşturur. Body:

```json
{
  "name": "My API",
  "type": "http" | "ping" | "port" | "keyword" | "json",
  "url": "https://api.example.com/health",
  "intervalSeconds": 300,
  "alertChannelIds": ["..."]
}
```

- **Auth:** User
- **Validation:** `Zod` schema ile tip-specific validasyon (URL format, port
  range, keyword string vb.).

### `POST /api/monitors/check-all`

Tüm aktif monitor'leri kontrol eder. **Vercel Cron** tarafından her 5 dakikada
çağrılır (`vercel.json`).

- **Auth:** `Authorization: Bearer <CRON_SECRET>`
- **Response:** `200 { success: true, data: { checked: 12, failed: 1 } }`
- **Errors:** `401 UNAUTHORIZED` (secret yanlışsa)

### `GET /api/alert-channels`

Alert kanalı listesi (email, webhook, Slack, Discord, Telegram).

- **Auth:** User
- **Response:** `200 { success: true, data: AlertChannel[] }`

### `DELETE /api/alert-channels/[id]`

Alert kanalını siler.

- **Auth:** User (sahibi)
- **Response:** `204`

---

## Workspaces & Members

Multi-tenant yapı: workspace → members → role (OWNER/ADMIN/EDITOR/VIEWER).

### `GET /api/workspaces`

Kullanıcının üye olduğu workspace'leri listeler.

- **Auth:** User
- **Response:** `200 { success: true, data: Workspace[] }`

### `POST /api/workspaces`

Yeni workspace oluşturur (oluşturan kişi OWNER olur).

- **Auth:** User
- **Body:** `{ "name": "Acme Corp", "slug": "acme" }`
- **Validation:** `slug` unique, regex `[a-z0-9-]{2,40}`

### `GET /api/workspaces/[id]`

Tek workspace detayı + member listesi.

- **Auth:** User (üye)
- **Response:** `200 { success: true, data: Workspace & { members: Member[] } }`

### `PATCH /api/workspaces/[id]`

Workspace adını/slug'unu günceller.

- **Auth:** User (ADMIN veya OWNER)

### `DELETE /api/workspaces/[id]`

Workspace'i siler (soft delete).

- **Auth:** User (OWNER)

### `GET /api/workspaces/[id]/members`

Üye listesi.

### `POST /api/workspaces/[id]/members`

Yeni üye davet eder (email + role).

- **Auth:** User (ADMIN veya OWNER)
- **Body:** `{ "email": "...", "role": "EDITOR" }`

### `DELETE /api/workspaces/[id]/members?userId=<id>`

Üyeyi çıkarır.

- **Auth:** User (ADMIN veya OWNER)
- **Constraint:** Son OWNER çıkarılamaz.

### `POST /api/workspaces/invitations/accept`

Davet token'ı ile workspace'e katılır.

- **Body:** `{ "token": "..." }`

---

## API Keys

### `GET /api/user/api-keys`

Kullanıcının API key'lerini listeler (ham key gösterilmez, sadece prefix).

- **Auth:** User
- **Response:** `200 { success: true, data: ApiKey[] }`

### `POST /api/user/api-keys`

Yeni API key oluşturur.

- **Auth:** User
- **Body:**
  ```json
  {
    "name": "Production Server",
    "scopes": ["read:monitors", "write:monitors"],
    "rateLimitPerMinute": 60,
    "expiresAt": "2027-01-01T00:00:00Z"
  }
  ```
- **Response:** `201 { success: true, data: { id, key: "nkt_xxx_secret_only_once" } }`
- **Not:** `key` alanı yalnızca oluşturma anında döner, sonra gösterilmez.

### `PATCH /api/user/api-keys/[id]`

Key adını / scope'larını / aktiflik durumunu günceller.

### `DELETE /api/user/api-keys/[id]`

Key'i siler.

---

## Newsletter

Double opt-in akışı: subscribe → email doğrulama linki → verify.

### `POST /api/newsletter/subscribe`

Email kaydeder ve doğrulama maili gönderir.

- **Rate limit:** `api`
- **Body:** `{ "email": "user@example.com", "name": "Yunus" }`
- **Response:** `200 { success: true, data: { message: "Doğrulama maili gönderildi" } }`
- **Errors:** `CONFLICT` (zaten kayıtlı), `VALIDATION_ERROR`

### `GET /api/newsletter/verify?token=<token>`

Email doğrulama. Subscriber durumunu `VERIFIED`'a çeker.

- **Auth:** Public (token ile)
- **Response:** `200 { success: true, data: { verified: true } }`
- **Errors:** `400 INVALID_TOKEN`, `410 EXPIRED`

### `GET /api/newsletter/unsubscribe?token=<token>`

Abonelikten çık. Subscriber'ı `UNSUBSCRIBED` yapar.

- **Auth:** Public (token ile)
- **Response:** `200 { success: true, data: { unsubscribed: true } }`

---

## Comments

### `PATCH /api/comments/[id]`

Yorumu düzenler (sadece sahibi veya admin).

- **Auth:** User (sahibi)
- **Body:** `{ "content": "..." }`

### `DELETE /api/comments/[id]`

Yorumu siler (soft delete).

- **Auth:** User (sahibi) veya Admin

### `POST /api/admin/reply`

Admin bir yoruma cevap yazar.

- **Auth:** Admin
- **Body:** `{ "commentId": "...", "content": "..." }`

---

## User Account

### `PATCH /api/user/profile`

Profil bilgilerini günceller (ad, avatar URL).

- **Auth:** User
- **Body:** `{ "name": "...", "avatar": "https://..." }`

### `PATCH /api/user/password`

Şifre değiştirir. Mevcut şifre doğrulanır.

- **Auth:** User
- **Body:** `{ "currentPassword": "...", "newPassword": "..." }`
- **Errors:** `401 INVALID_CURRENT_PASSWORD`

### `DELETE /api/user/delete`

Hesabı siler (GDPR uyumlu soft delete + veri anonymization).

- **Auth:** User
- **Body:** `{ "password": "..." }` (doğrulama için)

### `POST /api/contact`

İletişim formu. Mesajı kaydeder + admin'e email gönderir.

- **Rate limit:** `api`
- **Body:** `{ "name": "...", "email": "...", "message": "..." }`
- **Not:** Cloudflare Turnstile token opsiyonel (prod'da zorunlu).

### `POST /api/verify-turnstile`

Cloudflare Turnstile token doğrular.

- **Body:** `{ "token": "..." }`
- **Response:** `200 { success: true, data: { success: true } }`

---

## Admin

Tüm admin endpoint'leri `withAdminAuth()` wrapper'ı ile korunur.
Session'da `role === "admin"` yoksa `403 FORBIDDEN`.

### `GET /api/admin/content`

Tüm içerik (blog + project + popup) özetini döner.

### `POST /api/admin/content`

Yeni blog / project / popup oluşturur.

### `DELETE /api/admin/content?id=<id>`

İçerik siler.

### `GET /api/admin/settings`

Site ayarlarını döner (Cloudflare Turnstile, sosyal linkler, vb.).

### `POST /api/admin/settings`

Ayar günceller.

### `GET /api/admin/images`

Yüklü görselleri listeler.

### `DELETE /api/admin/images?id=<id>`

Görseli siler (R2 + DB kaydı).

### `POST /api/admin/upload`

Görsel yükler (multipart/form-data, `file` alanı). R2 veya local fallback.

- **Limit:** 5MB / dosya
- **Auth:** Admin

### `DELETE /api/admin/blog/[slug]`

Blog yazısını siler.

### `DELETE /api/admin/projects/[slug]`

Proje siler.

### `DELETE /api/admin/popups/[slug]`

Popup siler.

### `DELETE /api/admin/products/[id]`

Ürünü siler (soft delete).

### `PATCH /api/admin/products/[id]/toggle-active`

Ürünün aktiflik durumunu değiştirir.

### `POST /api/admin/hakkimda`

Hakkımda sayfası içeriğini günceller.

### `POST /api/admin/newsletter/broadcast`

Newsletter broadcast gönderir (Resend API).

- **Rate limit:** `adminApi`
- **Body:** `{ "subject": "...", "html": "..." }`

### Git Operations (admin)

- `GET /api/admin/git/branches` — branch listesi
- `GET /api/admin/git/log?limit=<n>` — son commit'ler
- `POST /api/admin/git/test-connection` — remote bağlantı testi
- `POST /api/admin/git/commit-all` — tüm değişiklikleri commit + push
- `POST /api/admin/git/revert` — son commit'i geri al
- `POST /api/admin/git/switch-branch` — branch değiştir

### `POST /api/test-email`

SMTP / Resend bağlantısını test eder.

---

## Misc

### `POST /api/upload`

Public görsel yükleme (örneğin kullanıcı avatarı).

- **Auth:** User
- **Rate limit:** `api`

---

## Error Codes

| Code | HTTP | Açıklama |
|------|------|----------|
| `UNAUTHORIZED` | 401 | Giriş gerekli veya session geçersiz |
| `FORBIDDEN` | 403 | Yetkisiz erişim (RBAC) |
| `NOT_FOUND` | 404 | Kaynak bulunamadı |
| `CONFLICT` | 409 | Çakışma (duplicate email, slug, vb.) |
| `VALIDATION_ERROR` | 400 | Zod validasyon hatası |
| `RATE_LIMITED` | 429 | Rate limit aşıldı |
| `INVALID_TOKEN` | 400 | Geçersiz veya süresi dolmuş token |
| `INVALID_CREDENTIALS` | 401 | Email/şifre eşleşmiyor |
| `PAYMENT_REQUIRED` | 402 | Ödeme gerekli |
| `WEBHOOK_SIGNATURE_INVALID` | 400 | Stripe signature doğrulanamadı |
| `INTERNAL_ERROR` | 500 | Beklenmeyen sunucu hatası |
| `SERVICE_UNAVAILABLE` | 503 | Bağımlı servis (DB, R2, SMTP) kapalı |

---

## Rate Limiting

`src/lib/rateLimit.ts` token-bucket implementasyonu. Üç katman:

| Bucket | Limit | Endpoint'ler |
|--------|-------|---------------|
| `api` | 10 req / dk / IP | `/api/auth/register`, `/api/checkout/*`, `/api/newsletter/subscribe`, `/api/coupons/validate`, `/api/upload`, `/api/contact` |
| `adminApi` | 30 req / dk / IP | `/api/admin/newsletter/broadcast` |
| `search` | 60 req / dk / IP | `/api/search` |

**Response (429):**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Çok fazla istek. Lütfen bekleyin.",
    "details": { "retryAfter": 42 }
  }
}
```

`Retry-After` header'ı saniye cinsinden döner.

---

## Güvenlik Notları

1. **Tüm endpoint'ler** Zod ile validate edilir — beklenmeyen alanlar
   sessizce düşmez, `VALIDATION_ERROR` ile geri çevrilir.
2. **Şifreler** bcrypt 12-round ile hash'lenir; response/log'a düşmez.
3. **API key'ler** SHA-256 hash olarak DB'de tutulur; plaintext yalnızca
   oluşturma anında döner.
4. **Stripe webhook** raw body + signature doğrulaması zorunlu.
5. **CORS**: `next.config.mjs` içinde sıkı origin allowlist.
6. **CSP / Security headers** `next.config.mjs` `headers()` ile set edilir.
