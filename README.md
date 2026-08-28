# Noktanyus Portfolio - SaaS + E-Commerce Platform

Modern, full-stack Next.js 14 portföy + SaaS + e-ticaret + uptime monitoring platformu.

> [API Reference](./docs/API.md) · [Deployment Guide](./docs/DEPLOYMENT.md) · [Live Demo](https://noktanyus.com)

---

## İçindekiler

- [Özellikler](#-özellikler)
  - [Kullanıcı Yönetimi](#-kullanıcı-yönetimi)
  - [UI / UX](#-uiux)
  - [E-Ticaret](#-e-ticaret)
  - [SaaS Altyapısı](#-saas-altyapısı)
  - [Auth & Security](#-auth--security)
  - [i18n & SEO](#-i18n--seo)
  - [Real-time & Notifications](#-real-time--notifications)
  - [Payments](#-payments)
  - [E-commerce Features](#-e-commerce-features)
  - [Monitoring & Uptime](#-monitoring--uptime)
  - [Multi-user & Teams](#-multi-user--teams)
  - [Advanced Features](#-advanced-features)
  - [Commerce Advanced](#-commerce-advanced)
  - [Developer Tools](#-developer-tools)
  - [Backend](#-backend)
- [Mimari](#-mimari)
- [Modüler Mimari (Route Group İzolasyonu)](#-modüler-mimari-route-group-izolasyonu)
- [Teknoloji Stack](#-teknoloji-stack)
- [Hızlı Başlangıç](#-hızlı-başlangıç)
- [Test](#-test)
- [Build](#-build)
- [Scripts](#-scripts)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Performans](#-performans)
- [CI/CD](#-cicd)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)

---

## ✨ Özellikler

### Kullanıcı Yönetimi

- NextAuth credentials provider (admin + user hibrit)
- bcrypt 12-round şifre hashleme
- Email/password register, login, dashboard
- Profil, şifre değiştirme, hesap silme (GDPR)

### UI / UX

- Glassmorphism (White-Blur + Dark-Blur varyantları)
- OKLCH color space
- Light/Dark theme + View Transitions API (Chrome 111+)
- Tailwind CSS + Framer Motion animasyonları
- Loading skeleton (her sayfada uniform)
- Global Search (Ctrl+K, Fuse.js fuzzy)
- Newsletter subscription (double opt-in)
- Blog comments (nested, admin reply)

### E-Ticaret

- Stripe Checkout + Webhooks (subscription + one-time)
- iyzico TR ödeme (TR domain için, regional)
- Dijital ürün satışı + Lisans yönetimi
- Sepet (Zustand persist)
- Kupon / İndirim sistemi
- 3 abonelik planı (Starter / Pro / Enterprise)

### SaaS Altyapısı

- Multi-user + Workspace + RBAC (OWNER / ADMIN / EDITOR / VIEWER)
- API Key yönetimi (scopes, rate limit, usage tracking)
- UptimeRobot benzeri monitoring (HTTP / Ping / Port / Keyword / JSON)
- Public status pages
- Alert kanalları (Email / Webhook / Slack / Discord / Telegram)

### Backend

- Modular monolith (content / messaging / commerce / admin / monitoring / api-keys / newsletter / comments)
- Repository + Service pattern (her domain modülünde)
- Zod validation her endpoint'te
- Rate limiting (token bucket, IP başına)
- Audit log (hassas işlemler için)
- Sentry error tracking (server + client + edge)
- Multi-storage (Cloudflare R2 + local fallback)
- BullMQ queue system (in-memory dev, Redis prod)
- Git API (branch / log / commit / revert, admin UI için)

### 🔐 Auth & Security

- NextAuth Credentials + OAuth (Google, GitHub)
- 2FA (TOTP) + Backup codes
- SAML SSO stub (enterprise tier)
- bcrypt 12-round password hashing

### 🌐 i18n & SEO

- next-intl (TR/EN, locale-prefix: as-needed)
- Schema.org JSON-LD (Article, Product, Person, Breadcrumb, FAQ, Organization)
- Sitemap.xml (dinamik), robots.txt, OG tags, Twitter Cards
- Hreflang alternates (multi-language SEO)

### 🔔 Real-time & Notifications

- Server-Sent Events (SSE) notification stream
- Web Push (VAPID keys, Service Worker)
- Email preferences (marketing/transactional/newsletter toggles)
- Onboarding tour (6-step wizard)

### 💳 Payments

- Stripe Checkout (subscription + one-time)
- iyzico (TR provider) - auto-detect `.com.tr` emails
- Refund (full + partial, Stripe + iyzico)
- Webhook delivery (HMAC, retry, DLQ)

### 🛍️ E-commerce Features

- Digital products + Licenses
- Bundles (multi-product, auto-discount)
- Cart (Zustand persist)
- Coupons: first-time / birthday / referral
- Reviews (1-5 star, vendor stats)
- Q&A (product questions)

### 📡 Monitoring & Uptime

- HTTP/HTTPS/Ping/Port/Keyword/JSON checks
- Cron scheduling (Vercel Cron)
- Alert channels (Email, Webhook, Slack, Discord, Telegram)
- Public status pages
- Incident tracking

### 👥 Multi-user & Teams

- Workspaces (multi-tenant)
- RBAC (OWNER/ADMIN/EDITOR/VIEWER)
- Task management (Kanban)
- Comments (nested, blog + tasks)

### 🎥 Advanced Features

- Video calls (WebRTC stub)
- Affiliate program (commission tracking)
- Loyalty program (Bronze/Silver/Gold/Platinum tiers)
- Partner program (lead submission)
- A/B testing (weighted random, sticky session)

### 💱 Commerce Advanced

- Multi-currency (TRY/USD/EUR/GBP)
- Tax (country-based VAT/GST)
- Custom Report Builder (4 types)
- Revenue Dashboard + Funnel Analysis
- CLV tracking

### 🔌 Developer Tools

- GraphQL API (Apollo Server)
- Sandbox environment
- API Keys (scoped, rate-limited, usage tracking)
- Webhooks (user-defined)

---

## Mimari

```
noktanyus-porfoy/
├── src/
│   ├── app/                    # Next.js App Router (RSC)
│   │   ├── (content)/          # /blog, /projelerim, /hakkimda (içerik sayfaları)
│   │   ├── (commerce)/         # /magaza, /fiyatlandirma, /odeme (e-ticaret)
│   │   ├── (monitoring)/       # /status, /saglik (uptime + status pages)
│   │   ├── (auth)/             # /giris, /kayit (kimlik doğrulama)
│   │   ├── (legal)/            # /yasal/* (KVKK, çerez politikası, vb.)
│   │   ├── admin/              # /admin/* (auth + role gerekli)
│   │   ├── api/                # /api/* (RESTful, 60+ endpoint)
│   │   └── dashboard/          # /dashboard/* (user self-service)
│   ├── modules/                # Domain modülleri (vertical slice)
│   │   ├── content/           # Blog, Project, About
│   │   ├── messaging/         # Contact, Newsletter
│   │   ├── commerce/          # Plans, Products, Orders, Subscriptions, Refunds
│   │   ├── admin/             # Workspace, Members, Audit, Settings
│   │   ├── monitoring/        # Monitor, AlertChannel, Incident
│   │   ├── api-keys/          # ApiKey, Usage tracking
│   │   ├── newsletter/        # Subscribers, Broadcast
│   │   └── comments/          # Blog comments + admin reply
│   ├── lib/                    # Shared utilities
│   │   ├── auth.ts            # NextAuth config
│   │   ├── apiResponse.ts     # Standard API helpers (ok/created/fail)
│   │   ├── rateLimit.ts       # Token bucket
│   │   ├── queue.ts           # BullMQ + in-memory fallback
│   │   ├── stripe.ts          # Stripe SDK + mock mode
│   │   ├── iyzico.ts          # iyzico SDK + mock mode
│   │   ├── rbac.ts            # Role-based access control
│   │   ├── audit.ts           # Audit log
│   │   ├── errors.ts          # AppError + ZodError + PrismaError mapping
│   │   └── ...
│   ├── components/            # React components
│   │   ├── ui/                # Primitives (Button, Input, Card, ...)
│   │   ├── layout/            # Header, Footer, ThemeToggle
│   │   ├── home/              # Hero, Featured, Latest
│   │   ├── blog/              # BlogCard, Comments, Editor
│   │   ├── commerce/          # ProductGrid, CheckoutForm, CartDrawer
│   │   ├── dashboard/         # User dashboard widgets
│   │   ├── admin/             # Admin dashboard widgets
│   │   └── search/            # GlobalSearch (Ctrl+K)
│   ├── e2e/                    # Playwright E2E tests
│   └── __tests__/             # Vitest unit + integration tests
├── prisma/
│   ├── schema.prisma          # 30+ model
│   ├── migrations/            # Production migrations
│   └── seed.ts                # Demo data
├── docs/
│   ├── API.md                 # API reference
│   └── DEPLOYMENT.md          # Deployment guide
├── docker-compose.yml         # Self-hosted (PG + app + tunnel)
├── Dockerfile                 # Multi-stage build
├── vercel.json                # Vercel cron config
└── next.config.mjs            # Standalone output, security headers, bundle analyzer
```

---

## 🏗️ Modüler Mimari (Route Group İzolasyonu)

Her modül kendi `(group)` route grubunda izole çalışır. Bir modülde hata olunca sadece **o modülün** `error.tsx`'i tetiklenir — diğer modüller normal çalışmaya devam eder.

```
src/app/
├── (content)/        # Blog, Projelerim, Hakkımda
│   ├── error.tsx     # İçerik modülüne özel hata UI
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── blog/
│   ├── projelerim/
│   └── hakkimda/
├── (commerce)/       # Mağaza, Fiyatlandırma, Ödeme
│   ├── error.tsx     # Commerce modülü hata UI
│   └── ...
├── (monitoring)/     # Public Status Pages, Dashboard Monitors
│   └── error.tsx
├── (auth)/          # Giriş, Kayıt
│   └── error.tsx
├── (legal)/         # KVKK, Mesafeli Satış, Çerez Politikası
│   └── error.tsx
├── admin/           # Admin (korumalı)
├── dashboard/       # User self-service (korumalı)
└── api/             # Tüm modüllerin API endpoint'leri
```

### İzolasyon Kuralları

| Olay | Davranış |
|------|----------|
| `(content)/blog` sayfasında hata | Sadece `(content)/error.tsx` tetiklenir, `(commerce)`, `(auth)` etkilenmez |
| `(commerce)/odeme` DB hatası | `(commerce)/error.tsx` gösterilir, diğer modüller açık kalır |
| Root layout'ta hata | Sadece root `error.tsx` devreye girer (son savunma hattı) |
| Modül route'una unknown URL | İlgili grubun `not-found.tsx`'i gösterilir |

### Sağlık Kontrolleri

| Endpoint | Açıklama |
|----------|----------|
| `GET /api/health` | Genel sistem durumu (DB bağlantısı + uptime) |
| `GET /api/health/modules` | Modül-bazlı durum (content, commerce, monitoring, messaging) |
| `GET /saglik` | Public görüntüleme sayfası (UI) |

`/api/health/modules` her modül için DB sorgusu yaparak `up` / `down` / `degraded` döndürür. 4 modülden biri bile down ise HTTP 503 döner.

```json
{
  "status": "all-up",
  "timestamp": "2026-08-27T10:00:00.000Z",
  "totalLatency": 42,
  "modules": [
    { "name": "content", "status": "up", "latency": 12, "details": { "description": "Blog + Projects + About" } },
    { "name": "commerce", "status": "up", "latency": 8, "details": { "description": "Plans + Products + Orders + Subscriptions" } }
  ]
}
```

### Test

```bash
npm test -- src/app/api/health
```

---

## Teknoloji Stack

### Frontend

- **Next.js 14** (App Router, RSC, Server Actions)
- **React 18** + TypeScript 5.4
- **Tailwind CSS** + CVA (class-variance-authority)
- **Framer Motion** (page transitions, gestures)
- **react-icons** + **lucide-react**
- **Zustand** (client state + cart persist)
- **react-hook-form** + Zod resolver (form validation)
- **Fuse.js** (fuzzy search)

### Backend

- **Next.js API Routes** (RESTful)
- **NextAuth.js** (credentials provider, JWT session)
- **Prisma ORM** 6 (PostgreSQL)
- **Zod** (schema validation her endpoint'te)
- **bcryptjs** (12-round hash)

### Database & Storage

- **PostgreSQL** 15 (Docker prod / SQLite dev opsiyonu)
- **Cloudflare R2** (S3-compatible object storage) + local fallback

### Payments

- **Stripe** (international + TR)
- **iyzico** (TR regional provider)

### Email & Queue

- **Resend** (transactional) — mock mode fallback
- **BullMQ** + Redis (prod) / in-memory (dev)

### Observability

- **Sentry** (server + client + edge configs)
- **Vercel Analytics** (opsiyonel)
- Built-in **uptime monitoring**

### Testing

- **Vitest** (262 unit + integration test)
- **Playwright** (E2E)

### DevOps

- **Docker** + Docker Compose
- **GitHub Actions** (CI/CD, 6 workflow)
- **Vercel** (önerilen hosting) veya self-hosted

---

## Hızlı Başlangıç

### Gereksinimler

- Node.js 20+
- Docker & Docker Compose (PostgreSQL için)
- (Opsiyonel) Stripe, Resend, Cloudflare R2 hesapları

### Kurulum

```bash
# 1. Repo'yu klonla
git clone https://github.com/Noktanyus/noktanyus-porfoy.git
cd noktanyus-porfoy

# 2. Bağımlılıkları kur
npm install

# 3. Environment variables
cp .env.example .env
# .env dosyasını düzenle: DB URL, NextAuth secret, ADMIN_EMAIL, ADMIN_PASSWORD

# 4. PostgreSQL başlat (Docker)
docker compose up -d db

# 5. Veritabanı migrate + seed
npx prisma db push
npm run db:seed

# 6. Dev server başlat
npm run dev
# → http://localhost:3000
```

İlk giriş için `.env` içindeki `ADMIN_EMAIL` / `ADMIN_PASSWORD` kullanılır.

---

## Test

```bash
# Unit + integration (Vitest)
npm test                # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage raporu

# E2E (Playwright)
npm run test:e2e        # Headless
npm run test:e2e:ui     # UI mode
```

Coverage hedefi: **%80+**.

---

## Build

```bash
# Type-check
npm run type-check

# Lint
npm run lint

# Production build
npm run build
# → .next/standalone/ (self-contained bundle)

# Bundle analizi
ANALYZE=true npm run build
# → .next/analyze/client.html ve server.html

# Production server
npm start
```

---

## Scripts

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Prisma generate + Next.js production build |
| `npm start` | Production server |
| `npm run lint` | ESLint + auto-fix |
| `npm run type-check` | TypeScript compiler check (strict mode) |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with coverage |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run analyze` | Bundle analyzer (ANALYZE=true) |

---

## Environment Variables

Tüm env değişkenleri için `.env.example` dosyasına bakın. Önemli olanlar:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl-rand-hex-32>"

# Admin (initial)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="<strong-password>"

# Stripe (boşsa mock mode)
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# iyzico (boşsa mock mode)
IYZICO_API_KEY=""
IYZICO_SECRET_KEY=""
IYZICO_URI="https://api.iyzipay.com"

# Resend (boşsa mock mode — console.log)
RESEND_API_KEY=""
EMAIL_FROM="noreply@your-domain.com"

# Sentry (boşsa no-op)
SENTRY_DSN=""

# Cloudflare R2 (boşsa local /public/uploads)
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_ENDPOINT=""
R2_BUCKET=""
R2_PUBLIC_URL=""

# Redis (boşsa in-memory queue)
REDIS_URL=""

# Cron (Vercel Cron veya harici scheduler)
CRON_SECRET="<openssl-rand-hex-32>"

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
CLOUDFLARE_TURNSTILE_SECRET_KEY=""
```

Tam liste için: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)

---

## Deployment

### Vercel (önerilen)

```bash
# Vercel CLI
npm i -g vercel
vercel link
vercel env add DATABASE_URL
# ... diğer tüm env'ler
vercel --prod
```

Veya GitHub repo'yu Vercel'e bağla → otomatik build & deploy.

**Cron:** `vercel.json` otomatik kullanılır (`/api/monitors/check-all` her 5 dk).

Detaylar: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md#vercel-deployment-recommended)

### Docker (self-hosted)

```bash
docker compose up -d --build
# web: localhost:3000, db: localhost:5432
```

Nginx veya Cloudflare Tunnel ile reverse proxy önerilir.

### Standalone Next.js

```bash
npm run build
cp -r .next/standalone ./deploy
cp -r .next/static ./deploy/.next/static
cp -r public ./deploy/public
cd deploy && node server.js
```

---

## Performans

- **Bundle:** `@next/bundle-analyzer` ile her an analiz; icon kütüphaneleri
  `optimizePackageImports` ile tree-shake; `BlogList`/`ProjectList`/`ProductGrid`
  `next/dynamic` ile lazy-load.
- **Image:** `OptimizedImage` bileşeni `next/image` ile AVIF + WebP; 1 yıllık
  cache TTL.
- **Font:** Inter `next/font/google` ile self-host, `display: swap`.
- **Code-splitting:** `React.memo` ile `BlogCard`/`ProjectCard`/`ProductCard`.
- **Cache:** `next.config.mjs` içinde 1 yıllık immutable cache (`/uploads`,
  `/_next/static`, `/images`).
- **Sentry:** `tracesSampleRate: 0.1`, `profilesSampleRate: 0.1`, session
  replay %10 / hata anında %100.
- **Performance tests:** `src/lib/__tests__/performance.test.ts` —
  bundle analyzer, memoization, lazy loading, font/image optimizasyonu
  kontrolü.

---

## CI/CD

GitHub Actions ile 6 workflow:

| Workflow | Tetikleyici | İş |
|----------|-------------|-----|
| `ci-cd.yml` | push master / PR | Lint, security audit, build, test, Docker push |
| `pr-checks.yml` | PR | PR summary, ESLint, build verify, performance impact |
| `security.yml` | push / PR / daily | npm audit, CodeQL, TruffleHog, OWASP |
| `performance.yml` | push / PR / weekly | Bundle size, page analysis, optimization tips |
| `cleanup.yml` | weekly (Pazar 03:00) | Artifact cleanup, Docker image prune |
| `release.yml` | tag push (`v*`) | Release, pre-release tests, release Docker image |

Gerekli secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `DATABASE_URL`,
`NEXTAUTH_SECRET`, vb. (detaylar `docs/DEPLOYMENT.md`).

---

## API Reference

60+ RESTful endpoint. Tüm endpoint'ler standart JSON envelope döner:

```json
{ "success": true, "data": {...}, "meta": { "total": 100, "page": 1, "limit": 20 } }
```

Hata durumunda:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {...} } }
```

Endpoint kategorileri:

- **Auth:** `/api/auth/[...nextauth]`, `/api/auth/register`
- **Content:** `/api/about`, `/api/blogs/[slug]/comments`, `/api/search`, `/api/popups/[slug]`
- **Commerce:** `/api/products`, `/api/plans`, `/api/coupons/validate`,
  `/api/checkout/{product,subscription,subscription-portal}`,
  `/api/webhooks/stripe`, `/api/user/products`, `/api/user/orders/[id]/refund`
- **Monitoring:** `/api/monitors`, `/api/monitors/[id]`,
  `/api/monitors/check-all`, `/api/alert-channels`, `/api/alert-channels/[id]`
- **Workspaces:** `/api/workspaces`, `/api/workspaces/[id]`,
  `/api/workspaces/[id]/members`, `/api/workspaces/invitations/accept`
- **API Keys:** `/api/user/api-keys`, `/api/user/api-keys/[id]`
- **Newsletter:** `/api/newsletter/{subscribe,verify,unsubscribe}`
- **User:** `/api/user/{profile,password,delete}`
- **Admin:** `/api/admin/*` (content, settings, upload, images, git, products,
  projects, blog, popups, hakkimda, newsletter/broadcast, reply)

Tam liste + request/response örnekleri: [`docs/API.md`](./docs/API.md)

---

## Katkıda Bulunma

1. Fork edin
2. Feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Pull Request açın

Commit formatı: [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`).

PR öncesi `npm run lint && npm run type-check && npm test` çalıştırın.

---

## İletişim

- **Website:** [noktanyus.com](https://noktanyus.com)
- **GitHub:** [@noktanyus](https://github.com/noktanyus)
- **Email:** İletişim formu üzerinden

---

## Lisans

MIT License - Yunus Tuğhan. Detaylar için [LICENSE](./LICENSE) dosyasına bakın.
Kullanımda kaynak belirtmek ve [noktanyus.com](https://noktanyus.com) adresine
yönlendirme yapmak zorunludur.

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
