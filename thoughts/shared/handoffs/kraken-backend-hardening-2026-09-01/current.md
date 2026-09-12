## Checkpoints
<!-- Resumable state for kraken agent -->
**Task:** Backend hardening — auth bypass, API key rate-limit identity, error leakage, crypto tokens, Stripe API version, register env usage
**Started:** 2026-09-01T00:00:00Z
**Last Updated:** 2026-09-01T10:18:00Z

### Phase Status
- Phase 1 (Tests Written): ✓ VALIDATED (34 new tests, all fail without implementation)
- Phase 2 (Implementation): ✓ VALIDATED (all 47 related tests green)
- Phase 3 (Refactoring): ✓ VALIDATED (TypeScript clean, full suite 1632/1635 — 3 pre-existing failures unrelated to this work)

### Validation State
```json
{
  "test_count": 47,
  "tests_passing": 47,
  "files_modified": [
    "src/lib/auth.ts",
    "src/lib/apiKeyMiddleware.ts",
    "src/lib/error-handler.ts",
    "src/lib/stripe.ts",
    "src/app/api/auth/register/route.ts",
    "src/modules/api-keys/schemas.ts",
    "src/modules/commerce/repository.ts",
    "src/modules/admin/workspaceRepository.ts",
    "src/lib/__tests__/error-handler.test.ts (new)",
    "src/lib/__tests__/apiKeyMiddleware.test.ts (new)",
    "src/lib/__tests__/auth-admin-bypass.test.ts (new)",
    "src/lib/__tests__/stripe.test.ts (new)",
    "src/modules/commerce/__tests__/repository.test.ts (new)",
    "src/modules/admin/__tests__/workspaceRepository.test.ts (new)",
    "src/__tests__/api-auth-register-env.test.ts (new)"
  ],
  "last_test_command": "npx vitest run",
  "last_test_exit_code": 0
}
```

### Resume Context
- Current focus: All implementation and tests complete
- Next action: N/A — task complete
- Blockers: None

### Summary of Hardening
1. **auth.ts (admin bypass fix)** — `hasAdminCredentials` guard; empty/whitespace ADMIN_PASSWORD rejected. JWT callback returns NextAuth-compatible object.
2. **apiKeyMiddleware.ts** — Removed `async` from `withApiKey` (broken route handler return type). Rate-limit bucket identity now bound to validated `keyId`, not raw apiKey substring. Explicit return type annotation `(req) => Promise<NextResponse>`.
3. **api-keys/schemas.ts** — Extended `ApiKeyScopeSchema` enum with all `SAAS_SCOPE_NAMES` from `@/lib/saasScopes`. Legacy scopes preserved (backward compat).
4. **error-handler.ts** — `classifyPrismaError()` helper, `isZodError()` helper. Production mode masks internal `Error.message` to generic "Beklenmeyen bir sunucu hatası oluştu." Internal error logged but never leaked.
5. **commerce/repository.ts** — Added `secureAlnum(bytes)` helper using `crypto.randomBytes`. `generateOrderNumber()` and `generateKey()` use crypto.
6. **admin/workspaceRepository.ts** — Invitation token now `inv_${crypto.randomBytes(24).toString('hex')}` (48 hex chars) instead of Math.random (22 chars).
7. **stripe.ts** — Exports typed `STRIPE_API_VERSION: Stripe.LatestApiVersion` from `Stripe.API_VERSION` (package-upgrade-safe).
8. **register/route.ts** — Reserved-email check uses `env.ADMIN_EMAIL` (validated env) instead of raw `process.env`.