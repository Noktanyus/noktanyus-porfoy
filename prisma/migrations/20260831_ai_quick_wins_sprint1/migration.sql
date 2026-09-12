-- Sprint 1: AI Quick Wins — AiUsage model
-- Tier-based AI token quota tracking (per-user, per-feature, per-call).

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "promptSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_userId_createdAt_idx" ON "ai_usage"("userId", "createdAt");
CREATE INDEX "ai_usage_feature_idx" ON "ai_usage"("feature");
CREATE INDEX "ai_usage_userId_feature_createdAt_idx" ON "ai_usage"("userId", "feature", "createdAt");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update existing plan features to structured format (Starter/Pro).
-- Enterprise → sınırsız (Infinity); features JSON boş bırakıldı, planGate.ts Number.POSITIVE_INFINITY döner.
UPDATE "Plan"
SET "features" = jsonb_build_object(
    'marketing', "features"::jsonb,
    'limits', jsonb_build_object(
        'aiTokensPerMonth', 10000,
        'aiRequestsPerMonth', 50
    )
)
WHERE "slug" = 'starter';

UPDATE "Plan"
SET "features" = jsonb_build_object(
    'marketing', "features"::jsonb,
    'limits', jsonb_build_object(
        'aiTokensPerMonth', 100000,
        'aiRequestsPerMonth', 500
    )
)
WHERE "slug" = 'pro';
