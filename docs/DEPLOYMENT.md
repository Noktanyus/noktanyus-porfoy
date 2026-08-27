# Deployment Guide

Bu doküman, Noktanyus Portfolio'yu üretim ortamına almak için gereken tüm
adımları kapsar. Üç ana deployment yolu:

1. **[Vercel](#vercel-deployment-recommended)** — önerilen, en düşük operasyon
2. **[Docker](#docker-deployment-self-hosted)** — self-hosted, full kontrol
3. **[Standalone Next.js](#standalone-nextjs-build)** — custom VPS

---

## İçindekiler

- [Önkoşullar](#önkoşullar)
- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Docker Deployment (Self-Hosted)](#docker-deployment-self-hosted)
- [Standalone Next.js Build](#standalone-nextjs-build)
- [Database Migrations](#database-migrations)
- [Backup & Recovery](#backup--recovery)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)

---

## Önkoşullar

- Node.js 20+
- Docker & Docker Compose (DB + self-hosted için)
- PostgreSQL 14+ erişimi (Neon, Supabase, Railway, RDS veya local)
- Domain + DNS yönetimi
- Cloudflare hesabı (önerilir — proxy, R2, Turnstile)

---

## Vercel Deployment (Recommended)

### 1. Veritabanı Kurulumu

Ücretsiz ve hızlı seçenekler:

| Provider | Free Tier | Notlar |
|----------|-----------|--------|
| [Neon](https://neon.tech) | 0.5 GB | Serverless, branch DB desteği |
| [Supabase](https://supabase.com) | 500 MB | Dashboard + SQL editor |
| [Railway](https://railway.app) | $5 kredi | Kolay, klasik PG |

**Neon örneği:**

1. Neon'da hesap aç → "New Project"
2. Region seç (örn: Frankfurt)
3. Connection string'i kopyala:
   ```
   postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Vercel Projesi

```bash
# Vercel CLI (opsiyonel)
npm i -g vercel

# Repo bağlama
vercel link
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... diğer tüm env'ler
```

Veya **Vercel Dashboard** üzerinden:

1. https://vercel.com/new → GitHub repo'yu seç
2. **Framework Preset:** Next.js (otomatik algılanır)
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `.next` (default)
5. **Environment Variables:** Aşağıdaki listeyi ekle

### 3. Environment Variables (Vercel)

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `DATABASE_URL` | evet | PostgreSQL connection string |
| `NEXTAUTH_URL` | evet | `https://your-domain.com` |
| `NEXTAUTH_SECRET` | evet | `openssl rand -hex 32` |
| `NEXT_PUBLIC_BASE_URL` | evet | Public URL |
| `ADMIN_EMAIL` | evet | İlk admin email |
| `ADMIN_PASSWORD` | evet | İlk admin şifre (güçlü!) |
| `SENTRY_DSN` | hayır | Sentry error tracking |
| `STRIPE_SECRET_KEY` | hayır | Stripe (boşsa mock mode) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | hayır | Stripe public key |
| `STRIPE_WEBHOOK_SECRET` | hayır | Stripe webhook secret |
| `IYZICO_API_KEY` | hayır | iyzico (TR) |
| `IYZICO_SECRET_KEY` | hayır | iyzico |
| `IYZICO_URI` | hayır | `https://api.iyzipay.com` |
| `RESEND_API_KEY` | hayır | Transactional email |
| `EMAIL_FROM` | hayır | `noreply@your-domain.com` |
| `R2_ACCESS_KEY_ID` | hayır | Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | hayır | R2 secret |
| `R2_ENDPOINT` | hayır | `https://<account>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | hayır | Bucket adı |
| `R2_PUBLIC_URL` | hayır | Public CDN URL |
| `REDIS_URL` | hayır | `redis://...` (BullMQ için) |
| `CRON_SECRET` | hayır | Cron bearer token |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | hayır | Bot koruması |

### 4. Secret Üretimi

```bash
# NextAuth
openssl rand -hex 32

# Cron secret
openssl rand -hex 32

# Stripe webhook secret — Stripe Dashboard > Webhooks > Endpoint signing secret
```

### 5. İlk Deploy

```bash
git push origin master
# Vercel otomatik build + deploy yapar
```

Veya manuel:

```bash
vercel --prod
```

### 6. Database Migration (Vercel'den sonra)

Vercel build sırasında `prisma generate` çalışır ama migration **yapılmaz**.
İlk deploy sonrası bir kere çalıştır:

```bash
# Lokal terminalde (DATABASE_URL prod'a işaret etmeli)
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Veya seed
DATABASE_URL="postgresql://..." npm run db:seed
```

**Veya** Vercel Dashboard → Project → Settings → Build & Development Settings →
Build Command:

```
prisma generate --schema=./prisma/schema.prisma && prisma migrate deploy && next build
```

### 7. Domain

1. Vercel Dashboard → Project → Settings → Domains
2. `your-domain.com` ekle
3. DNS sağlayıcında CNAME veya A kaydı ayarla
4. Cloudflare proxy **önerilir** (DDoS koruması, cache)

### 8. Stripe Webhook (prod)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-domain.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`,
   `customer.subscription.created/updated/deleted`,
   `invoice.payment_succeeded/failed`
4. Signing secret'i kopyala → `STRIPE_WEBHOOK_SECRET` env'ine ekle

### 9. Cron Jobs

`vercel.json` otomatik kullanılır:

```json
{
  "crons": [
    { "path": "/api/monitors/check-all", "schedule": "*/5 * * * *" }
  ]
}
```

- **Vercel Hobby:** günde 2 cron sınırı (yeterli)
- **Vercel Pro:** sınırsız cron

Alternatif: harici scheduler (GitHub Actions cron, cron-job.org) ile
`Authorization: Bearer <CRON_SECRET>` header'ı ile çağır.

---

## Docker Deployment (Self-Hosted)

`docker-compose.yml` iki servis içerir: `db` (PostgreSQL 15) ve `web`
(Next.js app). Cloudflare Tunnel opsiyonel.

### 1. Hazırlık

```bash
# Repo klonla
git clone https://github.com/Noktanyus/noktanyus-porfoy.git
cd noktanyus-porfoy

# .env oluştur
cp .env.example .env
nano .env  # DB, NextAuth, vb. doldur

# Güçlü secret üret
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> .env
echo "CRON_SECRET=$(openssl rand -hex 32)" >> .env
```

### 2. Build & Up

```bash
docker compose up -d --build
```

Bu komut:
- `db` servisini başlatır (PostgreSQL 15, port 5432)
- `web` servisini build eder ve başlatır (port 3000)
- `tunnel` (Cloudflare) opsiyonel — `CLOUDFLARE_TUNNEL_TOKEN` varsa çalışır

### 3. Migration

```bash
# Container'a gir
docker compose exec web sh

# İçeride
npx prisma migrate deploy
npm run db:seed  # opsiyonel
exit
```

### 4. Reverse Proxy (önerilir)

Doğrudan 3000 portunu açmak yerine **Nginx** veya **Caddy** kullan:

**Caddyfile:**

```caddy
your-domain.com {
  reverse_proxy localhost:3000
  encode gzip zstd
  header {
    Strict-Transport-Security "max-age=63072000"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
  }
}
```

### 5. Cloudflare Tunnel (alternatif)

Port açmadan güvenli erişim:

```bash
# .env'e ekle
CLOUDFLARE_TUNNEL_TOKEN="eyJhIjoixxx..."
```

Cloudflare Dashboard → Zero Trust → Tunnels → Create a tunnel → Token kopyala.

### 6. Cron (self-hosted)

Vercel cron olmadığı için harici scheduler gerekir:

```bash
# /etc/cron.d/noktanyus-monitor
*/5 * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/monitors/check-all
```

---

## Standalone Next.js Build

Custom VPS / bare-metal için.

### 1. Build

```bash
npm install
npm run build  # next.config: output: 'standalone'
```

Build çıktısı `.next/standalone/` altında. Static asset'leri kopyala:

```bash
# Standalone bundle (Node.js app)
cp -r .next/standalone ./deploy
cp -r .next/static ./deploy/.next/static
cp -r public ./deploy/public
```

### 2. Çalıştır

```bash
# deploy/.env dosyasını oluştur
cd deploy
HOSTNAME=0.0.0.0 PORT=3000 node server.js
```

### 3. systemd Service

`/etc/systemd/system/noktanyus.service`:

```ini
[Unit]
Description=Noktanyus Portfolio
After=network.target postgresql.service

[Service]
Type=simple
User=noktanyus
WorkingDirectory=/opt/noktanyus
EnvironmentFile=/opt/noktanyus/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now noktanyus
sudo systemctl status noktanyus
```

---

## Database Migrations

### Production

```bash
# Migration'ları uygula (destructive değil)
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### Development

```bash
# Schema değişikliği → yeni migration oluştur
npx prisma migrate dev --name "add_workspace_invites"

# Veya hızlı iterasyon (migration dosyası yazmaz)
npx prisma db push
```

### Seed

```bash
npm run db:seed  # tsx prisma/seed.ts çalıştırır
```

---

## Backup & Recovery

### PostgreSQL Backup

```bash
# Dump
pg_dump -h localhost -U noktanyus noktanyus_porfoy > backup_$(date +%F).sql

# Cron (günlük)
0 3 * * * pg_dump -h localhost -U noktanyus noktanyus_porfoy | gzip > /backups/db_$(date +\%F).sql.gz
```

**Restore:**

```bash
psql -h localhost -U noktanyus noktanyus_porfoy < backup_2026-08-27.sql
```

### Cloudflare R2 Backup

R2 dashboard'dan cross-region replication ayarla veya:

```bash
# rclone ile (opsiyonel)
rclone sync r2:noktanyus-uploads s3-backup:noktanyus-uploads
```

### Neon Otomatik Backup

Neon free tier'da **7 gün**, Pro'da **30 gün** otomatik backup. Point-in-time
recovery Neon dashboard'dan yapılır.

---

## Monitoring & Observability

### Sentry (error tracking)

1. https://sentry.io → New Project → Next.js
2. DSN'i kopyala → `SENTRY_DSN` env
3. Production'da `tracesSampleRate: 0.1`, session replay `%10`

Sentry alert kuralları:
- Error spike (> 5 / 5 min)
- Yeni error type
- Performance regression (p95 latency > 2s)

### Vercel Analytics

Vercel dashboard → Project → Analytics:
- Real User Monitoring (RUM)
- Web Vitals (LCP, FID, CLS)

### Uptime Monitoring (harici)

Vercel deployment'ı izlemek için:
- [UptimeRobot](https://uptimerobot.com) (free tier 50 monitor)
- [BetterStack](https://betterstack.com)
- [Pingdom](https://pingdom.com)

Health check endpoint'i: `GET /api/about` (200 dönmeli).

### Loglar

```bash
# Vercel
vercel logs --prod

# Docker
docker compose logs -f web
docker compose logs -f db

# Standalone (journald)
journalctl -u noktanyus -f
```

---

## Troubleshooting

### Prisma build hatası

```
Error: Cannot find module '@prisma/client'
```

**Çözüm:**

```bash
npx prisma generate --schema=./prisma/schema.prisma
npm run build
```

### Prisma migration başarısız

```
P3009: migrate found failed migrations
```

**Çözüm:**

```bash
# Başarısız migration'ı işaretle ve tekrar dene
npx prisma migrate resolve --rolled-back "<migration-name>"
npx prisma migrate deploy
```

### Stripe webhook 404 / signature invalid

1. `STRIPE_WEBHOOK_SECRET` doğru mu? Stripe Dashboard'tan kopyala.
2. Endpoint URL tam olarak `https://<domain>/api/webhooks/stripe` mi?
3. Stripe Dashboard → Webhooks → "Send test event" ile dene.
4. `STRIPE_SECRET_KEY` ile aynı mode (live/test) mi?

### iyzico signature / hash error

1. Sandbox'ta mı test ediyorsun? `IYZICO_URI="https://sandbox-api.iyzipay.com"`
2. `IYZICO_API_KEY` ve `IYZICO_SECRET_KEY` doğru mu?
3. Form payload'da **sıralama** önemli — iyz Türkçe karakter sıralaması
   kullanır.

### Image upload 413 (Payload Too Large)

**Çözüm:** `next.config.mjs` içinde body size limit'i kontrol et:

```js
export default {
  experimental: {
    serverActions: { bodySizeLimit: '6mb' }
  }
}
```

Veya Nginx:

```nginx
client_max_body_size 10M;
```

### Database connection pool tükendi

**Çözüm:** Prisma connection pooling (Neon, Supabase pooler URL kullan):

```
DATABASE_URL="postgresql://...pooler.region.aws.neon.com/...?pgbouncer=true"
```

### Redis bağlantı hatası (BullMQ)

`REDIS_URL` set edilmemişse in-memory queue devreye girer (dev için OK, prod
için değil). Production'da:

```bash
REDIS_URL="redis://default:PASSWORD@HOST:6379"
```

### Sentry "Invalid DSN" hatası

DSN formatı: `https://<key>@<org>.ingest.sentry.io/<project>`.

---

## Production Checklist

Deploy öncesi doğrula:

- [ ] `NEXTAUTH_SECRET` ve `CRON_SECRET` `openssl rand -hex 32` ile üretildi
- [ ] `NEXTAUTH_URL` production domain'e ayarlı
- [ ] `ADMIN_PASSWORD` güçlü (min 16 karakter, sembol içerir)
- [ ] Stripe webhook secret doğru mode'da
- [ ] Cloudflare Turnstile aktif (bot koruması)
- [ ] Database backup stratejisi kurulu
- [ ] Sentry DSN ayarlı ve alert kuralları tanımlı
- [ ] SSL/TLS aktif (Let's Encrypt veya Cloudflare)
- [ ] CORS allowlist production domain'i içerir
- [ ] Rate limiting aktif
- [ ] GDPR uyumlu privacy policy sayfası yayında
- [ ] Cloudflare proxy aktif (DDoS koruması)
- [ ] `npm audit` çalıştırıldı, kritik CVE yok
- [ ] `npm run build` lokal'de başarılı
- [ ] `npm run type-check` hatasız
- [ ] `npm test` tüm testler geçiyor
- [ ] `npm run test:e2e` smoke test başarılı
