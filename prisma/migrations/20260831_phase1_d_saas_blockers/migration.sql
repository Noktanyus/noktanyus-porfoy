-- ============================================================================
-- Phase 1D: SaaS Blockers Migration
-- Tarih: 2026-08-31
--
-- Self-serve onboarding, password reset, account lockout ve OAuth 2.0 altyapısı
-- için gereken tüm şema değişiklikleri bu migration'da toplanmıştır.
--
-- Değişiklikler:
--   1. User tablosu — email verify / password reset / lockout / trial alanları
--   2. UserSubscription tablosu — trialEndsAt kolonu
--   3. Plan tablosu — trialDays kolonu
--   4. oauth_clients tablosu (3rd party uygulamalar için client kayıtları)
--   5. oauth_authorization_codes tablosu (PKCE authorization code flow)
--   6. oauth_access_tokens tablosu (Bearer token store)
--   7. UNIQUE INDEX'ler (token tekilği + lookup performansı)
--
-- NOT: PostgreSQL < 9.6 'ADD COLUMN IF NOT EXISTS' desteklemez; ancak
--      prodüksiyon DB'miz 14+ olduğu için idempotent yazılmıştır.
-- ============================================================================

-- =================== USER tablosu ===================

-- Email doğrulama
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifyToken"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifyExpires" TIMESTAMP(3);

-- Password reset
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetToken"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);

-- Account lockout (brute-force koruması)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil"      TIMESTAMP(3);

-- Trial (self-serve onboarding)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialEndsAt"    TIMESTAMP(3);

-- =================== UserSubscription tablosu ===================

ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

-- =================== Plan tablosu ===================

ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "trialDays" INTEGER NOT NULL DEFAULT 14;

-- =================== oauth_clients ===================

CREATE TABLE IF NOT EXISTS "oauth_clients" (
    "id"             TEXT        NOT NULL,
    "clientId"       TEXT        NOT NULL,
    "clientSecret"   TEXT        NOT NULL,
    "name"           TEXT        NOT NULL,
    "redirectUris"   JSONB       NOT NULL,
    "scopes"         JSONB       NOT NULL,
    "ownerId"        TEXT        NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt"      TIMESTAMP(3),

    CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id")
);

-- =================== oauth_authorization_codes ===================

CREATE TABLE IF NOT EXISTS "oauth_authorization_codes" (
    "id"                   TEXT         NOT NULL,
    "code"                 TEXT         NOT NULL,
    "clientId"             TEXT         NOT NULL,
    "userId"               TEXT         NOT NULL,
    "redirectUri"          TEXT         NOT NULL,
    "scopes"               JSONB        NOT NULL,
    "codeChallenge"        TEXT         NOT NULL,
    "codeChallengeMethod"  TEXT         NOT NULL DEFAULT 'S256',
    "expiresAt"            TIMESTAMP(3) NOT NULL,
    "usedAt"               TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_authorization_codes_pkey" PRIMARY KEY ("id")
);

-- =================== oauth_access_tokens ===================

CREATE TABLE IF NOT EXISTS "oauth_access_tokens" (
    "id"        TEXT         NOT NULL,
    "tokenHash" TEXT         NOT NULL,
    "clientId"  TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "scopes"    JSONB        NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_access_tokens_pkey" PRIMARY KEY ("id")
);

-- =================== UNIQUE INDEX'ler ====================

-- User: token tekilği (race condition'ı önler)
CREATE UNIQUE INDEX IF NOT EXISTS "User_emailVerifyToken_key"
    ON "User"("emailVerifyToken");

CREATE UNIQUE INDEX IF NOT EXISTS "User_passwordResetToken_key"
    ON "User"("passwordResetToken");

-- oauth_clients
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_clients_clientId_key"
    ON "oauth_clients"("clientId");

CREATE INDEX IF NOT EXISTS "oauth_clients_ownerId_idx"
    ON "oauth_clients"("ownerId");

-- oauth_authorization_codes
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_authorization_codes_code_key"
    ON "oauth_authorization_codes"("code");

CREATE INDEX IF NOT EXISTS "oauth_authorization_codes_clientId_idx"
    ON "oauth_authorization_codes"("clientId");

CREATE INDEX IF NOT EXISTS "oauth_authorization_codes_userId_idx"
    ON "oauth_authorization_codes"("userId");

-- oauth_access_tokens
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_access_tokens_tokenHash_key"
    ON "oauth_access_tokens"("tokenHash");

CREATE INDEX IF NOT EXISTS "oauth_access_tokens_clientId_idx"
    ON "oauth_access_tokens"("clientId");

CREATE INDEX IF NOT EXISTS "oauth_access_tokens_userId_idx"
    ON "oauth_access_tokens"("userId");

-- User: lockout & trial lookup performansı
CREATE INDEX IF NOT EXISTS "User_lockedUntil_idx"
    ON "User"("lockedUntil")
    WHERE "lockedUntil" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "User_trialEndsAt_idx"
    ON "User"("trialEndsAt")
    WHERE "trialEndsAt" IS NOT NULL;

-- UserSubscription: trial bitiş takibi
CREATE INDEX IF NOT EXISTS "user_subscriptions_trialEndsAt_idx"
    ON "user_subscriptions"("trialEndsAt")
    WHERE "trialEndsAt" IS NOT NULL;

-- =================== FOREIGN KEY'ler ====================

-- oauth_clients → User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'oauth_clients_ownerId_fkey'
    ) THEN
        ALTER TABLE "oauth_clients"
            ADD CONSTRAINT "oauth_clients_ownerId_fkey"
            FOREIGN KEY ("ownerId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- oauth_authorization_codes → oauth_clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'oauth_authorization_codes_clientId_fkey'
    ) THEN
        ALTER TABLE "oauth_authorization_codes"
            ADD CONSTRAINT "oauth_authorization_codes_clientId_fkey"
            FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- oauth_authorization_codes → User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'oauth_authorization_codes_userId_fkey'
    ) THEN
        ALTER TABLE "oauth_authorization_codes"
            ADD CONSTRAINT "oauth_authorization_codes_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- oauth_access_tokens → oauth_clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'oauth_access_tokens_clientId_fkey'
    ) THEN
        ALTER TABLE "oauth_access_tokens"
            ADD CONSTRAINT "oauth_access_tokens_clientId_fkey"
            FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- oauth_access_tokens → User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'oauth_access_tokens_userId_fkey'
    ) THEN
        ALTER TABLE "oauth_access_tokens"
            ADD CONSTRAINT "oauth_access_tokens_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
