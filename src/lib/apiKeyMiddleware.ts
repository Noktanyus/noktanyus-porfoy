/**
 * API Key Middleware
 *
 * Next.js route handler'ları için API key auth sarmalayıcı.
 *
 * Kullanım:
 *   export const GET = withApiKey(async (req, ctx) => { ... });
 *
 * Header'lar:
 *   - Authorization: Bearer nokt_live_xxx
 *   - X-Api-Key: nokt_live_xxx
 *
 * Yapılan kontroller:
 *   1. Key presence
 *   2. Key validation (DB + revoked + expired + quota)
 *   3. Rate limiting (per-key bucket — bucket identity = validated keyId,
 *      böylece aynı kullanıcıya ait key rotasyonlarında bucket izole kalır)
 *   4. Usage tracking (fire-and-forget)
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from '@/modules/api-keys/service';
import { rateLimiter } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

export interface ApiKeyContext {
  userId: string;
  keyId: string;
  scopes: string[];
}

/**
 * Scope kontrolü. Admin scope'u her şeyi kapsar.
 *
 * NOT: SaaS scope'ları (`ai:bulk:write` vb.) için `@/lib/saasScopes`
 * içindeki `hasSaasScope` / `ensureSaasScope` kullanılır. Bu helper ise
 * API-key modülünün kendi `ApiKeyScopeSchema`'sı ile uyumludur; SaaS
 * scope adlarını da geçerli kabul eder (string-based), yani rotalar
 * ihtiyaç duyduğunda bu helper'ı kullanabilir.
 */
export function hasScope(scopes: string[], required: string): boolean {
  if (!scopes || scopes.length === 0) return false;
  if (scopes.includes('admin') || scopes.includes('*') || scopes.includes('api:*')) {
    return true;
  }
  if (scopes.includes(required)) {
    return true;
  }

  // Kategori wildcard kontrolü (örn. 'api:validate:*' -> 'api:validate:iban')
  const parts = required.split(':');
  if (parts.length >= 2) {
    const categoryWildcard = `${parts[0]}:${parts[1]}:*`;
    if (scopes.includes(categoryWildcard)) return true;
  }

  // Geriye dönük uyumluluk: Eski tr:validate:write ve tr:invoice:write şemsiye scope'ları
  if (scopes.includes('tr:validate:write')) {
    if (required.startsWith('api:') && !required.startsWith('api:invoice:')) {
      return true;
    }
  }
  if (scopes.includes('tr:invoice:write')) {
    if (required.startsWith('api:invoice:')) {
      return true;
    }
  }

  return false;
}

/**
 * API key doğrulama + rate limit + usage tracking.
 *
 * ÖNEMLİ: Bu fonksiyon `async` DEĞİLDİR. Next.js route handler export'ları
 * (GET/POST/...) doğrudan fonksiyon bekler; Promise dönersek route çağrılamaz.
 * İçeride rateLimiter.check() async olabilir (Redis backend), bu yüzden
 * Promise.resolve ile sarmalayıp bekliyoruz.
 */
export function withApiKey(
  handler: (req: NextRequest, ctx: ApiKeyContext) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');
    const apiKeyHeader = req.headers.get('x-api-key');

    let apiKey: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    } else if (apiKeyHeader) {
      apiKey = apiKeyHeader.trim();
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'API key required' },
        },
        { status: 401 }
      );
    }

    // Key validation
    const validation = await apiKeyService.validateKey(apiKey);
    if (!validation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_KEY',
            message: 'Invalid, expired, or quota-exceeded API key',
          },
        },
        { status: 401 }
      );
    }

    // Rate limit — bucket identity'yi doğrulanmış keyId'ye bağla.
    // Önceki implementasyon `apikey:<rawKey>` kullanıyordu — bu, aynı
    // kullanıcının key rotasyonlarında bucket'ı sıfırlamıyor ve raw token
    // bilgisini rate-limit log'larında tutuyordu.
    const bucketKey = validation.keyId;
    // rateLimiter.check() sync veya async olabilir (Redis backend);
    // Promise.resolve ile normalize edip await ediyoruz.
    const limit = await Promise.resolve(rateLimiter.check(bucketKey, {
      capacity: validation.rateLimit,
      refillRate: validation.rateLimit / 60, // per minute -> per second
      keyPrefix: 'apikey',
    }));

    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded',
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(limit.resetIn),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Limit': String(validation.rateLimit),
          },
        }
      );
    }

    // Execute handler — usage tracking sonucu bekleyip response status'unu al
    let responseStatus = 200;
    let responseObj: NextResponse;
    try {
      responseObj = await handler(req, validation);
      responseStatus = responseObj.status;
    } catch (err) {
      responseStatus = 500;
      logger.error('API key handler error', {
        error: err instanceof Error ? err.message : String(err),
        keyId: validation.keyId,
      });
      throw err;
    } finally {
      // Fire-and-forget usage tracking
      apiKeyService
        .trackUsage(validation.keyId, {
          endpoint: req.nextUrl.pathname,
          method: req.method,
          statusCode: responseStatus,
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
        })
        .catch(() => {
          // zaten log'lanıyor
        });
    }

    // Rate limit headers
    responseObj.headers.set('X-RateLimit-Limit', String(validation.rateLimit));
    responseObj.headers.set('X-RateLimit-Remaining', String(limit.remaining));
    return responseObj;
  };
}