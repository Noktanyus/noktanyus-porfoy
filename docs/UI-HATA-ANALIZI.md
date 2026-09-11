# UI Hata Analizi

**Tarih:** 2026-09-11  
**Kapsam:** Layout, admin, commerce checkout, a11y, i18n/tema, formlar, ölü bileşenler  
**Yöntem:** Kod doğrulama (sayfa/route varlığı, env okuması, mount noktaları, Tailwind sınıfları)  
**Durum:** Envanter — bu turda davranış değişikliği yok

---

## Özet

Kritik UI kırıkları çoğunlukla **yanlış kablolama** ve **eksik yüzey** kaynaklı:
public chrome’un admin’i sarmalaması, 404’e giden CTA’lar, Turnstile env uyumsuzluğu,
hiç mount edilmeyen ChatWidget. Stil/a11y sorunları ikinci planda ama görünür.

---

## Yüksek öncelik

### 1. Bozuk `/admin` redirect

| | |
|--|--|
| **Dosya** | `vercel.json` (`redirects`) |
| **Semptom** | `/admin` → `/admin/(protected)/dashboard` |
| **Kök neden** | Route group `(protected)` URL’de yok; gerçek path `/admin/dashboard`. Dashboard layout admin’e `redirect('/admin')` ile gönderince zincir kırılır. |
| **Kanıt** | Kod |

### 2. Public Header/Footer admin + dashboard üzerinde

| | |
|--|--|
| **Dosya** | `src/app/layout.tsx`, `admin/(protected)/layout.tsx`, `dashboard/layout.tsx` |
| **Semptom** | Admin/dashboard içinde site Header + Footer + `pt-20` main; çift navigasyon, `main` iç içe, hamburger çakışması. |
| **Kök neden** | Root layout her route’a public chrome enjekte ediyor; admin/dashboard ayrı shell kullanmalı. |
| **Kanıt** | Kod |

### 3. Admin CTA’ları 404

| | |
|--|--|
| **Dosya** | `admin/(protected)/products/page.tsx`, `coupons/page.tsx`, `workspaces/page.tsx` |
| **Semptom** | `+ Yeni Ürün` → `/admin/products/new`, satır → `/admin/products/[slug]`, `+ Yeni Kupon` → `/admin/coupons/new`, `+ Yeni Workspace` → `/admin/workspaces/new` — page dosyaları yok. |
| **Kök neden** | Liste UI yazılmış, CRUD route’ları “sonraki sprint”te bırakılmış. |
| **Kanıt** | Glob: yalnızca `products/page.tsx` (new/edit yok) |

### 4. Turnstile env uyumsuzluğu (iletişim formu)

| | |
|--|--|
| **Dosya** | `IletisimForm.tsx`, `CloudflareTurnstile.tsx`, `lib/env.ts` |
| **Semptom** | Prod’da submit disabled kalabilir veya verify 500. |
| **Kök neden** | Form `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ile “prod mu?” karar veriyor; widget `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` okuyor. |
| **Kanıt** | Kod; e2e `console-errors` Turnstile’ı non-critical filtreliyor |

### 5. ChatWidget ölü yüzey

| | |
|--|--|
| **Dosya** | `src/components/chat/ChatWidget.tsx` |
| **Semptom** | Canlı destek FAB/UI hiç görünmez. |
| **Kök neden** | Bileşen tamam; hiçbir layout’ta import/mount yok. |
| **Kanıt** | Grep: yalnızca kendi dosyası |

### 6. Orphan admin sayfaları / eksik nav

| | |
|--|--|
| **Dosya** | `AdminSidebar.tsx` vs `campaigns/`, `themes/`, `blog/scheduled/` |
| **Semptom** | Sayfalar URL ile açılır ama sidebar’da yok; partners admin paneli hiç yok. |
| **Kanıt** | Kod + `docs/PARTNER_PROGRAM.md` |

---

## Orta öncelik

| # | Konu | Dosya | Semptom |
|---|------|-------|---------|
| 7 | Header taşma | `Header.tsx` | Çok ikon + `truncate max-w-[140px]` logo; uzun title mobilde kesilir |
| 8 | Mobil nav a11y | `Header.tsx` | `aria-expanded` yok; Escape/focus trap yok |
| 9 | Admin çift hamburger | `AdminSidebar` + admin layout | Mobilde iki üst kontrol katmanı |
| 10 | Desktop sidebar AT gizli | `AdminSidebar.tsx` | `aria-hidden={!isMobileOpen}` → masaüstünde sidebar gizli |
| 11 | Geçersiz Tailwind | `AdminSidebar` (`sm:w-84`), admin layout (`pt-18`, `xs:px-3`) | Sınıflar no-op |
| 12 | Checkout UX | `CheckoutForm`, `CartDrawer`, `PlanCheckoutForm` | Ödeme sayfasında adet/sil yok; kupon “Uygula”/önizleme yok; plan formunda provider yeni eklendi (ödeme PR) ama telefon yok |
| 13 | CartDrawer a11y | `CartDrawer.tsx` | `role="dialog"`; Escape / focus trap yok |
| 14 | i18n yarım | `LocaleSwitcher`, messages, middleware | Switcher path prefix’ler; `useTranslations` UI’da kullanılmıyor — metinler TR hardcoded |
| 15 | Accent yansımaz | `ThemeCustomizer`, PHASE_F1_F2 raporu | `--accent` set edilir; çoğu `gray-*`/`blue-*` sınıfı değişmez |
| 16 | Glass light kontrast | `globals.css` `.glass-card-premium` | Light’ta `rgba(255,255,255,0.08)` — açık zeminde kart neredeyse saydam |
| 17 | Campaigns EN + labelsız | `CampaignList.tsx` | İngilizce copy; input `label` yok; sidebar’da yok |
| 18 | Workspaces sahte session | `workspaces/page.tsx` | Cookie / sabit email; NextAuth user ile bağlı değil |
| 19 | Video demo banner | `VideoRoom.tsx` | “demo mode” bandı kullanıcıya görünür |
| 20 | Newsletter nav çakışması | `AdminSidebar` | `/newsletter/broadcast` iki linki birden aktif gösterir |
| 21 | Admin breadcrumb map eksik | admin layout | products, campaigns, themes, sandbox → “Yönetim Paneli” fallback |
| 22 | vercel health rewrite | `vercel.json` | `/api/health` → `/api/health/route` App Router için hatalı |

---

## Düşük öncelik

- LocaleSwitcher `aria-label` İngilizce
- Checkout checkbox’larda `id`/`htmlFor` zayıf
- Admin emoji branding (`🚀 Admin Panel`) + purple gradient
- Plan checkout skeleton yerine düz “Yükleniyor...”
- Mağaza empty “Yakında…” — products CRUD kırık olduğu için kalıcı olabilir
- Settings fotoğraf yükleme: toast “yakında”
- e2e `responsive.spec.ts` overflow soft-warn (fail değil)
- Push broadcast admin UI yok (docs)

---

## Önerilen düzeltme sırası

1. `vercel.json` `/admin` → `/admin/dashboard`; health rewrite kaldır veya düzelt  
2. Admin/dashboard için root Header/Footer’dan çıkış (route-group shell)  
3. Eksik CRUD sayfalarını ekle **veya** 404 CTA’ları kaldır  
4. Turnstile env tek isim (`CLOUDFLARE_*`)  
5. Sidebar’a campaigns/themes/scheduled; ChatWidget mount veya sil  
6. Desktop `aria-hidden` düzelt; geçersiz Tailwind sınıflarını gerçek değerlere çevir  
7. Glass light kontrast + checkout adet/kupon önizleme  

---

## İlişkili çalışmalar

- Teknik borç envanteri: `cursor/teknik-borc-analizi-06f3` / `src/TODO.md`  
- Ödeme düzeltmeleri: `cursor/odeme-sistemi-duzenleme-06f3` (checkout UI kısmen iyileşti)
