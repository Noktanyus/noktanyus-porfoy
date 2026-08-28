# Phase F1 (Theme Variants) + F2 (a11y Audit) — Raporu

**Tarih:** 2026-08-28
**Proje:** noktanyus-porfoy
**Kapsam:** F1 — Dark/Light/Auto tema + 5 renkli accent picker · F2 — WCAG 2.2 AA a11y iyilestirmeleri

---

## F1 — Theme Variants (Dark/Light/Auto + Custom Accent)

### Eklenen / Degistirilen Dosyalar

| Yol | Tur | Aciklama |
|---|---|---|
| `prisma/schema.prisma` | degisti | `ThemePreference` modeli + `User.themePreference` relation |
| `src/lib/theme.ts` | yeni | `THEME_OPTIONS`, `ACCENT_COLORS`, helper'lar (`getAccentHex`, `getAccentColorClasses`, `applyAccentToDocument`, `isAccentColor`, `isThemeOption`) |
| `src/modules/user-preferences/schemas.ts` | yeni | Zod semalari (`UpdatePreferencesSchema`) |
| `src/modules/user-preferences/service.ts` | yeni | `userPreferencesService.getPreferences` + `updatePreferences` (upsert) |
| `src/modules/user-preferences/index.ts` | yeni | Barrel export |
| `src/app/api/user/preferences/route.ts` | yeni | `GET` + `PATCH` endpoint'leri (auth required, zod validation) |
| `src/components/ui/ThemeCustomizer.tsx` | yeni | Dropdown dialog ile tema secimi + accent picker (logged-in: API'ye senkronize, guest: local-only) |
| `src/components/providers/ThemeProvider.tsx` | degisti | `defaultAccent` prop'u alip document'e uygular |
| `src/components/layout/Header.tsx` | degisti | `ThemeCustomizer` ThemeToggle yanina eklendi |
| `src/app/layout.tsx` | degisti | Server-side DB'den accent okuyup ThemeProvider'a geciyor, SkipLink + `<main id="main-content">` |
| `src/lib/__tests__/theme.test.ts` | yeni | 12 unit test |
| `src/modules/user-preferences/__tests__/service.test.ts` | yeni | 6 unit test |

### Prisma Migration
- `prisma generate` — basarili (`Generated Prisma Client (v6.19.2)`)
- `prisma db push` — basarili (`The database is already in sync with the Prisma schema` — yeni tablo eklendikten sonra sync OK)

### Veritabani Tablosu
```sql
theme_preferences (
  id          String PRIMARY KEY,
  userId      String UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  theme       String DEFAULT 'system',
  accentColor String DEFAULT 'blue',
  createdAt   DateTime DEFAULT now(),
  updatedAt   DateTime @updatedAt
)
```

### Davranis
- **Default degerler:** theme=system, accentColor=blue
- **Kayit:** Implicit upsert — ilk PATCH'te satir olusturulur
- **Hydration safety:** ThemeCustomizer mount olmadan skeleton placeholder gosterir
- **Auth:** Misafir kullanicilar icin local-only (document.documentElement.dataset.accent), login olan kullanicilar icin API'ye PATCH atilir
- **Type safety:** `isAccentColor` / `isThemeOption` type guards ile DB'den gelen beklenmedik degerler filtrelenir

---

## F2 — a11y Audit (WCAG 2.2 AA)

### Eklenen / Degistirilen Dosyalar

| Yol | Tur | Aciklama |
|---|---|---|
| `src/lib/a11y.ts` | yeni | `FOCUS_RING_STYLE`, `SKIP_TARGET_ID`, helper'lar (`labelProps`, `describedByProps`, `requiredProps`, `invalidProps`, `errorMessageId`, `helperTextId`, `buttonLabel`, `liveRegionProps`, `busyProps`, `expandableProps`), `validateA11y` HTML validator |
| `src/components/ui/SkipLink.tsx` | yeni | "Icerige gec" linki (sr-only, focus'ta fixed gorunur) |
| `src/components/ui/LoadingSkeleton.tsx` | degisti | Tum varyantlara `role="status"` + `aria-busy="true"` + `aria-live="polite"` + sr-only text |
| `src/components/ui/ErrorDisplay.tsx` | degisti | Tum varyantlara `role="alert"` + `aria-live="assertive"` + focus-visible ring |
| `src/components/dashboard/NotificationBell.tsx` | degisti | Button'a `aria-expanded` + `aria-haspopup="menu"` + `aria-controls`; dropdown'a `role="menu"` + `aria-label` |
| `src/app/layout.tsx` | degisti | `<SkipLink />` eklendi, `<main>` `id="main-content" tabIndex={-1}` ile focusable |
| `src/lib/__tests__/a11y.test.ts` | yeni | 23 unit test |
| `src/components/ui/__tests__/SkipLink.test.tsx` | yeni | 2 unit test |

### WCAG 2.2 AA Kontrol Listesi (Uygulanan)

| Kontrol | Uygulama | Dosya |
|---|---|---|
| 2.1.1 Keyboard (SkipLink) | `SkipLink` — Tab ile focus, Enter ile #main-content'e atla | `SkipLink.tsx` |
| 2.4.1 Bypass Blocks | SkipLink | `SkipLink.tsx` |
| 2.4.3 Focus Order | Header sirasi dogal; dropdown'da Tab trap yok ama click-outside var | `Header.tsx` |
| 2.4.7 Focus Visible | `FOCUS_RING_STYLE` (`focus-visible:ring-2`) | tum component'ler |
| 3.3.1 Error Identification | `ErrorDisplay` `role="alert" aria-live="assertive"` | `ErrorDisplay.tsx` |
| 3.3.2 Labels | `labelProps` / `describedByProps` helper'lari, form'larda kullanima hazir | `a11y.ts` |
| 4.1.2 Name, Role, Value | aria-label, aria-expanded, aria-haspopup, aria-controls | tum component'ler |
| 4.1.3 Status Messages | `aria-live="polite"` (loading) + `aria-live="assertive"` (error) | `LoadingSkeleton.tsx`, `ErrorDisplay.tsx` |

### validateA11y() — HTML Validator

Ciktidaki taramalar (regex-based, hizli sanity check):
1. `<img>` alt eksikligi (decorative `role="presentation"` muaf)
2. `<button>` accessible label eksikligi
3. `<a>` accessible label eksikligi
4. `<input>` label iliskilendirmesi (label[for], aria-label, aria-labelledby)
5. Heading hierarchy skip (h1 → h3 gibi atlamalar)

Sonuc: `A11yReport { issues, errorCount, warningCount, passed }`

---

## Test Sonuclari

### Yeni Eklenenler
```
✓ src/lib/__tests__/theme.test.ts             (12 tests)
✓ src/lib/__tests__/a11y.test.ts              (23 tests)
✓ src/modules/user-preferences/__tests__/service.test.ts  (6 tests)
✓ src/components/ui/__tests__/SkipLink.test.tsx  (2 tests)
```

### Toplam Proje Testleri
```
Test Files  64 passed (64)
Tests       612 passed (612)
Duration    27.29s
```

### TypeScript Type-Check
- F1/F2 dosyalarinda hata YOK
- Onceden var olan hatalar (mobile/Expo SDK eksik, email-marketing service, BrandingForm) bu phase kapsaminda degildi

---

## Notlar / Bilinen Sinirlar

1. **Accent color runtime degisimi:** ThemeCustomizer accent degistiginde sayfadaki TUM renkler otomatik guncellenmez — sadece `--accent` CSS variable set edilir. Daha kapsamli tema isleri icin Tailwind config'in accent'i dinamik okumasi lazim (gelecek phase). Mevcut durumda accent picker gorunur ve DB'ye yazilir, ama UI'da anlik yansimasi minimal.
2. **Guest mode persistence:** Accent color guest kullanici icin sadece document.dataset'e yazilir — sayfa yenileyince kaybolur. (Login olan kullanicilar icin DB'ye yazilir, persistence var.)
3. **validateA11y** kapsamli bir WCAG validatoru degildir — tam audit icin axe-core entegrasyonu (gelecek phase).
4. **Header.tsx Tooltip:** Dosyada Tooltip referansi goruldu (external edit), bu phase kapsaminda degil — Header'a ThemeCustomizer'i basariyla ekledim.