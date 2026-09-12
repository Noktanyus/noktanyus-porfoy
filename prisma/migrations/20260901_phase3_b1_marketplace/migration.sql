-- Phase 3 B.1 — Template Marketplace Schema
-- White-label template vitrin, lisans, kurulum ve satin alma tablolari.
-- Mevcut Marketplace 2.0 (vendor/review/question, DigitalProduct) ile karismamasi
-- icin ayri `template_*` tablo aileleri kullanilir.

-- =================== TEMPLATE_LISTINGS ===================

CREATE TABLE "template_listings" (
    "id"               TEXT NOT NULL,
    "slug"             TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "tagline"          TEXT NOT NULL,
    "description"      TEXT NOT NULL,
    "longDescription"  TEXT,
    "category"         TEXT NOT NULL,
    "previewImages"    JSONB NOT NULL,
    "demoUrl"          TEXT,
    "priceCents"       INTEGER NOT NULL,
    "currency"         TEXT NOT NULL DEFAULT 'USD',
    "licenseType"      TEXT NOT NULL,
    "features"         JSONB NOT NULL,
    "techStack"        JSONB NOT NULL,
    "version"          TEXT NOT NULL,
    "authorId"         TEXT NOT NULL,
    "downloads"        INTEGER NOT NULL DEFAULT 0,
    "rating"           DOUBLE PRECISION,
    "reviewCount"      INTEGER NOT NULL DEFAULT 0,
    "active"           BOOLEAN NOT NULL DEFAULT true,
    "featured"         BOOLEAN NOT NULL DEFAULT false,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_listings_pkey" PRIMARY KEY ("id")
);

-- Unique slug
CREATE UNIQUE INDEX "template_listings_slug_key" ON "template_listings"("slug");

-- Category filter + active visibility
CREATE INDEX "template_listings_category_active_idx" ON "template_listings"("category", "active");

-- Featured sort
CREATE INDEX "template_listings_featured_idx" ON "template_listings"("featured");

-- Author dashboard
CREATE INDEX "template_listings_authorId_idx" ON "template_listings"("authorId");

-- =================== TEMPLATE_LICENSES ===================

CREATE TABLE "template_licenses" (
    "id"                  TEXT NOT NULL,
    "templateId"          TEXT NOT NULL,
    "workspaceId"         TEXT,
    "buyerEmail"          TEXT NOT NULL,
    "buyerName"           TEXT,
    "licenseKey"          TEXT NOT NULL,
    "type"                TEXT NOT NULL,
    "status"              TEXT NOT NULL DEFAULT 'active',
    "purchasePriceCents"  INTEGER NOT NULL,
    "currency"            TEXT NOT NULL,
    "invoiceUrl"          TEXT,
    "expiresAt"           TIMESTAMP(3),
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_licenses_pkey" PRIMARY KEY ("id")
);

-- Unique license key (lookup + verify)
CREATE UNIQUE INDEX "template_licenses_licenseKey_key" ON "template_licenses"("licenseKey");

-- FK indices
CREATE INDEX "template_licenses_templateId_idx" ON "template_licenses"("templateId");
CREATE INDEX "template_licenses_workspaceId_idx" ON "template_licenses"("workspaceId");

-- =================== TEMPLATE_INSTALLATIONS ===================

CREATE TABLE "template_installations" (
    "id"              TEXT NOT NULL,
    "licenseId"       TEXT NOT NULL,
    "workspaceId"     TEXT,
    "status"          TEXT NOT NULL DEFAULT 'pending',
    "configSnapshot"  JSONB,
    "deployedUrl"     TEXT,
    "githubRepoUrl"   TEXT,
    "errorMessage"    TEXT,
    "startedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"     TIMESTAMP(3),

    CONSTRAINT "template_installations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "template_installations_licenseId_idx" ON "template_installations"("licenseId");
CREATE INDEX "template_installations_workspaceId_status_idx" ON "template_installations"("workspaceId", "status");

-- =================== TEMPLATE_PURCHASES ===================

CREATE TABLE "template_purchases" (
    "id"              TEXT NOT NULL,
    "templateId"      TEXT NOT NULL,
    "buyerEmail"      TEXT NOT NULL,
    "buyerName"       TEXT,
    "workspaceId"     TEXT,
    "source"          TEXT NOT NULL,
    "externalId"      TEXT NOT NULL,
    "amountCents"     INTEGER NOT NULL,
    "currency"        TEXT NOT NULL,
    "status"          TEXT NOT NULL,
    "webhookPayload"  JSONB,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_purchases_pkey" PRIMARY KEY ("id")
);

-- Idempotency: ayni (source, externalId) ile ikinci kez insert engellenir
CREATE UNIQUE INDEX "template_purchases_source_externalId_key" ON "template_purchases"("source", "externalId");

CREATE INDEX "template_purchases_templateId_idx" ON "template_purchases"("templateId");
CREATE INDEX "template_purchases_buyerEmail_idx" ON "template_purchases"("buyerEmail");

-- =================== FOREIGN KEYS ===================

-- template_listings.authorId -> users.id
ALTER TABLE "template_listings"
    ADD CONSTRAINT "template_listings_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- template_licenses.templateId -> template_listings.id
ALTER TABLE "template_licenses"
    ADD CONSTRAINT "template_licenses_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "template_listings"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- template_licenses.workspaceId -> Workspace.id
ALTER TABLE "template_licenses"
    ADD CONSTRAINT "template_licenses_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- template_installations.licenseId -> template_licenses.id
ALTER TABLE "template_installations"
    ADD CONSTRAINT "template_installations_licenseId_fkey"
    FOREIGN KEY ("licenseId") REFERENCES "template_licenses"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- template_installations.workspaceId -> Workspace.id
ALTER TABLE "template_installations"
    ADD CONSTRAINT "template_installations_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- template_purchases.templateId -> template_listings.id
ALTER TABLE "template_purchases"
    ADD CONSTRAINT "template_purchases_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "template_listings"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- template_purchases.workspaceId -> Workspace.id
ALTER TABLE "template_purchases"
    ADD CONSTRAINT "template_purchases_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;