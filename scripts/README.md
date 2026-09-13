# Scripts

Bu dizin, veritabanı güncellemeleri ve bakım işlemleri için yardımcı scriptler içerir.

## ESTM Proje Güncelleme

Mevcut bir veritabanındaki `estm-spor-tesisleri` projesini satış odaklı case study içeriğiyle güncellemek için:

```bash
npx tsx scripts/update-estm-project.ts
```

### Ne Yapar?

- `estm-spor-tesisleri` slug'ına sahip projeyi bulur
- Başlık, açıklama, teknolojiler ve içerik alanlarını günceller
- Stripe yerine NestPay/Asseco ödeme sistemini ekler
- Uydurma metrikleri kaldırır, nitel sonuçlar ekler
- Problem/Solution/Stack/Outcomes case study formatını uygular

### Gereksinimler

- `DATABASE_URL` ortam değişkeni tanımlı olmalı (`.env` dosyasında)
- Veritabanında `estm-spor-tesisleri` projesi mevcut olmalı

### Idempotency

Script birden fazla çalıştırılabilir (idempotent). Her çalıştırmada aynı sonucu verir.

### Seed ile Kullanım

Yeni bir veritabanı oluşturuyorsanız, doğrudan seed kullanın:

```bash
npm run db:seed
```

Mevcut bir veritabanını güncellemek için bu script'i kullanın.
