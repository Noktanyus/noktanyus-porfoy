# TODO List

Bu dosya, codebase'de tespit edilen ve ileride ele alınması gereken
teknik borç / eksik / açık konuları içerir.

> **Kural:** Yeni TODO eklerken kategori ve öncelik belirtin. Süresi geçen
> veya tamamlanan TODO'ları bu dosyadan kaldırıp `docs/CHANGELOG.md` veya
> commit mesajına taşıyın.

---

## 🔴 Yüksek Öncelik

_(Henüz kayıt yok — yeni TODO'lar buraya eklenir.)_

---

## 🟡 Orta Öncelik

### Security / CSP

- `src/middleware.ts:101` — Geçici olarak devre dışı bırakılan CSP
  kuralları nonce-based CSP'ye geçirilecek.
  - `unsafe-eval` ve `unsafe-inline` kullanımı kaldırılmalı.
  - next-intl çıktıları için nonce enjeksiyonu sağlanmalı.

---

## 🟢 Düşük Öncelik

### Gelecek İyileştirmeler

- **API Gateway**: Mevcut rate limiter token-bucket; sliding-window'a
  geçiş değerlendirilebilir.
- **Dashboard Refactor**: Admin dashboard'daki 23 paralel Prisma count
  sorgusu ileride `Promise.all([statsRepository.getAll()])` şeklinde
  tek bir helper'a indirilebilir. Şu an performans açısından kritik
  değil ama bakım için iyi bir aday.
- **WebRTC Video Calls**: Şu anda stub seviyesinde. Production için
  TURN server yapılandırması ve signaling (Socket.IO) entegrasyonu
  gerekiyor.
- **SAML SSO**: Schema ve endpoint'ler var; IdP metadata discovery ve
  attribute mapping henüz implement edilmedi.

---

## ✅ Tamamlanan (Arşiv)

Aşağıdaki öğeler bu refinement turunda düzeltildi:

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
