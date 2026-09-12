-- Phase 2 A.1: Brand Voice Training + Bulk Generation
-- Workspace bazinda marka ses/tonu ornekle AI'a ogretilir; sonra generation
-- promptlarina inject edilerek tutarli toplu icerik uretilmesini saglar.

-- CreateTable: BrandVoice
CREATE TABLE "brand_voices" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sampleInputs" JSONB NOT NULL,
    "learnedPatterns" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "trainedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_voices_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GenerationJob (toplu CSV → AI aciklama isleri)
CREATE TABLE "ai_generation_jobs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "csvPath" TEXT NOT NULL,
    "csvOriginalName" TEXT,
    "totalRows" INTEGER NOT NULL,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successfulRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "brandVoiceId" TEXT,
    "options" JSONB NOT NULL,
    "outputCsvPath" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GenerationResult (her bir satir sonucu + cost tracking)
CREATE TABLE "ai_generation_results" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "inputData" JSONB NOT NULL,
    "inputTitle" TEXT NOT NULL,
    "inputFeatures" TEXT,
    "shortDescription" TEXT,
    "description" TEXT,
    "tags" JSONB,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brand_voices_workspaceId_idx" ON "brand_voices"("workspaceId");
CREATE INDEX "ai_generation_jobs_workspaceId_status_idx" ON "ai_generation_jobs"("workspaceId", "status");
CREATE INDEX "ai_generation_jobs_userId_createdAt_idx" ON "ai_generation_jobs"("userId", "createdAt");
CREATE INDEX "ai_generation_results_jobId_idx" ON "ai_generation_results"("jobId");

-- AddForeignKey
ALTER TABLE "brand_voices" ADD CONSTRAINT "brand_voices_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_generation_jobs" ADD CONSTRAINT "ai_generation_jobs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_generation_jobs" ADD CONSTRAINT "ai_generation_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_generation_jobs" ADD CONSTRAINT "ai_generation_jobs_brandVoiceId_fkey" FOREIGN KEY ("brandVoiceId") REFERENCES "brand_voices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_generation_results" ADD CONSTRAINT "ai_generation_results_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ai_generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
