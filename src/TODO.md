# TODO List

Bu dosya, codebase'de tespit edilen ve ileride ele alınması gereken
teknik borç / eksik / açık konuları içerir.

> **Kural:** Yeni TODO eklerken kategori ve öncelik belirtin. Süresi geçen
> veya tamamlanan TODO'ları bu dosyadan kaldırıp `docs/CHANGELOG.md` veya
> commit mesajına taşıyın.

> **UI tarama:** 2026-09-11 — ayrıntılar `docs/UI-HATA-ANALIZI.md`.

---

## 🔴 Yüksek Öncelik

### UI / Navigasyon

- [ ] `vercel.json` — `/admin` redirect hedefi `/admin/(protected)/dashboard`
  (route group URL'de yok). Doğru: `/admin/dashboard`.
- [ ] `src/app/layout.tsx` — Root Header/Footer admin + dashboard'u sarıyor;
  çift chrome, iç içe `<main>`, mobil hamburger çakışması. Route-group
  shell ayrımı gerekli.
- [ ] Admin CRUD 404 — `products` / `coupons` / `workspaces` listelerinden
  `.../new` ve `.../[slug]` linkleri var, page dosyaları yok. CTA kaldır
  veya sayfaları ekle.
- [ ] Turnstile env — `IletisimForm` `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
  widget `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`. Tek isme indir.
- [ ] `ChatWidget` — bileşen hazır, hiçbir layout'ta mount edilmemiş.
- [ ] `AdminSidebar` — `campaigns`, `themes`, `blog/scheduled` orphan;
  `/admin/partners` yok.

---

## 🟡 Orta Öncelik

### Security / CSP

- `src/middleware.ts` — CSP açık ama `script-src`/`style-src` içinde
  `'unsafe-inline'`; nonce yok. (Eski “CSP kapalı” notu yanlıştı.)

### UI / a11y / tema

- AdminSidebar desktop `aria-hidden={!isMobileOpen}` → AT'de gizli.
- Geçersiz Tailwind: `sm:w-84`, `pt-18`, `xs:px-*` (no-op).
- Header mobil menü: `aria-expanded` / Escape / focus trap yok.
- CartDrawer: Escape + focus trap yok.
- i18n: LocaleSwitcher path değiştirir; UI metinleri `useTranslations`
  kullanmıyor (hardcoded TR).
- `.glass-card-premium` light mode `rgba(255,255,255,0.08)` — zayıf kontrast.
- Checkout: ödeme sayfasında adet/sil yok; kupon önizleme yok.
- CampaignList İngilizce + labelsız form; sidebar'da yok.
- Workspaces sayfası sahte cookie session kullanıyor.
- VideoRoom “demo mode” banner kullanıcıya görünür.
- `vercel.json` health rewrite `/api/health/route` geçersiz.

---

## 🟢 Düşük Öncelik

### Gelecek İyileştirmeler

- **API Gateway**: token-bucket → Redis sliding-window.
- **Dashboard Refactor**: Admin dashboard 23 paralel count → tek helper.
- **WebRTC Video Calls**: TURN + signaling (şimdi stub).
- **SAML SSO**: IdP metadata + attribute mapping; route’lar stub.
- LocaleSwitcher aria-label İngilizce; plan checkout skeleton; Settings
  fotoğraf “yakında” toast.
- Push admin broadcast UI; Partner lead Turnstile (docs).

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
