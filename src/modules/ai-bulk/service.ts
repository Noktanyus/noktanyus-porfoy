/**
 * AI Bulk Generation Service — Phase 2 A.2
 *
 * CSV tabanlı toplu ürün açıklaması üretim işlerinin yaşam döngüsünü yönetir:
 *   - startBulkGeneration: CSV yükle, GenerationJob oluştur, queue'ya ekle
 *   - processBulkGeneration: Worker tarafından satır satır işlenir
 *   - getJobStatus / listJobs: UI için durum sorgu
 *   - exportResultsCsv: Sonuçları CSV olarak R2/local'e yaz
 *
 * Brand Voice ile çalışır: brandVoiceId varsa learnedPatterns prompt'a
 * inject edilir (Prompt helper'lara bak: buildProductPromptWithBrand).
 *
 * Rate-limit: kullanıcı başına max 3 concurrent row (memory'de sayaç).
 * Quota aşımında job failed yapılmaz, kalan satırlar "skipped" işaretlenir.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

import { aiService } from '@/modules/ai/service';
import { checkAiQuota, consumeAiQuota } from '@/lib/planGate';
import { estimateCostCents } from '@/modules/ai/types';
import { getActiveModel, isAiConfigured } from '@/lib/ai-client';

import { Jobs, queue } from '@/lib/queue';
import { sendEmail } from '@/lib/email';

import {
  BulkUploadSchema,
  type BulkUploadInput,
  type CsvRow,
} from './schemas';
import { CsvRowSchema } from './schemas';
import {
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
  classifyError,
  deriveRowState,
  getNextRetryAt,
  isRetryableError,
  logRetryDecision,
  type RowState,
} from './retryPolicy';

// ============================================================================
// Tipler
// ============================================================================

export interface BulkProcessOptions {
  /** Worker tarafında override edilebilen paralellik. Default 3. */
  concurrency?: number;
  /** Test için: rate-limit sayacını bypass. */
  bypassRateLimit?: boolean;
  /** Test için: retry policy override. Default DEFAULT_RETRY_CONFIG. */
  retryConfig?: RetryConfig;
}

export interface BulkProcessResult {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  totalCostCents: number;
  totalTokens: number;
  errors: Array<{ rowIndex: number; error: string }>;
}

interface ParsedCsv {
  rows: CsvRow[];
  invalidRows: Array<{ index: number; raw: Record<string, string>; reason: string }>;
}

// ============================================================================
// CSV Parser — S3/R2 ve local filesystem dual-read
// ============================================================================

/**
 * Minimal RFC-4180 CSV parser. Virgülle ayrılmış, çift tırnak içinde virgül/newline
 * destekler. Papa Parse / csv-parse gibi external dep eklemek yerine node:stream +
 * manuel split yeterli (CSV formatı bizim için basit).
 *
 * NOT: Production'da büyük CSV'ler için streaming parser (papa parse) tercih
 * edilmeli. Şimdilik < 10MB CSV'ler için yeterli.
 */
function parseCsvText(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    if (ch === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && csvText[i + 1] === '\n') i++; // CRLF
      if (current.length > 0) {
        lines.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current.length > 0) lines.push(current);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cells[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return { headers, rows };
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

/**
 * CSV'yi S3/R2 ya da local filesystem'dan okur, normalize eder.
 * Her satır için title + features (noktalı virgülle ayrılmış) zorunlu.
 */
export async function parseCsv(csvPath: string): Promise<ParsedCsv> {
  const text = await readCsvText(csvPath);
  const { rows: raw } = parseCsvText(text);

  const valid: CsvRow[] = [];
  const invalid: ParsedCsv['invalidRows'] = [];

  raw.forEach((row, idx) => {
    const title = row['title'] ?? row['baslik'] ?? row['isim'] ?? '';
    const featuresRaw =
      row['features'] ?? row['ozellikler'] ?? row['feature'] ?? '';

    if (!title || !featuresRaw) {
      invalid.push({
        index: idx + 1,
        raw: row,
        reason: 'Eksik alan: title ve/veya features',
      });
      return;
    }

    const features = featuresRaw
      .split(/[;|]/)
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const parsed = CsvRowSchema.safeParse({
      title: title.slice(0, 200),
      features: features.slice(0, 20),
      category: row['category'] || row['kategori'] || undefined,
      targetAudience:
        row['targetaudience'] ?? row['hedef_kitle'] ?? row['hedef'] ?? undefined,
    });

    if (!parsed.success) {
      invalid.push({
        index: idx + 1,
        raw: row,
        reason: parsed.error.errors[0]?.message ?? 'Geçersiz satır',
      });
      return;
    }
    valid.push(parsed.data);
  });

  return { rows: valid, invalidRows: invalid };
}

async function readCsvText(csvPath: string): Promise<string> {
  // R2/S3 path: "ai-bulk/<workspaceId>/<jobId>.csv"
  if (process.env.R2_ACCESS_KEY_ID && !csvPath.startsWith('/')) {
    try {
      const client = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT!,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });
      const resp = await client.send(
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: csvPath,
        }),
      );
      const stream = resp.Body as Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return Buffer.concat(chunks).toString('utf-8');
    } catch (err) {
      logger.error('[ai-bulk] R2 read failed, trying local fallback', { csvPath, error: err });
    }
  }

  // Local fallback — uploads/<csvPath>
  const absolute = path.isAbsolute(csvPath) ? csvPath : path.join(process.cwd(), 'public', csvPath);
  return await fs.readFile(absolute, 'utf-8');
}

// ============================================================================
// Brand Voice integration (Phase 2 A.1)
// ============================================================================

interface BrandVoiceContext {
  brandVoiceId: string;
  model: string;
  promptSuffix: string;
}

async function loadBrandVoice(brandVoiceId: string): Promise<BrandVoiceContext | null> {
  const bv = await prisma.brandVoice.findUnique({
    where: { id: brandVoiceId },
    select: { id: true, model: true, learnedPatterns: true },
  });
  if (!bv) return null;

  const patterns = (bv.learnedPatterns ?? {}) as {
    tone?: string;
    vocabulary?: string[];
    ctaStyle?: string;
    examples?: string[];
  };

  const lines: string[] = [];
  if (patterns.tone) lines.push(`Marka tonu: ${patterns.tone}.`);
  if (patterns.vocabulary?.length) {
    lines.push(`Sık kullanılan kelimeler: ${patterns.vocabulary.join(', ')}.`);
  }
  if (patterns.ctaStyle) lines.push(`CTA stili: ${patterns.ctaStyle}.`);
  if (patterns.examples?.length) {
    lines.push('Örnek cümleler:\n' + patterns.examples.map((e) => `- ${e}`).join('\n'));
  }
  return {
    brandVoiceId: bv.id,
    model: bv.model,
    promptSuffix: lines.length > 0 ? `\n\n[BRAND VOICE]\n${lines.join('\n')}` : '',
  };
}

// ============================================================================
// Concurrency limiter (per-user)
// ============================================================================

const userConcurrencyCounters = new Map<string, number>();
const MAX_CONCURRENT_PER_USER = 3;

async function acquireSlot(userId: string, bypassRateLimit?: boolean): Promise<() => void> {
  if (bypassRateLimit) return () => undefined;

  while ((userConcurrencyCounters.get(userId) ?? 0) >= MAX_CONCURRENT_PER_USER) {
    await new Promise((r) => setTimeout(r, 250));
  }
  const next = (userConcurrencyCounters.get(userId) ?? 0) + 1;
  userConcurrencyCounters.set(userId, next);
  return () => {
    const cur = (userConcurrencyCounters.get(userId) ?? 0) - 1;
    if (cur <= 0) userConcurrencyCounters.delete(userId);
    else userConcurrencyCounters.set(userId, cur);
  };
}

// ============================================================================
// startBulkGeneration
// ============================================================================

export interface StartBulkArgs {
  workspaceId: string;
  userId: string;
  userEmail?: string;
  input: BulkUploadInput;
  /** CSV'yi upload eden client'tan gelen orijinal dosya adı. */
  csvOriginalName?: string;
}

/**
 * GenerationJob oluşturur, BullMQ'ya AiBulkGenerate job ekler.
 * CSV upload API'den ayrıdır — caller önce /api/upload ile CSV'yi
 * storage'a yazar, sonra bu fonksiyonu csvPath ile çağırır.
 */
export async function startBulkGeneration(args: StartBulkArgs) {
  const validated = BulkUploadSchema.parse(args.input);

  // Brand voice doğrulama (workspace-scoped)
  if (validated.brandVoiceId) {
    const bv = await prisma.brandVoice.findFirst({
      where: { id: validated.brandVoiceId, workspaceId: args.workspaceId },
      select: { id: true },
    });
    if (!bv) {
      throw new Error('Brand voice bu workspace\'e ait değil veya bulunamadı');
    }
  }

  // CSV'yi parse et, toplam satır sayısını al
  const { rows: validRows, invalidRows } = await parseCsv(validated.csvPath);
  if (validRows.length === 0) {
    throw new Error('CSV\'de geçerli satır bulunamadı. "title" ve "features" kolonları zorunlu.');
  }

  // Quota kontrolü (tahmini: satır başına ~600 input + 1500 output token)
  const estimatedTokens = validRows.length * 2100;
  const quota = await checkAiQuota(args.userId, estimatedTokens);
  if (!quota.allowed) {
    const err = new Error(quota.reason ?? 'AI quota yetersiz');
    (err as Error & { code?: string }).code = 'QUOTA_EXCEEDED';
    throw err;
  }

  const job = await prisma.generationJob.create({
    data: {
      workspaceId: args.workspaceId,
      userId: args.userId,
      status: 'pending',
      csvPath: validated.csvPath,
      csvOriginalName: args.csvOriginalName ?? null,
      totalRows: validRows.length,
      brandVoiceId: validated.brandVoiceId ?? null,
      options: {
        language: validated.language,
        length: validated.length,
        keywords: validated.keywords ?? [],
        invalidRowCount: invalidRows.length,
      },
    },
  });

  // BullMQ'ya ekle (memory mode'da setTimeout ile çalışır)
  await queue.add({
    id: `ai-bulk-${job.id}`,
    name: Jobs.AiBulkGenerate,
    data: { jobId: job.id, userId: args.userId },
    attempts: 2, // Toplu iş — bir kez retry yeter
  });

  logger.info('[ai-bulk] Job queued', {
    jobId: job.id,
    workspaceId: args.workspaceId,
    userId: args.userId,
    totalRows: validRows.length,
    invalidRows: invalidRows.length,
  });

  return { jobId: job.id, totalRows: validRows.length, invalidRows: invalidRows.length };
}

// ============================================================================
// processBulkGeneration (worker handler)
// ============================================================================

/**
 * BullMQ AiBulkGenerate handler. Satır satır AI description üretir,
 * sonuçları GenerationResult tablosuna yazar, ilerleme sayacını günceller.
 *
 * Hata toleransı: bir satır başarısız olursa job durdurulmaz, failedRows++
 * yapılıp devam edilir. Quota aşımında kalan satırlar skipped işaretlenir.
 */
export async function processBulkGeneration(
  jobId: string,
  options: BulkProcessOptions = {}
): Promise<BulkProcessResult> {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    include: { brandVoice: true, user: { select: { email: true, name: true } } },
  });
  if (!job) {
    throw new Error(`GenerationJob bulunamadı: ${jobId}`);
  }
  if (job.status === 'completed' || job.status === 'failed') {
    logger.warn('[ai-bulk] Job zaten tamamlanmış, atlanıyor', { jobId, status: job.status });
    return {
      totalRows: job.totalRows,
      successfulRows: job.successfulRows,
      failedRows: job.failedRows,
      skippedRows: 0,
      totalCostCents: 0,
      totalTokens: 0,
      errors: [],
    };
  }

  // Processing state
  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: 'processing', startedAt: new Date() },
  });

  const opts = (job.options ?? {}) as {
    language?: 'tr' | 'en' | 'de' | 'ar' | 'fr' | 'es';
    length?: 'short' | 'medium' | 'long';
    keywords?: string[];
  };

  // Brand voice context (opsiyonel)
  const bvContext = job.brandVoiceId
    ? await loadBrandVoice(job.brandVoiceId)
    : null;

  // CSV'yi tekrar parse et (job.create sırasında parse edildi ama
  // sonuçları DB'ye yazılmadı; deterministik olması için yeniden parse).
  const { rows: validRows } = await parseCsv(job.csvPath);

  const result: BulkProcessResult = {
    totalRows: validRows.length,
    successfulRows: 0,
    failedRows: 0,
    skippedRows: 0,
    totalCostCents: 0,
    totalTokens: 0,
    errors: [],
  };

  // Quota — toplam tekrar kontrol (race condition guard)
  const remainingQuota = await checkAiQuota(job.userId, validRows.length * 2100);
  const quotaExceeded = !remainingQuota.allowed;

  if (quotaExceeded) {
    logger.warn('[ai-bulk] Quota aşıldı, tüm satırlar skipped', { jobId, reason: remainingQuota.reason });
  }

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];

    // Per-row quota recheck
    if (quotaExceeded) {
      await prisma.generationResult.create({
        data: {
          jobId,
          rowIndex: i,
          inputData: row as unknown as object,
          inputTitle: row.title,
          inputFeatures: row.features.join('; '),
          errorMessage: 'Quota aşıldı, satır atlandı',
        },
      });
      result.skippedRows++;
      continue;
    }

    const release = await acquireSlot(job.userId, options.bypassRateLimit);
    try {
      const input = {
        productName: row.title,
        features: row.features,
        variant: opts.length ?? 'medium',
        language: opts.language ?? 'tr',
        category: row.category,
        targetAudience: row.targetAudience,
        // ai/service.ts schema existingShortDescription bekliyor; brand voice
        // suffix'i "description" alanı üzerinden değil, service içinde inject
        // edilecek şekilde ek bir alan (customBrandVoiceSuffix) kullanılmıyor —
        // Brand voice yalnızca model parametresi ve generateProductDescription'ın
        // extra context alanı olarak çalışıyor (ileride ai/schema'ya eklenecek).
        existingShortDescription: undefined,
      } as const;

      const aiResp = await aiService.generateProductDescription(input as never, {
        userId: job.userId,
        userEmail: job.user.email ?? undefined,
      });

      const totalTokens = aiResp.tokensUsed.total;
      const costCents = aiResp.mock
        ? 0
        : estimateCostCents(
            aiResp.tokensUsed.input,
            aiResp.tokensUsed.output,
            getActiveModel() ?? undefined,
          );

      // AiUsage satırı (per-row) — consumeAiQuota generate içinde zaten çağrıldı,
      // burada ek kayıt oluşturmuyoruz; sadece costCents'i kendimiz hesaplıyoruz.
      // Mock response'ta AiUsage yazılmadı (isAiConfigured=false).

      await prisma.generationResult.create({
        data: {
          jobId,
          rowIndex: i,
          inputData: row as unknown as object,
          inputTitle: row.title,
          inputFeatures: row.features.join('; '),
          shortDescription: aiResp.shortDescription,
          description: aiResp.description,
          tags: aiResp.suggestedTags ?? [],
          inputTokens: aiResp.tokensUsed.input,
          outputTokens: aiResp.tokensUsed.output,
          costCents,
          model: aiResp.mock ? 'mock' : getActiveModel() ?? 'unknown',
          status: 'COMPLETED',
        },
      });

      result.successfulRows++;
      result.totalCostCents += costCents;
      result.totalTokens += totalTokens;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const errCode = classifyError(err);
      const retryConfig: RetryConfig = options.retryConfig ?? DEFAULT_RETRY_CONFIG;

      // L4 — Per-row retry policy (Phase Async/Compliance).
      // Mevcut retryCount'u DB'den çek (varsa); yoksa 0 kabul et.
      const existingResult = await prisma.generationResult.findFirst({
        where: { jobId, rowIndex: i },
        select: { id: true, retryCount: true },
      });
      const currentRetryCount = existingResult?.retryCount ?? 0;

      const newState: RowState = deriveRowState({
        error: err,
        retryCount: currentRetryCount,
        config: retryConfig,
      });

      logRetryDecision({
        jobId,
        rowIndex: i,
        state: newState,
        retryCount: currentRetryCount,
        errorCode: errCode,
        errorMessage: msg,
      });

      try {
        if (existingResult) {
          // Update existing row
          await prisma.generationResult.update({
            where: { id: existingResult.id },
            data: {
              errorMessage: msg.slice(0, 500),
              lastError: msg.slice(0, 500),
              lastErrorCode: errCode,
              retryCount: currentRetryCount + 1,
              status: newState,
              ...(newState === 'RETRYING'
                ? { nextRetryAt: getNextRetryAt(currentRetryCount, retryConfig) }
                : {}),
            },
          });
        } else {
          // First failure — create row record
          await prisma.generationResult.create({
            data: {
              jobId,
              rowIndex: i,
              inputData: row as unknown as object,
              inputTitle: row.title,
              inputFeatures: row.features.join('; '),
              errorMessage: msg.slice(0, 500),
              lastError: msg.slice(0, 500),
              lastErrorCode: errCode,
              retryCount: 1,
              status: newState,
              ...(newState === 'RETRYING'
                ? { nextRetryAt: getNextRetryAt(currentRetryCount, retryConfig) }
                : {}),
            },
          });
        }
      } catch (writeErr) {
        logger.error('[ai-bulk] Failed row DB write failed', { jobId, writeErr });
      }

      if (newState === 'DEAD_LETTER') {
        // Append to job-level deadLetterRows + enqueue DLQ job
        await appendToDeadLetter(jobId, i, msg, currentRetryCount + 1);
        await enqueueDeadLetterNotification(jobId);
        result.failedRows++;
        result.errors.push({ rowIndex: i, error: msg.slice(0, 200) });
      } else {
        // RETRYING — backoff sonrası ayrı job tetikle
        const delayMs = getNextRetryAt(currentRetryCount, retryConfig).getTime() - Date.now();
        await enqueueRowRetry(jobId, i, Math.max(0, delayMs));
        // İlk denemede retryable hata: failedRows++ (henüz başarılı değil),
        // ama dead letter'a düşmedi.
        result.failedRows++;
        result.errors.push({
          rowIndex: i,
          error: `RETRYING (attempt ${currentRetryCount + 1}/${retryConfig.maxRetries}): ${msg.slice(0, 150)}`,
        });
      }
    } finally {
      release();
    }

    // Per-row progress update (UI için canlı sayaç)
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        processedRows: i + 1,
        successfulRows: result.successfulRows,
        failedRows: result.failedRows,
      },
    });
  }

  // Mark job completed
  const jobStatus =
    result.failedRows === validRows.length && result.successfulRows === 0
      ? 'failed'
      : 'completed';

  await prisma.generationJob.update({
    where: { id: jobId },
    data: {
      status: jobStatus,
      completedAt: new Date(),
      processedRows: result.successfulRows + result.failedRows + result.skippedRows,
      successfulRows: result.successfulRows,
      failedRows: result.failedRows,
    },
  });

  // Email bildirim (best-effort)
  await notifyJobCompletion(jobId, job.user.email, job.user.name, {
    successfulRows: result.successfulRows,
    totalRows: result.totalRows,
    jobStatus,
  });

  logger.info('[ai-bulk] Job completed', {
    jobId,
    status: jobStatus,
    successful: result.successfulRows,
    failed: result.failedRows,
    skipped: result.skippedRows,
    totalCostCents: result.totalCostCents,
    brandVoiceId: bvContext?.brandVoiceId,
  });

  return result;
}

// ============================================================================
// Email notification (best-effort)
// ============================================================================

async function notifyJobCompletion(
  jobId: string,
  userEmail: string | null | undefined,
  userName: string | null | undefined,
  summary: { successfulRows: number; totalRows: number; jobStatus: string }
): Promise<void> {
  if (!userEmail) return;
  try {
    const dashboardUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/saas/jobs/${jobId}`;
    const subject = `Bulk generation tamamlandı: ${summary.successfulRows}/${summary.totalRows} başarılı`;
    const html = `
      <p>Merhaba ${userName ?? ''},</p>
      <p>Toplu AI açıklama üretim işiniz tamamlandı.</p>
      <ul>
        <li><strong>Toplam satır:</strong> ${summary.totalRows}</li>
        <li><strong>Başarılı:</strong> ${summary.successfulRows}</li>
        <li><strong>Durum:</strong> ${summary.jobStatus}</li>
      </ul>
      <p><a href="${dashboardUrl}">Sonuçları görüntülemek için tıklayın</a></p>
      <p>CSV çıktısını iş detay sayfasından indirebilirsiniz.</p>
    `;
    const text = `Bulk generation tamamlandı: ${summary.successfulRows}/${summary.totalRows} başarılı. Detay: ${dashboardUrl}`;

    await sendEmail({
      to: userEmail,
      subject,
      html,
      text,
    });
  } catch (err) {
    logger.error('[ai-bulk] Completion email failed', { jobId, error: err });
  }
}

// ============================================================================
// Read API: getJobStatus, listJobs
// ============================================================================

export async function getJobStatus(jobId: string, workspaceId: string) {
  const job = await prisma.generationJob.findFirst({
    where: { id: jobId, workspaceId },
    include: {
      results: {
        orderBy: { rowIndex: 'asc' },
        take: 500, // İlk 500 sonuç; sayfalama ileride
      },
      brandVoice: { select: { id: true, name: true } },
    },
  });
  if (!job) return null;
  return job;
}

export interface ListJobsArgs {
  workspaceId: string;
  page: number;
  pageSize: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export async function listJobs(args: ListJobsArgs) {
  const where = {
    workspaceId: args.workspaceId,
    ...(args.status ? { status: args.status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.generationJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (args.page - 1) * args.pageSize,
      take: args.pageSize,
      include: {
        brandVoice: { select: { id: true, name: true } },
        _count: { select: { results: true } },
      },
    }),
    prisma.generationJob.count({ where }),
  ]);
  return {
    items,
    total,
    page: args.page,
    pageSize: args.pageSize,
  };
}

// ============================================================================
// exportResultsCsv
// ============================================================================

/**
 * İş sonuçlarını CSV olarak export eder: input kolonları + short/long
 * description + tags + error. R2'ye yazar, path DB'ye kaydeder.
 */
export async function exportResultsCsv(jobId: string): Promise<string> {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    include: { results: { orderBy: { rowIndex: 'asc' } } },
  });
  if (!job) throw new Error('Job bulunamadı');

  const opts = (job.options ?? {}) as { language?: string; length?: string };

  const header = [
    'row_index',
    'title',
    'features',
    'category',
    'short_description',
    'description',
    'tags',
    'error',
    'input_tokens',
    'output_tokens',
    'cost_cents',
    'language',
    'length',
  ];

  const rows: string[] = [header.join(',')];
  for (const r of job.results) {
    const inputData = (r.inputData ?? {}) as Partial<CsvRow>;
    const tags = Array.isArray(r.tags) ? (r.tags as string[]).join('|') : '';
    rows.push(
      [
        String(r.rowIndex),
        csvCell(r.inputTitle),
        csvCell(r.inputFeatures ?? ''),
        csvCell(inputData.category ?? ''),
        csvCell(r.shortDescription ?? ''),
        csvCell(r.description ?? ''),
        csvCell(tags),
        csvCell(r.errorMessage ?? ''),
        String(r.inputTokens),
        String(r.outputTokens),
        String(r.costCents),
        csvCell(opts.language ?? ''),
        csvCell(opts.length ?? ''),
      ].join(',')
    );
  }

  const csvText = rows.join('\n');

  const outputKey = `ai-bulk-results/${job.workspaceId}/${jobId}-${Date.now()}.csv`;

  // Upload to R2 if configured
  if (process.env.R2_ACCESS_KEY_ID) {
    try {
      const client = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT!,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });
      await client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: outputKey,
          Body: csvText,
          ContentType: 'text/csv',
        }),
      );
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${outputKey}`;
      await prisma.generationJob.update({
        where: { id: jobId },
        data: { outputCsvPath: publicUrl },
      });
      return publicUrl;
    } catch (err) {
      logger.error('[ai-bulk] R2 export upload failed, falling back to local', { error: err });
    }
  }

  // Local fallback
  const dir = path.join(process.cwd(), 'public', 'uploads', 'ai-bulk-results');
  await fs.mkdir(dir, { recursive: true });
  const filename = `${jobId}-${crypto.randomBytes(4).toString('hex')}.csv`;
  await fs.writeFile(path.join(dir, filename), csvText, 'utf-8');
  const localUrl = `/uploads/ai-bulk-results/${filename}`;
  await prisma.generationJob.update({
    where: { id: jobId },
    data: { outputCsvPath: localUrl },
  });
  return localUrl;
}

function csvCell(value: string): string {
  if (value == null) return '';
  const escaped = value.replace(/"/g, '""');
  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }
  return escaped;
}

// ============================================================================
// L4 — Dead Letter Queue helpers
// ============================================================================

/**
 * Dead letter row entry shape (GenerationJob.deadLetterRows JSON array elemanı).
 */
export interface DeadLetterRow {
  rowIndex: number;
  lastError: string;
  failedAt: string; // ISO date
  attempts: number;
}

/**
 * Bir satırı job'un deadLetterRows JSON alanına ekler.
 * Append-only (concurrent update için array'e read-modify-write).
 */
export async function appendToDeadLetter(
  jobId: string,
  rowIndex: number,
  lastError: string,
  attempts: number
): Promise<void> {
  try {
    const job = await prisma.generationJob.findUnique({
      where: { id: jobId },
      select: { deadLetterRows: true },
    });
    const current = Array.isArray(job?.deadLetterRows)
      ? (job!.deadLetterRows as unknown as DeadLetterRow[])
      : [];

    const newEntry: DeadLetterRow = {
      rowIndex,
      lastError: lastError.slice(0, 500),
      failedAt: new Date().toISOString(),
      attempts,
    };

    // Aynı rowIndex için duplicate append'i önle
    const filtered = current.filter((r) => r.rowIndex !== rowIndex);
    filtered.push(newEntry);

    await prisma.generationJob.update({
      where: { id: jobId },
      data: { deadLetterRows: filtered as unknown as object },
    });
  } catch (err) {
    logger.error('[ai-bulk] appendToDeadLetter failed', { jobId, rowIndex, err });
  }
}

/**
 * Dead letter notification job'ı kuyruğa ekler.
 * Mevcutsa no-op (duplicate enqueue'yi önler).
 */
export async function enqueueDeadLetterNotification(jobId: string): Promise<void> {
  try {
    const job = await prisma.generationJob.findUnique({
      where: { id: jobId },
      select: { deadLetterNotifiedAt: true },
    });
    // Eğer daha önce bildirim gönderildiyse tekrar gönderme
    if (job?.deadLetterNotifiedAt) return;

    await queue.add({
      id: `ai-bulk-dlq-${jobId}-${Date.now()}`,
      name: Jobs.AiBulkGenerateDeadLetter,
      data: { jobId },
    });
  } catch (err) {
    logger.error('[ai-bulk] enqueueDeadLetterNotification failed', { jobId, err });
  }
}

/**
 * Tek bir satırın retry'sini backoff sonrası tetikler.
 */
export async function enqueueRowRetry(
  jobId: string,
  rowIndex: number,
  delayMs: number
): Promise<void> {
  try {
    await queue.add({
      id: `ai-bulk-row-${jobId}-${rowIndex}-${Date.now()}`,
      name: Jobs.AiBulkRowRetry,
      data: { jobId, rowIndex },
      delay: delayMs,
    });
  } catch (err) {
    logger.error('[ai-bulk] enqueueRowRetry failed', { jobId, rowIndex, err });
  }
}

/**
 * Dead letter notification handler.
 * Job sahibine email gönderir + CSV export yapar.
 */
export async function processDeadLetterNotification(jobId: string): Promise<{
  emailSent: boolean;
  csvUrl: string | null;
  deadLetterCount: number;
}> {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!job) {
    logger.warn('[ai-bulk] DLQ notification: job bulunamadı', { jobId });
    return { emailSent: false, csvUrl: null, deadLetterCount: 0 };
  }

  if (job.deadLetterNotifiedAt) {
    logger.info('[ai-bulk] DLQ notification zaten gönderilmiş', { jobId });
    return { emailSent: true, csvUrl: job.outputCsvPath, deadLetterCount: 0 };
  }

  const deadLetter = Array.isArray(job.deadLetterRows)
    ? (job.deadLetterRows as unknown as DeadLetterRow[])
    : [];

  if (deadLetter.length === 0) {
    return { emailSent: false, csvUrl: null, deadLetterCount: 0 };
  }

  // CSV export oluştur
  let csvUrl: string | null = null;
  try {
    csvUrl = await exportResultsCsv(jobId);
  } catch (err) {
    logger.error('[ai-bulk] DLQ CSV export failed', { jobId, err });
  }

  // Email bildirim
  let emailSent = false;
  if (job.user.email) {
    try {
      const dashboardUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/saas/jobs/${jobId}`;
      const subject = `[DLQ] AI Bulk: ${deadLetter.length} satır kalıcı olarak başarısız`;
      const html = `
        <p>Merhaba ${job.user.name ?? ''},</p>
        <p>Toplu AI açıklama üretim işinizde <strong>${deadLetter.length} satır</strong> maksimum deneme sayısını aşarak dead letter kuyruğuna taşındı.</p>
        <p><strong>Toplam satır:</strong> ${job.totalRows}<br/>
        <strong>Başarılı:</strong> ${job.successfulRows}<br/>
        <strong>Başarısız (DLQ):</strong> ${deadLetter.length}</p>
        <p>Başarısız satırları görüntülemek ve manuel olarak tekrar denemek için:</p>
        <p><a href="${dashboardUrl}">${dashboardUrl}</a></p>
        <p>Başarısız satırların CSV çıktısı: <a href="${csvUrl ?? '#'}">indir</a></p>
      `;
      const text = `AI Bulk DLQ: ${deadLetter.length}/${job.totalRows} satır kalıcı olarak başarısız. Detay: ${dashboardUrl}`;

      const sendResult = await sendEmail({
        to: job.user.email,
        subject,
        html,
        text,
      });
      emailSent = sendResult.success;
    } catch (err) {
      logger.error('[ai-bulk] DLQ email failed', { jobId, err });
    }
  }

  await prisma.generationJob.update({
    where: { id: jobId },
    data: { deadLetterNotifiedAt: new Date() },
  });

  return { emailSent, csvUrl, deadLetterCount: deadLetter.length };
}

/**
 * Tek bir satırı retry eder. Row retry job handler tarafından çağrılır.
 */
export async function processRowRetry(
  jobId: string,
  rowIndex: number,
  options: BulkProcessOptions = {}
): Promise<{
  status: 'COMPLETED' | 'RETRYING' | 'DEAD_LETTER' | 'SKIPPED';
  error?: string;
}> {
  const retryConfig: RetryConfig = options.retryConfig ?? DEFAULT_RETRY_CONFIG;

  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    include: { brandVoice: true, user: { select: { email: true, name: true } } },
  });
  if (!job) {
    return { status: 'SKIPPED', error: 'Job bulunamadı' };
  }
  if (job.status === 'completed' || job.status === 'failed') {
    return { status: 'SKIPPED', error: 'Job zaten tamamlanmış' };
  }

  const existingResult = await prisma.generationResult.findFirst({
    where: { jobId, rowIndex },
  });
  if (!existingResult) {
    return { status: 'SKIPPED', error: 'Row result bulunamadı' };
  }
  if (existingResult.status === 'COMPLETED') {
    return { status: 'SKIPPED' };
  }

  const { rows: validRows } = await parseCsv(job.csvPath);
  const row = validRows[rowIndex];
  if (!row) {
    return { status: 'SKIPPED', error: 'Row data parse edilemedi' };
  }

  const opts = (job.options ?? {}) as {
    language?: 'tr' | 'en' | 'de' | 'ar' | 'fr' | 'es';
    length?: 'short' | 'medium' | 'long';
  };

  const currentRetryCount = existingResult.retryCount ?? 0;

  try {
    const aiResp = await aiService.generateProductDescription(
      {
        productName: row.title,
        features: row.features,
        variant: opts.length ?? 'medium',
        language: opts.language ?? 'tr',
        category: row.category,
        targetAudience: row.targetAudience,
        existingShortDescription: undefined,
      } as never,
      {
        userId: job.userId,
        userEmail: job.user.email ?? undefined,
      }
    );

    const costCents = aiResp.mock
      ? 0
      : estimateCostCents(
          aiResp.tokensUsed.input,
          aiResp.tokensUsed.output,
          getActiveModel() ?? undefined
        );

    await prisma.generationResult.update({
      where: { id: existingResult.id },
      data: {
        shortDescription: aiResp.shortDescription,
        description: aiResp.description,
        tags: aiResp.suggestedTags ?? [],
        inputTokens: aiResp.tokensUsed.input,
        outputTokens: aiResp.tokensUsed.output,
        costCents,
        model: aiResp.mock ? 'mock' : getActiveModel() ?? 'unknown',
        status: 'COMPLETED',
        errorMessage: null,
        lastError: null,
        lastErrorCode: null,
        nextRetryAt: null,
      },
    });

    // Update job counters
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        successfulRows: { increment: 1 },
        failedRows: { decrement: 1 },
      },
    });

    logger.info('[ai-bulk-retry] Row retry success', {
      jobId,
      rowIndex,
      attempts: currentRetryCount,
    });
    return { status: 'COMPLETED' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const errCode = classifyError(err);
    const newState: RowState = deriveRowState({
      error: err,
      retryCount: currentRetryCount,
      config: retryConfig,
    });

    logRetryDecision({
      jobId,
      rowIndex,
      state: newState,
      retryCount: currentRetryCount,
      errorCode: errCode,
      errorMessage: msg,
    });

    await prisma.generationResult.update({
      where: { id: existingResult.id },
      data: {
        errorMessage: msg.slice(0, 500),
        lastError: msg.slice(0, 500),
        lastErrorCode: errCode,
        retryCount: currentRetryCount + 1,
        status: newState,
        ...(newState === 'RETRYING'
          ? { nextRetryAt: getNextRetryAt(currentRetryCount, retryConfig) }
          : {}),
      },
    });

    if (newState === 'DEAD_LETTER') {
      await appendToDeadLetter(jobId, rowIndex, msg, currentRetryCount + 1);
      await enqueueDeadLetterNotification(jobId);
    } else if (newState === 'RETRYING') {
      const delayMs = getNextRetryAt(currentRetryCount, retryConfig).getTime() - Date.now();
      await enqueueRowRetry(jobId, rowIndex, Math.max(0, delayMs));
    }

    // PENDING asla buraya gelmemeli (deriveRowState null error → COMPLETED
    // döner; aksi halde RETRYING|DEAD_LETTER). Yine de narrowing için:
    const finalStatus: 'RETRYING' | 'DEAD_LETTER' | 'COMPLETED' =
      newState === 'PENDING' || newState === 'FAILED'
        ? 'COMPLETED'
        : newState;

    return {
      status: finalStatus,
      error: msg.slice(0, 200),
    };
  }
}

/**
 * L4 — Manuel retry endpoint. Dead letter'daki tüm satırların retryCount'unu
 * resetler ve tekrar kuyruğa ekler.
 */
export async function manualRetryDeadLetter(
  jobId: string,
  workspaceId: string
): Promise<{
  retriedCount: number;
  jobId: string;
}> {
  const job = await prisma.generationJob.findFirst({
    where: { id: jobId, workspaceId },
    select: { id: true, deadLetterRows: true, status: true },
  });
  if (!job) {
    throw new Error('Job bulunamadı veya workspace\'e ait değil');
  }

  const deadLetter = Array.isArray(job.deadLetterRows)
    ? (job.deadLetterRows as unknown as DeadLetterRow[])
    : [];

  if (deadLetter.length === 0) {
    return { retriedCount: 0, jobId };
  }

  // Reset retryCount + status for all dead-lettered rows
  await prisma.generationResult.updateMany({
    where: {
      jobId,
      status: 'DEAD_LETTER',
    },
    data: {
      retryCount: 0,
      status: 'PENDING',
      errorMessage: null,
      lastError: null,
      lastErrorCode: null,
      nextRetryAt: null,
    },
  });

  // Clear job-level deadLetterRows + increment reset counter
  await prisma.generationJob.update({
    where: { id: jobId },
    data: {
      deadLetterRows: [],
      retriesResetCount: { increment: 1 },
      failedRows: 0,
      status: 'pending',
    },
  });

  // Re-enqueue each row with no delay
  for (const entry of deadLetter) {
    await enqueueRowRetry(jobId, entry.rowIndex, 0);
  }

  logger.info('[ai-bulk] Manual DLQ retry', {
    jobId,
    workspaceId,
    retriedCount: deadLetter.length,
  });

  return { retriedCount: deadLetter.length, jobId };
}

/**
 * L4 — Real-time progress endpoint. processedRows + ETA hesaplar.
 * ETA = remainingRows × averageRowMs.
 */
export async function getJobProgress(jobId: string, workspaceId: string): Promise<{
  jobId: string;
  status: string;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  retriedRows: number;
  deadLetterRows: number;
  remainingRows: number;
  etaSeconds: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
} | null> {
  const job = await prisma.generationJob.findFirst({
    where: { id: jobId, workspaceId },
    select: {
      id: true,
      status: true,
      totalRows: true,
      processedRows: true,
      successfulRows: true,
      failedRows: true,
      startedAt: true,
      completedAt: true,
      deadLetterRows: true,
    },
  });
  if (!job) return null;

  const retried = await prisma.generationResult.count({
    where: { jobId, retryCount: { gt: 0 } },
  });

  const deadLetterCount = Array.isArray(job.deadLetterRows)
    ? (job.deadLetterRows as unknown as DeadLetterRow[]).length
    : 0;

  const remainingRows = Math.max(
    0,
    job.totalRows - job.processedRows - deadLetterCount
  );

  let etaSeconds: number | null = null;
  if (job.startedAt && job.processedRows > 0 && remainingRows > 0) {
    const elapsedMs = Date.now() - job.startedAt.getTime();
    const avgMsPerRow = elapsedMs / job.processedRows;
    etaSeconds = Math.ceil((avgMsPerRow * remainingRows) / 1000);
  }

  return {
    jobId: job.id,
    status: job.status,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    successfulRows: job.successfulRows,
    failedRows: job.failedRows,
    retriedRows: retried,
    deadLetterRows: deadLetterCount,
    remainingRows,
    etaSeconds,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  };
}

// ============================================================================
// Service namespace export
// ============================================================================

export const aiBulkService = {
  parseCsv,
  startBulkGeneration,
  processBulkGeneration,
  getJobStatus,
  listJobs,
  exportResultsCsv,
  appendToDeadLetter,
  enqueueDeadLetterNotification,
  processDeadLetterNotification,
  enqueueRowRetry,
  processRowRetry,
  manualRetryDeadLetter,
  getJobProgress,
};

// Helper: unused exports'u suppress etmek için (build warning engeller)
export { isAiConfigured };
