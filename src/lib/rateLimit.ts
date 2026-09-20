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
  timestamps: number[];
  lastAccess: number;
}

export interface RateLimitConfig {
  /** Bucket kapasitesi (max burst) */
  capacity: number;
  /** Saniyede kaç token yenilenir */
  refillRate: number;
  /** Unique identifier için key */
  keyPrefix?: string;
  /** Opsiyonel pencere süresi (ms). Tanımlı değilse (capacity / refillRate) * 1000 */
  windowMs?: number;
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
// In-memory driver (Sliding Window Log)
// ============================================================================

const globalForRateLimit = globalThis as unknown as {
  __rateLimitBuckets?: Map<string, Bucket>;
  __rateLimiterInstance?: RateLimiterDriver;
};

class InMemoryRateLimiter implements RateLimiterDriver {
  private get buckets(): Map<string, Bucket> {
    if (!globalForRateLimit.__rateLimitBuckets) {
      globalForRateLimit.__rateLimitBuckets = new Map<string, Bucket>();
    }
    return globalForRateLimit.__rateLimitBuckets;
  }

  check(
    key: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now();
    const fullKey = `${config.keyPrefix ?? 'default'}:${key}`;
    const windowMs = config.windowMs ?? Math.max(1000, Math.round((config.capacity / (config.refillRate || 1)) * 1000));

    let bucket = this.buckets.get(fullKey);
    if (!bucket) {
      bucket = { timestamps: [], lastAccess: now };
      this.buckets.set(fullKey, bucket);
    }

    // Süresi dolmuş istek zamanlarını pencereden çıkar
    const windowStart = now - windowMs;
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);
    bucket.lastAccess = now;

    if (bucket.timestamps.length >= config.capacity) {
      const oldest = bucket.timestamps[0] ?? (now - windowMs);
      const resetIn = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetIn,
      };
    }

    bucket.timestamps.push(now);
    const remaining = Math.max(0, config.capacity - bucket.timestamps.length);
    const oldest = bucket.timestamps[0];
    const resetIn = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

    return {
      allowed: true,
      remaining,
      resetIn,
    };
  }

  /** Memory cleanup (eski bucket'ları sil) */
  cleanup(maxAgeMs = 60 * 60 * 1000) {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastAccess > maxAgeMs) {
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
local windowMs = math.max(1000, math.floor((capacity / refillRate) * 1000))
local clearBefore = now - windowMs

redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local count = redis.call('ZCARD', key)

if count < capacity then
  redis.call('ZADD', key, now, now)
  redis.call('EXPIRE', key, ttl)
  local remaining = capacity - count - 1
  return { 1, remaining, math.ceil(windowMs / 1000) }
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestTime = tonumber(oldest and oldest[2]) or (now - windowMs)
  local resetIn = math.max(1, math.ceil((oldestTime + windowMs - now) / 1000))
  return { 0, 0, resetIn }
end
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
// Upstash / Vercel KV REST driver (Zero external dependencies)
// ============================================================================

class UpstashRestRateLimiter implements RateLimiterDriver {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const fullKey = `${config.keyPrefix ?? 'default'}:${key}`;
    const windowSec = Math.max(1, Math.round(config.capacity / (config.refillRate || 1)));

    try {
      const res = await fetch(`${this.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', fullKey],
          ['EXPIRE', fullKey, windowSec],
        ]),
      });

      if (!res.ok) {
        return inMemoryLimiter.check(key, config);
      }

      const data = await res.json();
      const count = Number(data?.[0]?.result ?? 1);
      const allowed = count <= config.capacity;
      const remaining = Math.max(0, config.capacity - count);

      return {
        allowed,
        remaining,
        resetIn: windowSec,
      };
    } catch {
      return inMemoryLimiter.check(key, config);
    }
  }

  async cleanup() {
    return;
  }
}

// ============================================================================
// Factory + Singleton
// ============================================================================

/** Redis konfigure edilmis mi? (env + ioredis yuklenebilir mi veya Upstash REST) */
function isRedisConfigured(): boolean {
  return Boolean(
    process.env.REDIS_URL?.trim() ||
    (process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()) ||
    (process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim())
  );
}

const inMemoryLimiter = new InMemoryRateLimiter();
let cachedLimiter: RateLimiterDriver | null = null;

function createRateLimiter(): RateLimiterDriver {
  if (process.env.REDIS_URL?.trim()) {
    return new DistributedRateLimiter(process.env.REDIS_URL.trim());
  }
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim();
  if (upstashUrl && upstashToken) {
    return new UpstashRestRateLimiter(upstashUrl, upstashToken);
  }
  return inMemoryLimiter;
}

/**
 * Singleton rate limiter — REDIS_URL varsa Redis, Upstash REST varsa Upstash, yoksa InMemory.
 * Ilk cagrida secim yapilir (lazy).
 */
export const rateLimiter: RateLimiterDriver = new Proxy({} as RateLimiterDriver, {
  get(_target, prop: string) {
    if (!cachedLimiter) {
      cachedLimiter = createRateLimiter();
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
