-- Phase 4 C.8: KVKK/GDPR Cookie Consent Tablosu
-- KVKK Madde 5/2 ve GDPR Article 6/7 uyumlu consent kayıt altyapısı.
-- userId nullable: anonim ziyaretçiler için sessionToken bazlı takip.
-- expiresAt index: periyodik temizlik job'ları için hızlı sorgu.

CREATE TABLE IF NOT EXISTS "cookie_consents" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT,
    "sessionToken" TEXT,
    "necessary"    BOOLEAN NOT NULL DEFAULT true,
    "analytics"    BOOLEAN NOT NULL DEFAULT false,
    "marketing"    BOOLEAN NOT NULL DEFAULT false,
    "preferences"  BOOLEAN NOT NULL DEFAULT false,
    "ipAddress"    TEXT,
    "userAgent"    TEXT,
    "consentText"  TEXT,
    "expiresAt"    TIMESTAMP(3) NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cookie_consents_pkey" PRIMARY KEY ("id")
);

-- User FK (Cascade delete ile birlikte)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'cookie_consents_userId_fkey'
    ) THEN
        ALTER TABLE "cookie_consents"
        ADD CONSTRAINT "cookie_consents_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- sessionToken unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "cookie_consents_sessionToken_key"
ON "cookie_consents"("sessionToken");

-- Performance indexes
CREATE INDEX IF NOT EXISTS "cookie_consents_userId_idx"
ON "cookie_consents"("userId");

CREATE INDEX IF NOT EXISTS "cookie_consents_expiresAt_idx"
ON "cookie_consents"("expiresAt");
