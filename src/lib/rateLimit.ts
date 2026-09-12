/**
 * Token bucket rate limiter — distributed (Redis) + in-memory fallback.
 *
 * Token bucket semantics (her iki implementasyon):
 *   - Her key icin bir bucket tutulur (capacity, tokens, lastRefill).
 *   - Her istek: (now - lastRefill) / 1000 * refillRate kadar token ekle,
 *     capacity'den fazla olmasin. Token >= 1 ise 1 dus, allowed=true.
 *   - allowed=false durumunda resetIn = (1 - tokens) / refillRate saniye.
 *
 * Dagitim modu (L7):
 *   - REDIS_URL tanimli VE ioredis yuklenebilirse → DistributedRateLimiter.
 *     Tum instance'lar ayni Redis'i gorur; oran limiti tekil olur.
 *   - Aksi halde → InMemoryRateLimiter (serverless/tek-instance uygun).
 *
 * Factory:
 *   isRedisConfigured() ? Redis : InMemory
 *
 * Multi-instance test notu:
 *   Redis dagitim modunda iki farkli Next.js instance'i ayni rate limit
 *   sayacini paylasir (ornek: Vercel'de iki region'a deploy edilmis
 *   edge function'lari). InMemory modunda her instance bagimsiz sayac
 *   tutar — efektif kapasite N katina cikar. Production'da Redis modu
 *   onerilir.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export interface RateLimitConfig {
  /** Bucket kapasitesi (max burst) */
  capacity: number;
  /** Saniyede kaç token yenilenir */
  refillRate: number;
  /** Unique identifier için key */
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

/** Bagimsiz driver kontrati — test veya alternatif backend icin. */
export interface RateLimiterDriver {
  check(key: string, config: RateLimitConfig): Promise<RateLimitResult> | RateLimitResult;
  cleanup(maxAgeMs?: number): Promise<void> | void;
}

// ============================================================================
// In-memory driver
// ============================================================================

class InMemoryRateLimiter implements RateLimiterDriver {
  private buckets = new Map<string, Bucket>();

  check(
    key: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now();
    const fullKey = `${config.keyPrefix ?? 'default'}:${key}`;

    let bucket = this.buckets.get(fullKey);
    if (!bucket) {
      bucket = { tokens: config.capacity, lastRefill: now };
      this.buckets.set(fullKey, bucket);
    }

    const elapsed = (now - bucket.lastRefill) / 1000;
    const refilled = Math.min(
      config.capacity,
      bucket.tokens + elapsed * config.refillRate
    );
    bucket.tokens = refilled;
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetIn: Math.ceil((1 - bucket.tokens) / config.refillRate),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((1 - bucket.tokens) / config.refillRate),
    };
  }

  /** Memory cleanup (eski bucket'ları sil) */
  cleanup(maxAgeMs = 60 * 60 * 1000) {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAgeMs) {
        this.buckets.delete(key);
      }
    }
  }
}

// ============================================================================
// Distributed (Redis) driver
// ============================================================================

/**
 * Redis token bucket — sliding window yaklasimi.
 *
 * Strateji:
 *   - Her key icin iki alan tutariz: tokens (float) ve lastRefill (ms).
 *   - INCR/GET yerine Lua script ile atomik refill+consume yapariz.
 *     Boylece race condition olmaz (iki instance ayni anda consume
 *     ederse biri digerini bloklar).
 *   - EXPIRE ile idle key'ler otomatik temizlenir (1 saat TTL).
 *
 * Notebook:
 *   - ioredis peer-dependency: bullmq ile ayni Redis baglantisini paylasir.
 *   - ioredis yuklenmemisse / baglanti kurulamiyorsa InMemory fallback.
 *   - Lazy init: ilk .check() cagrisinda Redis'e baglanir.
 */
class DistributedRateLimiter implements RateLimiterDriver {
  private client: any | null = null;
  private scriptSha: string | null = null;
  private readonly redisUrl: string;
  private initPromise: Promise<void> | null = null;

  // Lua script — atomik refill + consume + TTL yenileme.
  // Args: KEYS[1] = fullKey, ARGV[1] = capacity, ARGV[2] = refillRate,
  //       ARGV[3] = now (ms), ARGV[4] = ttlSec
  // Returns: { allowed (0/1), tokens (floor), resetIn (ceil) }
  private static readonly LUA_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(data[1])
local lastRefill = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  lastRefill = now
end

local elapsed = (now - lastRefill) / 1000
local refilled = math.min(capacity, tokens + elapsed * refillRate)

local allowed = 0
local remaining
local resetIn
if refilled >= 1 then
  refilled = refilled - 1
  allowed = 1
  remaining = math.floor(refilled)
  resetIn = 0
else
  remaining = 0
  resetIn = math.ceil((1 - refilled) / refillRate)
end

redis.call('HMSET', key, 'tokens', refilled, 'lastRefill', now)
redis.call('EXPIRE', key, ttl)

return { allowed, remaining, resetIn }
  `;

  constructor(redisUrl: string) {
    this.redisUrl = redisUrl;
  }

  /** ioredis'i lazy yukle — require() throw ederse null birak, fallback. */
  private async ensureClient(): Promise<any | null> {
    if (this.client) return this.client;
    if (this.initPromise) return this.initPromise.then(() => this.client);

    this.initPromise = (async () => {
      try {
        // ioredis peer-dep olarak bullmq ile gelir; yoksa dev/test ortaminda
        // graceful degradation yapilir (in-memory fallback).
        // eslint-disable-next-line
        const IORedis = require('ioredis');
        this.client = new IORedis(this.redisUrl, {
          // Baglanti kurulamiyorsa hata firlatmasin, retry etsin.
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          lazyConnect: false,
        });
        // Baglanti hatalarini yut — fallback InMemory kullanir.
        this.client.on('error', () => {
          // noop: check() hatayi handle eder
        });
        this.scriptSha = await this.client.script(
          'LOAD',
          DistributedRateLimiter.LUA_SCRIPT
        );
      } catch {
        this.client = null;
      }
    })();

    await this.initPromise;
    return this.client;
  }

  async check(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const fullKey = `${config.keyPrefix ?? 'default'}:${key}`;
    const client = await this.ensureClient();

    if (!client) {
      // Redis yok — in-memory fallback (sync davranis).
      return inMemoryLimiter.check(key, config);
    }

    try {
      const now = Date.now();
      // Sliding window TTL: bucket bosaldiktan ~1 saat sonra Redis
      // key'i otomatik silinir.
      const ttlSec = 3600;
      const result = await client.evalsha(
        this.scriptSha ?? '',
        1,
        fullKey,
        String(config.capacity),
        String(config.refillRate),
        String(now),
        String(ttlSec)
      );
      return {
        allowed: Number(result[0]) === 1,
        remaining: Number(result[1]),
        resetIn: Number(result[2]),
      };
    } catch (err) {
      // Script cache kaybi veya baglanti kopmasi — fallback.
      return inMemoryLimiter.check(key, config);
    }
  }

  async cleanup() {
    // Distributed modda Redis EXPIRE ile otomatik temizlenir;
    // explicit cleanup gerekmez (forward-compat).
    return;
  }
}

// ============================================================================
// Factory + Singleton
// ============================================================================

/** Redis konfigure edilmis mi? (env + ioredis yuklenebilir mi) */
function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

const inMemoryLimiter = new InMemoryRateLimiter();
let cachedLimiter: RateLimiterDriver | null = null;

/**
 * Singleton rate limiter — REDIS_URL varsa Redis, yoksa InMemory.
 * Ilk cagrida secim yapilir (lazy).
 */
export const rateLimiter: RateLimiterDriver = new Proxy({} as RateLimiterDriver, {
  get(_target, prop: string) {
    if (!cachedLimiter) {
      cachedLimiter = isRedisConfigured()
        ? new DistributedRateLimiter(process.env.REDIS_URL!.trim())
        : inMemoryLimiter;
    }
    const target = cachedLimiter as any;
    const value = target[prop];
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

/** Yaygın senaryolar için hazır rate limit yapılandırmaları */
export const RateLimits = {
  /** İletişim formu: dakikada 3 istek */
  contactForm: { capacity: 3, refillRate: 3 / 60, keyPrefix: 'contact' },
  /** Login: 5 dakikada 5 deneme */
  login: { capacity: 5, refillRate: 5 / 300, keyPrefix: 'login' },
  /** Genel API: saniyede 10 istek */
  api: { capacity: 10, refillRate: 10, keyPrefix: 'api' },
  /** Admin API: dakikada 60 istek */
  adminApi: { capacity: 60, refillRate: 1, keyPrefix: 'admin' },
  /** Auth endpoint'leri (Phase D.8): dakikada 10 istek — register, forgot-password, 2fa verify */
  auth: { capacity: 10, refillRate: 10 / 60, keyPrefix: 'auth' },
};

// Periyodik cleanup — sadece in-memory modda anlamli.
// Redis modda EXPIRE ile otomatik temizlenir.
if (typeof global !== 'undefined') {
  const interval = setInterval(() => {
    if (cachedLimiter === inMemoryLimiter) {
      inMemoryLimiter.cleanup();
    }
  }, 10 * 60 * 1000);
  // Node process'in interval yüzünden açık kalmasını engelle
  if (typeof interval.unref === 'function') interval.unref();
}
