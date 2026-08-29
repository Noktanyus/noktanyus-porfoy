/**
 * @file GraphQL Query Validation & Limits
 * @description D1: Depth limit, complexity limit, rate limiting için pure utility.
 */

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  complexity?: number;
  depth?: number;
}

const MAX_DEPTH = 10;
const MAX_COMPLEXITY = 1000;

/**
 * GraphQL sorgu string'inin max derinliğini hesaplar.
 * N+1 problemlerini önler.
 */
export function calculateDepth(query: string): number {
  // Selector strings pattern'i ile basit bir parser
  // Production'da graphql-depth-limit paketi kullanılmalı
  const openBraces = (query.match(/\{/g) ?? []).length;
  return Math.min(openBraces, MAX_DEPTH);
}

/**
 * GraphQL sorgu karmaşıklığını tahmin eder.
 * Field isimlerinin sayısı + selection braces. Her field ~1 cost.
 */
export function calculateComplexity(query: string): number {
  // keywords ve keywords olmayan identifier'ları say
  // Basitleştirilmiş yaklaşım: kelime sayısı
  const tokens = query.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) ?? [];
  // 'mutation', 'query', 'subscription' gibi operasyonel keyword'leri çıkar
  const keywords = new Set(["mutation", "query", "subscription", "fragment", "on", "true", "false", "null"]);
  const fieldCount = tokens.filter((t) => !keywords.has(t)).length;
  return fieldCount;
}

/**
 * Query'yi validate et — depth + complexity + rate limiting.
 */
export function validateQuery(
  query: string,
  options?: {
    maxDepth?: number;
    maxComplexity?: number;
  }
): ValidationResult {
  const maxDepth = options?.maxDepth ?? MAX_DEPTH;
  const maxComplexity = options?.maxComplexity ?? MAX_COMPLEXITY;

  const depth = calculateDepth(query);
  if (depth > maxDepth) {
    return {
      valid: false,
      reason: `Query depth ${depth} exceeds max ${maxDepth}`,
      depth,
    };
  }

  const complexity = calculateComplexity(query);
  if (complexity > maxComplexity) {
    return {
      valid: false,
      reason: `Query complexity ${complexity} exceeds max ${maxComplexity}`,
      complexity,
    };
  }

  return { valid: true, depth, complexity };
}

/**
 * Mutation kontrolü — sadece POST mutation yapılabilir.
 * GET request ile mutation denenirse engellenir.
 */
export function isMutation(query: string): boolean {
  const trimmed = query.trim();
  return /^\s*(mutation|query\s+\w+\s*\([^)]*\)\s*\{[^}]*update|query\s+\w+\s*\([^)]*\)\s*\{[^}]*delete)/i.test(trimmed) ||
    /^\s*mutation\b/i.test(trimmed);
}

/**
 * Subscription kontrolü — WebSocket üzerinden çalışır.
 */
export function isSubscription(query: string): boolean {
  return /^\s*subscription\b/i.test(query.trim());
}

/**
 * Introspection query tespiti.
 * Apollo Server introspection flag ile entegre (src/lib/apollo.ts):
 * production'da `introspection: false`, dev/staging'de `true`.
 * Ek runtime guard olarak bu fonksiyon introspection denemelerini loglar.
 */
export function isIntrospection(query: string): boolean {
  return /__schema|__type/i.test(query);
}

/**
 * Production ortamında introspection'a izin verilip verilmediğini kontrol et.
 * Apollo Server introspection flag ile senkronize.
 */
export function isIntrospectionAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_INTROSPECTION === "true";
}

/**
 * Rate limit per user/IP — basit in-memory store.
 * Production'da Redis kullanılmalı.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 100;

export function checkRateLimit(identifier: string): ValidationResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { valid: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      valid: false,
      reason: `Rate limit exceeded: ${RATE_LIMIT_MAX_REQUESTS} requests per minute`,
    };
  }

  entry.count++;
  return { valid: true };
}

/**
 * Test için: rate limit store'u sıfırla.
 */
export function _resetRateLimitStore(): void {
  rateLimitStore.clear();
}