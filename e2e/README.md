# E2E Tests (Playwright)

Kritik user flow'lar icin Playwright testleri.

## Calistirma

```bash
# Tum testler (dev server otomatik baslatilir)
npm run test:e2e

# UI mode (debug icin)
npm run test:e2e:ui

# Headed mode (browser'i gor)
npx playwright test --headed

# Tek test
npx playwright test e2e/home.spec.ts
```

## Test Dosyalari

| Dosya | Kapsam |
|-------|--------|
| `home.spec.ts` | Ana sayfa, navigasyon, dil attr |
| `blog.spec.ts` | Blog listesi + detay sayfasi |
| `auth.spec.ts` | Kayit, giris, dashboard redirect |
| `store.spec.ts` | Magaza urun listesi, fiyatlandirma |
| `legal.spec.ts` | 5 yasal sayfa (KVKK, Mesafeli, Cerez, Cayma, Gizlilik) |
| `contact.spec.ts` | Iletisim formu + validasyon |

## Onemli Notlar

- `playwright.config.ts` `webServer` ile `npm run dev` otomatik baslatir.
- Default base URL `http://localhost:3000`. Override icin `PLAYWRIGHT_BASE_URL` env kullan.
- CI'da 2 retry, local'de 0 retry.
- Tum testler `fullyParallel` calisir.
- Screenshot sadece fail olan testlerde alinir.
- Video `retain-on-failure` ile saklanir.

## DB Bagimliligi

Bazi testler (blog post, product, plan) seeded DB'ye baglidir. Veri yoksa
`test.skip()` ile gecilir; testler FAILS etmez. CI'da seed calistirmak icin
`prisma db seed` ekleyebilirsin.