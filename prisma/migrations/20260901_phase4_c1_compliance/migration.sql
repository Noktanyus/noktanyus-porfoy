-- ============================================================================
-- Phase 4 C.1: KVKK/GDPR Compliance Tracker — Schema Migration
-- Tarih: 2026-09-01
--
-- Bu migration Workspace bazli KVKK (TR) ve GDPR (EU) uyumluluk takip
-- altyapisinin temel tablolarini olusturur.
--
-- Tablolar:
--   1. compliance_sites          — Izlenecek domain + scan zamanlama bilgisi
--   2. cookie_scans              — Tek bir crawl sonucu (cookies/scripts/forms/threats)
--   3. privacy_policies          — AI ile uretilen veya manuel policy versiyonlari
--   4. data_breach_incidents     — Workspace seviyesinde KVKK Madde 12 incident log
--
-- Workspace iliskileri:
--   - compliance_sites.workspaceId   -> Workspace (CASCADE)
--   - data_breach_incidents.workspaceId -> Workspace (CASCADE)
--   - cookie_scans.siteId            -> compliance_sites (CASCADE)
--   - privacy_policies.siteId        -> compliance_sites (CASCADE)
--   - data_breach_incidents.siteId   -> compliance_sites (SET NULL — breach site'a
--     bagli olmayabilir, ama kayit workspace seviyesinde tutulur)
--
-- Idempotent: PostgreSQL >= 9.6 'IF NOT EXISTS' destekler.
-- ============================================================================

-- =================== compliance_sites ===================

CREATE TABLE IF NOT EXISTS "compliance_sites" (
    "id"               TEXT         NOT NULL,
    "workspaceId"      TEXT         NOT NULL,
    "domain"           TEXT         NOT NULL,
    "name"             TEXT         NOT NULL,
    "contactEmail"     TEXT         NOT NULL,
    "country"          TEXT         NOT NULL,
    "language"         TEXT         NOT NULL DEFAULT 'tr',
    "status"           TEXT         NOT NULL DEFAULT 'pending',
    "lastScanAt"       TIMESTAMP(3),
    "nextScanAt"       TIMESTAMP(3),
    "scanInterval"     TEXT         NOT NULL DEFAULT 'weekly',
    "complianceScore"  INTEGER,
    "notes"            TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_sites_pkey" PRIMARY KEY ("id")
);

-- Domain global unique (multi-tenant tek domain icin tek workspace)
CREATE UNIQUE INDEX IF NOT EXISTS "compliance_sites_domain_key"
    ON "compliance_sites"("domain");

-- Workspace filtreleme (UI listeleme)
CREATE INDEX IF NOT EXISTS "compliance_sites_workspaceId_idx"
    ON "compliance_sites"("workspaceId");

-- Status filtreleme (dashboard pending/critical/warning)
CREATE INDEX IF NOT EXISTS "compliance_sites_status_idx"
    ON "compliance_sites"("status");

-- Cron worker icin nextScanAt lookup
CREATE INDEX IF NOT EXISTS "compliance_sites_nextScanAt_idx"
    ON "compliance_sites"("nextScanAt");

-- =================== cookie_scans ===================

CREATE TABLE IF NOT EXISTS "cookie_scans" (
    "id"               TEXT         NOT NULL,
    "siteId"           TEXT         NOT NULL,
    "status"           TEXT         NOT NULL DEFAULT 'running',
    "cookies"          JSONB        NOT NULL DEFAULT '[]'::jsonb,
    "trackingScripts"  JSONB        NOT NULL DEFAULT '[]'::jsonb,
    "forms"            JSONB        NOT NULL DEFAULT '[]'::jsonb,
    "threats"          JSONB        NOT NULL DEFAULT '[]'::jsonb,
    "score"            INTEGER,
    "pagesScanned"     INTEGER      NOT NULL DEFAULT 0,
    "durationMs"       INTEGER,
    "errorMessage"     TEXT,
    "userAgent"        TEXT,
    "startedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"      TIMESTAMP(3),

    CONSTRAINT "cookie_scans_pkey" PRIMARY KEY ("id")
);

-- Site bazli scan history (latest scan getLatestScan icin)
CREATE INDEX IF NOT EXISTS "cookie_scans_siteId_startedAt_idx"
    ON "cookie_scans"("siteId", "startedAt" DESC);

-- Worker: pending/running scan'leri bulmak icin
CREATE INDEX IF NOT EXISTS "cookie_scans_status_idx"
    ON "cookie_scans"("status");

-- =================== privacy_policies ===================

CREATE TABLE IF NOT EXISTS "privacy_policies" (
    "id"              TEXT         NOT NULL,
    "siteId"          TEXT         NOT NULL,
    "version"         INTEGER      NOT NULL,
    "title"           TEXT         NOT NULL,
    "content"         TEXT         NOT NULL,
    "jurisdiction"    TEXT         NOT NULL,
    "generatedBy"     TEXT         NOT NULL,
    "aiModel"         TEXT,
    "approvedAt"      TIMESTAMP(3),
    "approvedBy"      TEXT,
    "publishedAt"     TIMESTAMP(3),
    "publishedUrl"    TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privacy_policies_pkey" PRIMARY KEY ("id")
);

-- Ayni site icin version monoton (UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS "privacy_policies_siteId_version_key"
    ON "privacy_policies"("siteId", "version");

-- Jurisdiction bazli listeleme (KVKK mi GDPR mi)
CREATE INDEX IF NOT EXISTS "privacy_policies_siteId_jurisdiction_idx"
    ON "privacy_policies"("siteId", "jurisdiction");

-- Yayin tarihi ile siralama (latest published)
CREATE INDEX IF NOT EXISTS "privacy_policies_publishedAt_idx"
    ON "privacy_policies"("publishedAt");

-- =================== data_breach_incidents ===================

CREATE TABLE IF NOT EXISTS "data_breach_incidents" (
    "id"              TEXT         NOT NULL,
    "workspaceId"     TEXT         NOT NULL,
    "siteId"          TEXT,
    "severity"        TEXT         NOT NULL,
    "title"           TEXT         NOT NULL,
    "description"     TEXT         NOT NULL,
    "affectedUsers"   INTEGER,
    "dataCategories"  JSONB,
    "detectedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedAt"      TIMESTAMP(3),
    "resolvedAt"      TIMESTAMP(3),
    "notifyKvkk"      BOOLEAN      NOT NULL DEFAULT FALSE,
    "sentryAlertId"   TEXT,
    "metadata"        JSONB,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_breach_incidents_pkey" PRIMARY KEY ("id")
);

-- Workspace + severity (dashboard: workspace'in kritik olaylari)
CREATE INDEX IF NOT EXISTS "data_breach_incidents_workspaceId_severity_idx"
    ON "data_breach_incidents"("workspaceId", "severity");

-- Workspace + zaman (son 24 saat / 7 gun filtreleme)
CREATE INDEX IF NOT EXISTS "data_breach_incidents_workspaceId_detectedAt_idx"
    ON "data_breach_incidents"("workspaceId", "detectedAt" DESC);

-- Site bazli lookup
CREATE INDEX IF NOT EXISTS "data_breach_incidents_siteId_idx"
    ON "data_breach_incidents"("siteId");

-- KVKK bildirim bekleyen olaylar (cron worker icin)
CREATE INDEX IF NOT EXISTS "data_breach_incidents_notifyKvkk_idx"
    ON "data_breach_incidents"("notifyKvkk")
    WHERE "notifyKvkk" = TRUE;

-- =================== FOREIGN KEYS ===================

-- compliance_sites -> Workspace
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'compliance_sites_workspaceId_fkey'
    ) THEN
        ALTER TABLE "compliance_sites"
            ADD CONSTRAINT "compliance_sites_workspaceId_fkey"
            FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- cookie_scans -> compliance_sites
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'cookie_scans_siteId_fkey'
    ) THEN
        ALTER TABLE "cookie_scans"
            ADD CONSTRAINT "cookie_scans_siteId_fkey"
            FOREIGN KEY ("siteId") REFERENCES "compliance_sites"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- privacy_policies -> compliance_sites
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'privacy_policies_siteId_fkey'
    ) THEN
        ALTER TABLE "privacy_policies"
            ADD CONSTRAINT "privacy_policies_siteId_fkey"
            FOREIGN KEY ("siteId") REFERENCES "compliance_sites"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- data_breach_incidents -> Workspace
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'data_breach_incidents_workspaceId_fkey'
    ) THEN
        ALTER TABLE "data_breach_incidents"
            ADD CONSTRAINT "data_breach_incidents_workspaceId_fkey"
            FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- data_breach_incidents -> compliance_sites (SET NULL — site silinse bile incident log korunur)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'data_breach_incidents_siteId_fkey'
    ) THEN
        ALTER TABLE "data_breach_incidents"
            ADD CONSTRAINT "data_breach_incidents_siteId_fkey"
            FOREIGN KEY ("siteId") REFERENCES "compliance_sites"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
