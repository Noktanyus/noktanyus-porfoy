/**
 * In-memory token bucket rate limiter.
 *
 * Serverless ortamda (Vercel, AWS Lambda) bucket'lar instance başına tutulur,
 * yani aynı anda çalışan birden fazla instance birbirinin bucket'larını görmez.
 * Tek instance / standalone deployment için yeterli koruma sağlar.
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

class RateLimiter {
  private buckets = new Map<string, Bucket>();

  check(
    key: string,
    config: RateLimitConfig
  ): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const fullKey = `${config.keyPrefix ?? 'default'}:${key}`;

    let bucket = this.buckets.get(fullKey);
    if (!bucket) {
      bucket = { tokens: config.capacity, lastRefill: now };
      this.buckets.set(fullKey, bucket);
    }

    // Token refill (süre geçtiyse)
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

export const rateLimiter = new RateLimiter();

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
};

// Periyodik cleanup - 10 dakikada bir eski bucket'ları sil
if (typeof global !== 'undefined') {
  const interval = setInterval(() => rateLimiter.cleanup(), 10 * 60 * 1000);
  // Node process'in interval yüzünden açık kalmasını engelle
  if (typeof interval.unref === 'function') interval.unref();
}