# API Route Inventory

## Response Envelope

Tüm endpoint'ler aynı zarfı kullanır:

```json
// Success
{ "success": true, "data": <payload> }

// Failure
{ "success": false, "error": { "code": "...", "message": "...", "details": ... } }
```

## Method | Path | Auth | Body (Zod Schema) | Success Response | Notes

### Blogs

| Method | Path | Auth | Body (Zod Schema) | Success Response | Notes |
|--------|------|------|-------------------|-----------------|-------|
| GET | `/api/blogs/popular` | None | - | `{ blogs: [{ slug, title, description, thumbnail, viewCount, readTimeMinutes, likeCount }] }` | Query: `limit` (1-50, default 5), `days` (1-365, default 30). Cache: no cache (force-dynamic). |
| POST | `/api/blogs/draft` | NextAuth session | `DraftSchema`: `title` (3-200), `description` (10-500), `content` (min 50), `category` (1-50), `thumbnail?` (url), `tags?` (string[] max 10), `author?`, `slug?` | 201: `{ draft }` | Auto-generates slug. `status` defaults to `"draft"`. |
| GET | `/api/blogs/[slug]/comments` | None | - | `{ comments: [...], count: number }` | 404 if blog not found. Comments filtered by `approved=true`. |
| POST | `/api/blogs/[slug]/comments` | NextAuth session | `CreateCommentSchema`: `content` (3-2000), `parentId?` | 201: `{ comment }` | Rate-limited. `blogId` injected from URL slug. |
| POST | `/api/blogs/[slug]/schedule` | NextAuth session | `{ scheduledAt: Date (must be > now) }` | `{ post }` | Param uses `[id]` not `[slug]` (URL mismatch). |

### Projects

> Not found. `src/app/api/projects/route.ts` yok.

### Templates

| Method | Path | Auth | Body (Zod Schema) | Success Response | Notes |
|--------|------|------|-------------------|-----------------|-------|
| GET | `/api/templates` | None | - (query) | `{ items, total?, page?, pageSize? }` | Cache: `public, s-maxage=60, stale-while-revalidate=300`. |
| GET | `/api/templates/[slug]` | None | - | `{ template }` | Cache: `public, s-maxage=120, stale-while-revalidate=600`. |
| POST | `/api/templates/[slug]/install` | NextAuth session | `InstallTemplateSchema`: `licenseKey` (8-128), `workspaceId` (required), `config?` | 201: `{ installationId, status, deployedUrl?, templateSlug }` | Validates license belongs to template. Rate-limited. |
| POST | `/api/templates/checkout` | None (rate-limited) | `CheckoutSchema`: `slug`, `licenseType?`, `buyerEmail`, `buyerName?`, `workspaceId?`, `provider?` | 201: `{ checkoutUrl, purchaseId, provider, amountCents, currency, externalId }` | Idempotent. |
| POST | `/api/templates/license/verify` | None | `{ licenseKey }` | `{ valid, licenseKey, status, type, expiresAt?, permissions, template }` | Returns 200 even for invalid (with `valid: false`). |
| POST | `/api/templates/demo/deploy` | NextAuth session | `DeployDemoSchema`: `licenseKey`, `subdomain` | 201: `{ installationId, status, message, subdomain, pollUrl }` | Job ID deterministic. Queue fire-and-forget. |
| GET | `/api/templates/demo/status/[installationId]` | NextAuth session | - | `{ installationId, status, deployedUrl?, errorMessage?, startedAt, completedAt? }` | Authz: buyerEmail match OR workspace owner OR admin. |

### Plans

| Method | Path | Auth | Body (Zod Schema) | Success Response | Notes |
|--------|------|------|-------------------|-----------------|-------|
| GET | `/api/plans` | None | - | `{ ... }` (raw service) | No cache headers. |
| GET | `/api/plans/[slug]` | None | - | `{ ... }` (raw service) | Slug: non-empty, max 100 chars. |

### User — API Keys

| Method | Path | Auth | Body (Zod Schema) | Success Response | Notes |
|--------|------|------|-------------------|-----------------|-------|
| GET | `/api/user/api-keys` | NextAuth session | - | `{ ...key, key: "prefix..." }` | Keys masked. |
| POST | `/api/user/api-keys` | NextAuth session | `CreateApiKeySchema`: `name` (1-100), `scopes` (array, default `['read:monitor']`), `rateLimit` (1-10000, default 60), `monthlyQuota?`, `expiresAt?` | 201: `{ ...key, key: "full_key", warning }` | Full key returned ONCE. Rate-limited. |
| GET | `/api/user/api-keys/[id]` | NextAuth session | - | `{ ...key, key: "prefix..." }` | KVKK audit log. Includes `_count.usages`. |
| PATCH | `/api/user/api-keys/[id]` | NextAuth session | `UpdateApiKeySchema`: `name?`, `scopes?`, `rateLimit?`, `monthlyQuota?`, `expiresAt?` | `{ ...key, key: "prefix..." }` | |
| DELETE | `/api/user/api-keys/[id]` | NextAuth session | - (query: `?hard=true`) | `{ success: true, mode: "deleted" | "revoked" }` | `hard=true` → delete; default → revoke. |

### User — Orders

| Method | Path | Auth | Body (Zod Schema) | Success Response | Notes |
|--------|------|------|-------------------|-----------------|-------|
| GET | `/api/user/orders/[id]` | NextAuth session | - | `{ order: { ..., items: [{ product: { slug, title, thumbnail } }], licenses, coupon, affiliateCommission } }` | Fetches via `userId` OR `customer.userId`. KVKK audit log. |

> Not found: `GET /api/user/orders` (no list endpoint).

### Cart

> Not found. `src/app/api/cart/route.ts` yok.

### Products

| Method | Path | Auth | Body (Zod Schema) | Success Response | Notes |
|--------|------|------|-------------------|-----------------|-------|
| GET | `/api/products` | None | - (query) | `{ ... }` (raw service) | Query: `category`, `take` (default 20), `skip`. |
| GET | `/api/products/[slug]` | None | - | `{ ... }` (raw service) | `commerceService.getProduct(slug)`. |

## Auth Infrastructure

### `src/lib/auth.ts`

- Credentials: email + password. Admin via `ADMIN_EMAIL`/`ADMIN_PASSWORD` env. User via Prisma `User` + bcrypt.
- OAuth: Google + GitHub (conditional).
- JWT session strategy.
- Admin session uses `getServerSession(authOptions)` directly in handlers. API key auth uses `apiKeyService`.

### `src/middleware.ts` — Protected Prefixes

```
/dashboard, /admin, /saas, /marketplace/dashboard,
/api/user, /api/saas, /api/compliance, /api/templates
```

Public whitelist: `/docs`, `/api/openapi`, `/api/user/cookie-consent`.

Auth check: `next-auth.session-token` (dev) or `__Secure-next-auth.session-token` (prod) cookie.

### Response Envelope (`src/lib/apiResponse.ts`)

```typescript
{ success: true, data: T, meta?: { total?, page?, limit? } }
// Error types: AppError, ZodError, Prisma P2002/P2025, Unknown
```

### Error Handler (`src/lib/error-handler.ts`)

```typescript
class AppError extends Error {
  constructor(message, statusCode = 500, code?: string) { ... }
}
// handleApiError(error) → { message, statusCode }
// Production: internal error.message never leaked.
```

## Prisma Schema — Relevant Models

### Blog
```
id, slug (unique), title, description, thumbnail?, author, category, tags (JSON),
content, viewCount, readTimeMinutes, likeCount, status (draft/scheduled/published),
publishedAt?, scheduledAt?, draftSavedAt?, version, parentVersionId?
createdAt, updatedAt
```

### Project
```
id, slug (unique), title, description, mainImage?, technologies (JSON),
liveDemo?, githubRepo?, order, featured, isLive, content, date?
```

### TemplateListing
```
id, slug (unique), name, tagline, description, longDescription?,
category, previewImages (JSON), demoUrl?, priceCents, currency, licenseType,
features (JSON), techStack (JSON), version, authorId,
downloads, rating?, reviewCount, active, featured
```

### Plan
```
id, slug (unique), name, description?, stripePriceId (unique), stripeProductId,
interval, priceCents, currency (default "try"),
features (JSON), active, isFeatured, order, trialDays (default 14)
```

### ApiKey
```
id, userId, name, key (unique), prefix,
scopes (JSON, default []), rateLimit (default 60), monthlyQuota?,
lastUsedAt?, totalRequests (default 0), expiresAt?, revokedAt?, revokedReason?
```

### Order
```
id, orderNumber (unique), customerId?, userId?,
stripeSessionId (unique), stripePaymentIntent? (unique),
status, subtotalCents, taxCents (default 0), totalCents, currency (default "try"),
customerEmail, customerName?,
deliveredAt?, refundedAt?, refundReason?,
couponId?, discountCents (default 0)
```

### User
```
id, email (unique), name?, password? (bcrypt), image?, emailVerified?,
twoFactorEnabled, twoFactorSecret?, twoFactorBackupCodes?, twoFactorVerifiedAt?,
emailVerifyToken? (unique), emailVerifyExpires?, passwordResetToken?, passwordResetExpires?,
failedLoginCount (default 0), lockedUntil?,
trialStartedAt?, trialEndsAt?,
birthDate?, referralCode? (unique), referredBy?, referralCount (default 0),
videoCallCredits (default 60), affiliateBalanceCents (default 0), affiliatePercent (default 20),
affiliateApproved (default false)
```

## Kritik Gozlemler

### 1. Hardcoded Sake Metrikler
- `GET /api/blogs/popular` aggregates only `Blog.viewCount`. If view counts are written manually, popularity data is unreliable.

### 2. Kullanilmayan / Eksik Endpointler

| Missing Endpoint | Impact |
|-----------------|--------|
| `GET /api/blogs` | No public blog listing API. |
| `GET/PUT/DELETE /api/blogs/[slug]` | No CRUD for individual blog posts via API. |
| `GET /api/projects` and `GET /api/projects/[slug]` | No public project API at all. |
| `GET /api/user/orders` | Cannot list a user's orders. |
| `GET /api/cart` | No cart endpoint. |
| `/api/templates/[slug]/install` — `workspaceId` required in schema, optional in header | Inconsistency. |

### 3. Response Shape Uyumsuzluklari

| Issue | Detail |
|-------|--------|
| `ok()` called inconsistently | `/api/templates` returns `data = [...]`; `/api/templates/[slug]` returns `data = { template }`. |
| `commerceService` returns unwrapped objects | Shape depends on service implementation. |
| `license/verify` returns 200 for both valid and invalid | Non-standard REST. |

### 4. Auth Inconsistencies

| Issue | Detail |
|-------|--------|
| `withAdminAuth` / `withApiKey` not in `auth.ts` | These helpers are not present; admin auth is done inline. |
| `/api/templates/license/verify` is public | Correct by design. |
| `GET /api/blogs/popular` — no rate limit | Public analytics endpoint, could be abused. |
| Admin writes logged via `console.info` | Should use structured logger. |

### 5. Test Setup Onerileri

| Test Kategorisi | Oneri |
|----------------|-------|
| **Auth mocking** | Use `getServerSession` mocking for session routes. |
| **Schema validation** | Pass invalid inputs, assert `success: false` with `error.code === 'VALIDATION_ERROR'`. |
| **Idempotency** | `POST /api/templates/checkout` same `(slug, buyerEmail)` returns same `purchaseId`. |
| **404 handling** | Cover non-existent slugs. |
| **Rate limiting** | Disable or mock rate limit middleware. |
| **DB seeding** | Blog rows with varying `viewCount`; Template rows with licenses; Order rows. |
