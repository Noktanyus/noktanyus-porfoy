# Prisma model drop (ertelenmiş)

Kod yüzeyi temizlendi; Prisma şemasında aşağıdaki modeller hâlâ duruyor.
Bunları **ayrı bir migration** ile silin — aksi halde CI `schema.ci.prisma` ve mevcut DB kırılır.

## Silinecek aday modeller (ürün dışı)

- Monitoring: `Monitor`, `MonitorCheck`, `Incident`, `AlertChannel`, `StatusPage`, …
- Compliance: `ComplianceSite`, `CookieScan`, `PrivacyPolicy`, `DataBreachIncident`, …
- AI: `AiUsage`, `BrandVoice`, `GenerationJob`, `GenerationResult`, …
- Affiliate/Loyalty/Partner: ilgili tablolar
- Video/Chat/Push/AB: ilgili tablolar
- Workspace branding: `Workspace*`, `WorkspaceBranding`

## Önerilen sıra

1. Production’da bu tablolara yazan kod kalmadığını doğrula (`rg` / build).
2. `prisma migrate dev --name drop_unused_product_surfaces` ile drop.
3. `schema.ci.prisma` senkron.
4. Seed’den ilgili fixture’ları kaldır.

**Şimdilik:** tablolar boş/ölü kalabilir; uygulama bunları kullanmıyor.
