/**
 * API versiyon sözleşmesi + deprecation metadata (Stripe/HubSpot tarzı).
 *
 * Brownout (Stripe tarzı): deprecated path'lerde opsiyonel periyodik 503.
 * Master switch: API_BROWNOUT_ENABLED=true|1
 * Olasılık: API_BROWNOUT_PROBABILITY (0–1, varsayılan 0.05)
 * Mod: API_BROWNOUT_MODE=time|random (varsayılan time — dakika içinde deterministik dilim)
 * Retry-After sn: API_BROWNOUT_RETRY_AFTER (varsayılan 30)
 */

export const API_VERSION = '2026-10-09';

/**
 * Path prefix → sunset ISO date (opsiyonel) + successor path.
 * Eşleşen uçlarda Deprecation / Sunset / Link rel="successor-version" basılır.
 * Aktif TR yüzeyi `/api/v1/*` (AI ürünü kaldırıldı); eski AI prefix'i tarihsel örnek.
 */
const DEPRECATED_PREFIXES: Array<{ prefix: string; sunset?: string; successor?: string }> = [
  {
    prefix: '/api/v1/ai',
    sunset: 'Wed, 01 Jul 2026 00:00:00 GMT',
    successor: '/docs/versioning',
  },
];

export function matchDeprecation(pathname: string): {
  deprecated: boolean;
  sunset?: string;
  successor?: string;
} {
  for (const d of DEPRECATED_PREFIXES) {
    if (pathname === d.prefix || pathname.startsWith(d.prefix + '/')) {
      return { deprecated: true, sunset: d.sunset, successor: d.successor };
    }
  }
  return { deprecated: false };
}

export type BrownoutMode = 'time' | 'random';

export type BrownoutConfig = {
  enabled: boolean;
  probability: number;
  retryAfterSeconds: number;
  mode: BrownoutMode;
};

export type BrownoutDecision = {
  brownout: boolean;
  retryAfterSeconds: number;
};

/** Env'den brownout ayarlarını oku (test için env inject edilebilir). */
export function getBrownoutConfig(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): BrownoutConfig {
  const raw = env.API_BROWNOUT_ENABLED;
  const enabled = raw === '1' || raw === 'true' || raw === 'TRUE';
  const rawProb = Number(env.API_BROWNOUT_PROBABILITY ?? '0.05');
  const probability = Number.isFinite(rawProb)
    ? Math.min(1, Math.max(0, rawProb))
    : 0.05;
  const rawRetry = Number(env.API_BROWNOUT_RETRY_AFTER ?? '30');
  const retryAfterSeconds =
    Number.isFinite(rawRetry) && rawRetry > 0 ? Math.ceil(rawRetry) : 30;
  const mode: BrownoutMode =
    env.API_BROWNOUT_MODE === 'random' ? 'random' : 'time';
  return { enabled, probability, retryAfterSeconds, mode };
}

/**
 * Deprecated path + enabled flag ise olasılığa göre brownout kararı.
 * `time` modu: her dakikada ilk (probability×60) saniye diliminde 503 (deterministik).
 * `random` modu: Math.random() &lt; probability.
 */
export function shouldBrownoutDeprecatedPath(
  pathname: string,
  opts?: {
    nowMs?: number;
    random?: () => number;
    env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  }
): BrownoutDecision {
  const cfg = getBrownoutConfig(opts?.env ?? process.env);
  const retryAfterSeconds = cfg.retryAfterSeconds;
  const dep = matchDeprecation(pathname);

  if (!dep.deprecated || !cfg.enabled || cfg.probability <= 0) {
    return { brownout: false, retryAfterSeconds };
  }

  let hit: boolean;
  if (cfg.mode === 'random') {
    const roll = opts?.random ?? Math.random;
    hit = roll() < cfg.probability;
  } else {
    const nowMs = opts?.nowMs ?? Date.now();
    const secondOfMinute = Math.floor(nowMs / 1000) % 60;
    hit = secondOfMinute < cfg.probability * 60;
  }

  return { brownout: hit, retryAfterSeconds };
}

/** Brownout 503 gövdesi (withApiKey / route handler'lar ortak kullanır). */
export function brownoutErrorBody(): {
  success: false;
  error: { code: 'ENDPOINT_BROWNOUT'; message: string };
} {
  return {
    success: false,
    error: {
      code: 'ENDPOINT_BROWNOUT',
      message:
        'This deprecated endpoint is temporarily unavailable (brownout). Migrate using Sunset / Link headers; honor Retry-After.',
    },
  };
}

/** NextResponse headers üzerine versiyon / deprecation bas. */
export function applyApiVersionHeaders(
  headers: Headers,
  pathname: string
): void {
  headers.set('X-API-Version', API_VERSION);
  headers.set('API-Version', API_VERSION);
  const dep = matchDeprecation(pathname);
  if (dep.deprecated) {
    headers.set('Deprecation', 'true');
    if (dep.sunset) headers.set('Sunset', dep.sunset);
    if (dep.successor) {
      headers.set('Link', `<${dep.successor}>; rel="successor-version"`);
    }
  }
}
