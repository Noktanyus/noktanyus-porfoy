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
 *   3. Rate limiting (per-key bucket)
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
 */
export function hasScope(scopes: string[], required: string): boolean {
  if (scopes.includes('admin')) return true;
  return scopes.includes(required);
}

/**
 * API key doğrulama + rate limit + usage tracking.
 */
export async function withApiKey(
  handler: (req: NextRequest, ctx: ApiKeyContext) => Promise<NextResponse>
) {
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

    // Rate limit — per-key bucket
    const bucketKey = `apikey:${apiKey.substring(0, 20)}`;
    const limit = rateLimiter.check(bucketKey, {
      capacity: validation.rateLimit,
      refillRate: validation.rateLimit / 60, // per minute -> per second
      keyPrefix: 'apikey',
    });

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