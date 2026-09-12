/**
 * AI Bulk Generation — Retry Policy (L4 / Phase Async/Compliance)
 *
 * Per-row retryable/fatal hata sınıflandırması + backoff tablosu.
 * service.ts içindeki processBulkGeneration bu modülü kullanarak:
 *   - AI_RATE_LIMIT | NETWORK_ERROR | TIMEOUT → retryable (artır retryCount)
 *   - VALIDATION | AUTH | QUOTA_EXCEEDED → fatal (dead letter'a taşı, retry yapma)
 *
 * Yapılandırma:
 *   - maxRetries: aynı satır için izin verilen maksimum deneme sayısı
 *   - retryBackoffMs: index = retryCount → ms cinsinden bekleme
 *   - retryableErrors: classifyError'da retryable sayılacak hata kodları
 */

import { logger } from '@/lib/logger';

// ============================================================================
// Hata kodu enum'ı
// ============================================================================

/**
 * Bilinen hata kodları. processBulkGeneration içinde `code` property'si ile
 * taşınır (Error.code). Tanınmayanlar "UNKNOWN" sayılır → retryable.
 */
export const AI_BULK_ERROR_CODES = {
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INTERNAL: 'INTERNAL',
  UNKNOWN: 'UNKNOWN',
} as const;

export type AiBulkErrorCode =
  (typeof AI_BULK_ERROR_CODES)[keyof typeof AI_BULK_ERROR_CODES];

// ============================================================================
// RetryConfig
// ============================================================================

export interface RetryConfig {
  /** Aynı satır için izin verilen maksimum deneme sayısı (initial attempt dahil). */
  maxRetries: number;
  /** Backoff tablosu: index = sonraki retry denemesinin gecikmesi (ms). */
  retryBackoffMs: number[];
  /** Retryable sayılan hata kodları. */
  retryableErrors: AiBulkErrorCode[];
}

/**
 * Varsayılan retry konfigürasyonu. Üretim ortamında env ile override edilebilir:
 *   AI_BULK_MAX_RETRIES, AI_BULK_RETRY_BACKOFF_MS (JSON array)
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryBackoffMs: [1000, 5000, 30000], // 1s, 5s, 30s
  retryableErrors: [
    AI_BULK_ERROR_CODES.AI_RATE_LIMIT,
    AI_BULK_ERROR_CODES.NETWORK_ERROR,
    AI_BULK_ERROR_CODES.TIMEOUT,
  ],
};

// ============================================================================
// Error sınıflandırma
// ============================================================================

/**
 * Bir hata nesnesini sınıflandırır:
 *   - Error.code varsa (sistem hatası) direkt kullan
 *   - Yoksa message'ten pattern match dene (ai service'den gelen fallback)
 *
 * @param err  Yakalanan hata
 * @returns    Sınıflandırılmış AiBulkErrorCode
 */
export function classifyError(err: unknown): AiBulkErrorCode {
  if (err && typeof err === 'object') {
    const code = (err as { code?: string }).code;
    if (code && isKnownErrorCode(code)) {
      return code as AiBulkErrorCode;
    }
  }

  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();

  // Pattern-based fallback (ai service generic error'ları için)
  if (message.includes('rate limit') || message.includes('429')) return AI_BULK_ERROR_CODES.AI_RATE_LIMIT;
  if (message.includes('timeout') || message.includes('etimedout') || message.includes('aborterror')) return AI_BULK_ERROR_CODES.TIMEOUT;
  if (message.includes('network') || message.includes('econnreset') || message.includes('enotfound') || message.includes('fetch failed')) return AI_BULK_ERROR_CODES.NETWORK_ERROR;
  if (message.includes('unauthorized') || message.includes('401') || message.includes('403')) return AI_BULK_ERROR_CODES.AUTH;
  if (message.includes('validation') || message.includes('invalid') || message.includes('schema')) return AI_BULK_ERROR_CODES.VALIDATION;
  if (message.includes('quota') || message.includes('limit exceeded')) return AI_BULK_ERROR_CODES.QUOTA_EXCEEDED;

  return AI_BULK_ERROR_CODES.UNKNOWN;
}

function isKnownErrorCode(code: string): code is AiBulkErrorCode {
  return Object.values(AI_BULK_ERROR_CODES).includes(code as AiBulkErrorCode);
}

// ============================================================================
// Retryable mı?
// ============================================================================

/**
 * Verilen hata retryable mı?
 *   - Bilinen retryable kodlardan biri → true
 *   - Bilinen fatal kodlardan biri → false
 *   - Unknown → config'e göre (default: UNKNOWN retryable DEĞİL — güvenli taraf)
 *     Config retryableErrors'a UNKNOWN eklenirse, sadece o zaman retryable olur.
 */
export function isRetryableError(err: unknown, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  const code = classifyError(err);
  if (code === AI_BULK_ERROR_CODES.UNKNOWN) {
    // UNKNOWN default fatal; eğer config'te UNKNOWN retryable listesinde varsa
    // retryable kabul et (explicit opt-in).
    return config.retryableErrors.includes(AI_BULK_ERROR_CODES.UNKNOWN);
  }
  return config.retryableErrors.includes(code);
}

// ============================================================================
// Backoff hesaplama
// ============================================================================

/**
 * Bir sonraki retry için bekleme süresini hesaplar (ms).
 *   retryCount = 0 → retryBackoffMs[0] (1s default)
 *   retryCount = 1 → retryBackoffMs[1] (5s default)
 *   retryCount >= retryBackoffMs.length → son eleman kullanılır
 */
export function getBackoffMs(
  retryCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  if (config.retryBackoffMs.length === 0) return 1000;
  const idx = Math.min(retryCount, config.retryBackoffMs.length - 1);
  return config.retryBackoffMs[idx];
}

/**
 * Bir sonraki retry zamanını Date olarak döner (now + backoff).
 */
export function getNextRetryAt(
  retryCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Date {
  return new Date(Date.now() + getBackoffMs(retryCount, config));
}

// ============================================================================
// Per-row state machine
// ============================================================================

export type RowState = 'PENDING' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';

/**
 * Per-row durum makinesi geçişleri:
 *   PENDING → COMPLETED (başarılı)
 *   PENDING → RETRYING (retryable hata, retryCount < maxRetries)
 *   PENDING → DEAD_LETTER (retryCount >= maxRetries VEYA fatal hata)
 *   RETRYING → COMPLETED (retry başarılı)
 *   RETRYING → DEAD_LETTER (retry sonrası yine başarısız)
 */
export function deriveRowState(args: {
  /** Yeni hata varsa: classify edilir. null ise başarı. */
  error: unknown | null;
  /** Mevcut retryCount (önceki denemeler). */
  retryCount: number;
  config?: RetryConfig;
}): RowState {
  if (args.error === null) return 'COMPLETED';

  const cfg = args.config ?? DEFAULT_RETRY_CONFIG;
  const retryable = isRetryableError(args.error, cfg);

  if (!retryable) return 'DEAD_LETTER';

  // Retryable ise: bir sonraki deneme sayısı = retryCount + 1
  const nextAttempt = args.retryCount + 1;
  if (nextAttempt > cfg.maxRetries) return 'DEAD_LETTER';
  return 'RETRYING';
}

// ============================================================================
// Logging
// ============================================================================

export function logRetryDecision(args: {
  jobId: string;
  rowIndex: number;
  state: RowState;
  retryCount: number;
  errorCode: AiBulkErrorCode;
  errorMessage: string;
}): void {
  const level = args.state === 'DEAD_LETTER' ? 'error' : 'warn';
  logger[level]('[ai-bulk-retry] Row state transition', {
    jobId: args.jobId,
    rowIndex: args.rowIndex,
    state: args.state,
    retryCount: args.retryCount,
    errorCode: args.errorCode,
    errorMessage: args.errorMessage.slice(0, 200),
  });
}
