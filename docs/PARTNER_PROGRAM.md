# Partner Program — Phase Implementation Report

**Phase:** D Serisi / Partner Program
**Date:** 2026-08-28
**Scope:** B2B iş ortaklığı (reseller) programı — firma bazlı lead toplama + conversion komisyon.

---

## 1. Özet

Affiliate programı bireysel kullanıcıları davet ederken, **Partner Program** B2B firmalar için
firma-bazlı bir program sunar. Her firma kendi `slug` URL'i ile public bir landing page alır,
landing page üzerinden lead toplar, lead'in conversion'ı (ödeme tamamlaması) halinde komisyon kazanır.

| Özellik | Affiliate | Partner Program |
|---------|-----------|----------------|
| Hedef | Bireysel kullanıcı | B2B firma |
| Komisyon | %20 (default) | %15 (default, configurable) |
| Public sayfa | ❌ | ✅ `/is-ortak/[slug]` |
| Webhook | ❌ | ✅ `lead.created` + `lead.converted` |
| Dashboard | `/dashboard/affiliate` | `/dashboard/partner` |
| API endpoint | — | `POST /api/partners/lead` |
| Identity | `referralCode` | `slug` + `partnerId` |

---

## 2. Mimari

### 2.1 Veri Modeli

İki yeni Prisma modeli eklendi (`prisma/schema.prisma`):

**`Partner`** — firma profili, slug unique, komisyon oranı, webhook config, denormalize stats.

**`PartnerLead`** — partner landing page'den gelen potansiyel müşteri kayıtları.
Status lifecycle: `pending → qualified → converted | rejected`.
Conversion olunca: `orderId`, `orderAmountCents`, `commissionCents` set edilir.

**`User`** modeline `partner Partner?` relation eklendi (1-1).

`prisma db push` ile PostgreSQL'e uygulandı.

### 2.2 Service Katmanı

**`src/modules/partners/service.ts`** — `partnerService` namespace:

| Method | Purpose |
|--------|---------|
| `createPartner(input)` | Yeni partner oluşturur. `slug` otomatik üretilir (TR karakter dönüşümü + collision retry + random suffix). |
| `getPartner(slug)` | Slug ile public lookup. Aktif olmayan → `NotFoundError`. |
| `getMyPartner(userId)` | Authenticated user'ın kendi partner kaydı. |
| `submitLead(input)` | Public lead submission. Lead + `totalLeads` atomik artırılır, webhook tetiklenir. |
| `markLeadConverted(args)` | Order PAID olunca email ile eşleşen son pending lead converted işaretlenir. Idempotent. |
| `getStats(userId)` | Dashboard için aggregated stats (byStatus, revenue, recentLeads). |
| `notifyPartner(partner, event, payload)` | HMAC-SHA256 imzalı webhook POST. 5s timeout, AbortController. |

### 2.3 API Endpoints

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/partners/lead` | POST | Public | Lead gönderimi (Zod validation) |
| `/api/user/partner` | GET | Required | Mevcut partner + stats |
| `/api/user/partner` | POST | Required | Yeni partner kaydı |

### 2.4 UI

- **Public landing** — `src/app/is-ortak/[slug]/page.tsx`
  Server component, `force-dynamic`, `generateMetadata` ile SEO. Aktif olmayan/missing slug → `notFound()`.
  Verified partner için `robots.index=true`, değilse `false`.

- **Lead form** — `src/components/partners/PartnerLeadForm.tsx`
  Client component. POST to `/api/partners/lead`. Iyimser UI, success/error inline, accessible (`role="status"`, `role="alert"`).

- **Landing renderer** — `src/components/partners/PartnerLanding.tsx`
  Company name, verified badge, description, optional website, lead form.

- **Dashboard** — `src/app/dashboard/partner/page.tsx` + `src/components/dashboard/PartnerDashboard.tsx` + `PartnerOnboardingForm.tsx`
  Stats cards (total leads, conversion %, kazanç TRY, public URL), referral link copy, recent leads tablosu. Henüz partner yoksa onboarding formu.

### 2.5 Commerce Entegrasyonu

**`src/modules/commerce/service.ts`** → `handleCheckoutCompleted()` içinde, loyalty integration'ın
hemen ardına yeni best-effort blok eklendi:

```ts
try {
  await partnerService.markLeadConverted({
    customerEmail: order.customerEmail,
    orderId: order.id,
    orderAmountCents: order.totalCents,
  });
} catch (err) {
  logger.warn('Partner markLeadConverted failed', { orderId: order.id, error: err });
}
```

Email bazlı eşleşme: customer normal checkout'tan lead submit ettiği email ile sipariş verirse,
en son `pending/qualified` lead `converted` işaretlenir ve `commissionCents` hesaplanır.
Idempotent: aynı orderId için zaten converted ise noop.

---

## 3. Dosya Listesi

### Yeni dosyalar

| Path | Satır (yaklaşık) |
|------|------------------|
| `src/modules/partners/service.ts` | 320 |
| `src/modules/partners/index.ts` | 5 |
| `src/modules/partners/__tests__/service.test.ts` | 200 |
| `src/app/api/partners/lead/route.ts` | 60 |
| `src/app/api/user/partner/route.ts` | 100 |
| `src/app/is-ortak/[slug]/page.tsx` | 50 |
| `src/components/partners/PartnerLeadForm.tsx` | 130 |
| `src/components/partners/PartnerLanding.tsx` | 60 |
| `src/app/dashboard/partner/page.tsx` | 55 |
| `src/components/dashboard/PartnerDashboard.tsx` | 170 |
| `src/components/dashboard/PartnerOnboardingForm.tsx` | 130 |

### Değiştirilen dosyalar

| Path | Değişiklik |
|------|-----------|
| `prisma/schema.prisma` | `Partner`, `PartnerLead` modelleri + `User.partner` relation |
| `src/modules/commerce/service.ts` | `handleCheckoutCompleted` → `partnerService.markLeadConverted` çağrısı |

---

## 4. Test Coverage

`src/modules/partners/__tests__/service.test.ts` — **14 unit testleri (geçti)**:

| Test Grubu | Sayı |
|-----------|------|
| Export shape | 1 |
| Commission math | 2 |
| `createPartner` validation (4 senaryo) | 4 |
| `getPartner` (inactive/missing) | 2 |
| `submitLead` email validation | 1 |
| `isValidSlug` (4 senaryo) | 1 (parametrize 4 case) |
| `markLeadConverted` idempotency | 2 |

**Toplam test suite:** 57 dosya, 540 test — **hepsi geçti** (`npx vitest run`).

TypeScript type-check: `npx tsc --noEmit` — **0 hata**.

---

## 5. Webhook Akışı

Partner kendi `webhookUrl`'ini tanımlarsa, HMAC-SHA256 imzalı POST bildirimi alır:

```
POST {webhookUrl}
X-Noktanyus-Event: lead.created | lead.converted
X-Noktanyus-Signature: <hex hmac-sha256>
Content-Type: application/json

{
  "event": "lead.created",
  "partnerId": "...",
  "timestamp": "2026-08-28T...",
  "data": { "leadId": "...", "customerEmail": "...", ... }
}
```

5 saniye timeout, hata durumunda sessizce loglanır (order/completion blocklanmaz).

---

## 6. Güvenlik & Limitler

- **Public API rate limiting** (`/api/partners/lead`): Zod schema + email format + slug regex. CSRF'e açık olabilir (anonymous form) — production'da Cloudflare Turnstile eklenmeli (projede zaten mevcut, eklenmedi).
- **Slug collision**: 3 deneme + random suffix ile çözüldü.
- **Webhook SSRF**: `webhookUrl` Zod `url()` ile validate edildi, internal URL'lere karşı ek kontrol **yapılmadı** (production'da allowlist eklenmeli).
- **PII**: Lead email/metadata DB'de saklanır. KVKK uyumu için admin tarafında export/delete endpoint'i ayrıca eklenebilir.
- **Webhook secret**: DB'de plain text saklanır. Encryption at-rest **yapılmadı** (production'da eklenmeli).

---

## 7. Bilinen Sınırlamalar (TODO)

- [ ] Admin moderation paneli (`/admin/partners`) — verified toggle.
- [ ] Cloudflare Turnstile integration lead form'una.
- [ ] Webhook delivery retry + dead-letter (WebhookEvent pattern'i ile yeniden kullanılabilir).
- [ ] Payout lifecycle (`PartnerPayout` modeli).
- [ ] CSV export for leads.
- [ ] Slug rename endpoint.
- [ ] Partner'a özel branding (logo, color) — landing page customization.

---

## 8. Komutlar

```bash
# Schema push
npx prisma db push --skip-generate

# Test
npx vitest run src/modules/partners

# Type-check
npx tsc --noEmit

# Manuel seed (admin)
# Dashboard → /dashboard/partner → form
```

---

## 9. Commit

```
feat: Phase 16 — Partner Program (B2B reseller + lead conversion)
```