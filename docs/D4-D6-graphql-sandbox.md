# D4. GraphQL API + D6. Sandbox Environment — Tamamlama Raporu

**Tarih:** 2026-08-28
**Kapsam:** GraphQL public API + Sandbox modu (destructive admin guard'ı)
**Durum:** TAMAMLANDI — 155/155 test PASS, type-check temiz

---

## Ozet

Iki yeni altyapi eklendi:

| Modul | Amac | Endpoint / Sayfa |
|-------|------|------------------|
| **D4. GraphQL API** | Public read-only content API (blog, project, product, plan, monitor) | `GET/POST /api/graphql` |
| **D6. Sandbox Environment** | Destructive admin islemleri icin ortam tespiti + data reset | `POST /api/sandbox/seed` + `/admin/settings/sandbox` |

---

## D4. GraphQL API

### Eklenen Dosyalar

| Dosya | Aciklama |
|-------|----------|
| `src/lib/graphql/schema.ts` | SDL tanimlari (Blog, Project, DigitalProduct, Plan, Monitor + BlogConnection) |
| `src/lib/graphql/resolvers.ts` | Prisma-backed resolver katmani, JSON→string[] donusumleri, Date→ISO serialization |
| `src/app/api/graphql/route.ts` | Apollo Server + Next.js App Router handler (GET + POST) |
| `src/lib/graphql/__tests__/schema.test.ts` | 4 schema validation unit test |

### Paketler

```json
{
  "graphql": "16.x",
  "@apollo/server": "^5.5.1",
  "@as-integrations/next": "^x",
  "graphql-tag": "^x"
}
```

### Schema (kucuk parca)

```graphql
type Blog { id: ID!, slug: String!, title: String!, description: String!, date: String!, category: String }
type BlogConnection { nodes: [Blog!]!, totalCount: Int! }
input BlogFilter { category: String, search: String }

type Query {
  blogs(limit: Int = 10): [Blog!]!
  blog(slug: String!): Blog
  projects(limit: Int = 10): [Project!]!
  product(slug: String!): DigitalProduct
  plans: [Plan!]!
  monitors(activeOnly: Boolean = true): [Monitor!]!
  blogsConnection(filter: BlogFilter, limit: Int = 10): BlogConnection!
}
```

### Notlar

- **Read-only**: mutation yok, write islemleri REST API'de kaliyor
- **Introspection**: production'da kapali (`NODE_ENV !== 'production'` → acik)
- **N+1 onlemi**: tek sorgu, `select` ile sadece ihtiyac alanlar cekiliyor
- **Filter**: `blogsConnection` ile category + search filtrelemeli sayfalama

### Ornek Kullanim

```bash
curl -X POST http://localhost:3000/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ blogsConnection(filter:{category:\"tech\"},limit:5){ totalCount nodes { slug title } } }"}'
```

---

## D6. Sandbox Environment

### Eklenen Dosyalar

| Dosya | Aciklama |
|-------|----------|
| `src/lib/sandbox.ts` | `isSandboxMode`, `getApiKeyMode`, `requireSandbox` helper'lari |
| `src/app/api/sandbox/seed/route.ts` | Destructive reset endpoint (sandbox-gated, audit logged) |
| `src/app/admin/(protected)/settings/sandbox/page.tsx` | Server component, sandbox state'i okur |
| `src/components/admin/SandboxControls.tsx` | Client component — reset butonu + durum gostergesi |
| `src/lib/__tests__/sandbox.test.ts` | 10 unit test |

### Tespit Mantigi (`isSandboxMode`)

Asagidaki sinyallerden biri dogru ise → sandbox:
- `SANDBOX_MODE === "true"`
- Stripe key `sk_test_*` veya `pk_test_*` ile basliyor
- `IYZICO_URI` `sandbox` iceriyor
- `NODE_ENV !== "production"`

### Guvenlik

- **`requireSandbox()`** — destructive fonksiyonlar icin runtime guard
- **API endpoint** — `isSandboxMode()` 403 doner production'da
- **Audit logging** — reset islemi `auditLog`'a yaziliyor
- **Confirmation flow** — UI'da cift `confirm()` ile yanlislikla silme engelleniyor

### Env Degisikligi

```bash
# .env ve .env.example
SANDBOX_MODE="false"   # production'da false
```

### AdminSidebar Entegrasyonu

`src/components/admin\AdminSidebar.tsx`'e `{ href: "/admin/settings/sandbox", text: "Sandbox Environment", icon: <FaFlask /> }` linki eklendi.

---

## Test Sonuclari

```
src/lib/__tests__/sandbox.test.ts        10 tests PASS
src/lib/graphql/__tests__/schema.test.ts  4 tests PASS
                                        ─────────────
Tum lib/__tests__/                       155 tests PASS
```

### Sandbox Test Kapsami

- `isSandboxMode` — 5 senaryo (explicit flag, Stripe key, iyzico URI, NODE_ENV)
- `getApiKeyMode` — 3 senaryo (live, test, default)
- `requireSandbox` — 2 senaryo (pass, throw)

### GraphQL Schema Test Kapsami

- Parse edilebilir SDL
- Blog type field declaration
- BlogConnection + BlogFilter input
- Query root field presence

---

## Type-Check Sonucu

Yeni eklenen dosyalar icin `tsc --noEmit` temiz. Mobil (Expo) tarafindaki unrelated module-not-found hatalari mevcut (onceden varolan durum, bu PR ile ilgisi yok).

---

## Dogrulanmamis (Not Verified)

- Build (`next build`) — bu session'da calistirilmadi
- Live GraphQL sorgu (gercek DB ile) — test sadece SDL validation yapiyor
- Admin UI browser smoke test'i — sadece static analysis

Bu maddeler `verifier` tarafindan PR oncesinde kontrol edilmeli.