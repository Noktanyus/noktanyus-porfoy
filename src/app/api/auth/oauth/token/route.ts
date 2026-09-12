/**
 * @file POST /api/auth/oauth/token — OAuth 2.0 Token Endpoint
 * @description RFC 6749 § 3.2 + § 4.1.3 + § 6 (refresh).
 *
 *              İki grant_type desteklenir (discriminated union):
 *              - authorization_code: code → access_token + refresh_token (10dk code TTL)
 *              - refresh_token: refresh_token → yeni access_token + refresh_token (30g refresh TTL,
 *                rotation chain audit)
 *
 *              Client authentication:
 *              - HTTP Basic Auth (Authorization: Basic base64(client_id:client_secret))
 *              - Body auth (client_id + client_secret form/JSON)
 *              İki yöntemden en az biri dolu olmalı.
 *
 *              PKCE: code_verifier zorunlu (authorization_code grant).
 *
 *              Güvenlik:
 *              - Constant-time PKCE compare
 *              - bcrypt client secret compare
 *              - Single-use code (transaction ile atomik)
 *              - Token DB'de HASH'li saklanır (SHA256)
 *              - Access token 1 saat TTL
 *              - Refresh token rotation: eski revoke + replacedById, yeni access+refresh atomik
 *              - Refresh token reuse detection: tum aktif refresh'ler revoke
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenRequestSchema } from '@/modules/oauth/schemas';
import {
  exchangeAuthorizationCode,
  findActiveClient,
  verifyClientSecret,
  validateAccessToken,
  rotateRefreshToken,
} from '@/modules/oauth/service';
import { logger } from '@/lib/logger';
import { AppError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

// Cache-Control: token response ASLA cache'lenmemeli.
const NO_STORE = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

/**
 * RFC 6749 § 2.3.1: Authorization Basic header parse.
 * "Basic base64(client_id:client_secret)"
 */
function parseBasicAuth(header: string | null): { id: string; secret: string } | null {
  if (!header) return null;
  const m = /^Basic\s+([A-Za-z0-9+/=._-]+)$/.exec(header);
  if (!m) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(m[1]!, 'base64').toString('utf8');
  } catch {
    return null;
  }
  const idx = decoded.indexOf(':');
  if (idx < 0) return null;
  return { id: decoded.slice(0, idx), secret: decoded.slice(idx + 1) };
}

/**
 * OAuth error response standard format (RFC 6749 § 5.2).
 * Body: { error, error_description?, error_uri? }
 */
function tokenError(
  error: string,
  description: string,
  status: number
): NextResponse {
  return NextResponse.json(
    { error, error_description: description },
    { status, headers: NO_STORE }
  );
}

async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    return req.json().catch(() => ({}));
  }
  // application/x-www-form-urlencoded default (RFC 6749 § 4.1.3)
  const text = await req.text().catch(() => '');
  const params = new URLSearchParams(text);
  return Object.fromEntries(params.entries());
}

export async function POST(req: NextRequest) {
  try {
    const body = await readBody(req);

    // 1. Schema validate — discriminated union (grant_type'a gore zorunlu alanlar)
    const parsed = TokenRequestSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Geçersiz istek';
      return tokenError('invalid_request', message, 400);
    }
    const data = parsed.data;

    // 2. Client credentials — Basic Auth ÖNCE, sonra body fallback
    const basic = parseBasicAuth(req.headers.get('authorization'));
    const clientId = (basic?.id ?? (body.client_id as string) ?? '').trim();
    const clientSecret = basic?.secret ?? ((body.client_secret as string) ?? '');

    if (!clientId || !clientSecret) {
      return tokenError(
        'invalid_client',
        'client_id ve client_secret gerekli (Basic veya body)',
        401
      );
    }

    // 3. Client lookup + secret verify
    const client = await findActiveClient(clientId);
    if (!client) {
      return tokenError('invalid_client', 'Bilinmeyen client', 401);
    }
    const secretOk = await verifyClientSecret(clientSecret, client.clientSecret);
    if (!secretOk) {
      logger.warn('[oauth] token endpoint: client secret mismatch', { clientId });
      return tokenError('invalid_client', 'Geçersiz client credentials', 401);
    }

    // 4. Grant dispatch — discriminated union narrowing
    if (data.grant_type === 'authorization_code') {
      try {
        const result = await exchangeAuthorizationCode({
          clientId,
          clientSecret,
          code: data.code,
          redirectUri: data.redirect_uri,
          codeVerifier: data.code_verifier,
        });
        // RFC 6749 § 5.1 response shape
        return NextResponse.json(
          {
            access_token: result.accessToken,
            token_type: result.tokenType,
            expires_in: result.expiresIn,
            refresh_token: result.refreshToken,
            scope: result.scope,
          },
          { headers: NO_STORE }
        );
      } catch (err) {
        if (err instanceof AppError) {
          return tokenError(err.code.toLowerCase(), err.message, err.statusCode);
        }
        throw err;
      }
    }

    // refresh_token grant (data.grant_type === 'refresh_token' — discriminated)
    try {
      const result = await rotateRefreshToken({
        plainRefreshToken: data.refresh_token,
        clientId,
        requestedScope: data.scope,
      });
      logger.info('[oauth] token refreshed', {
        clientId,
        scope: result.scope,
      });
      // RFC 6749 § 5.1 response shape — rotation her zaman yeni refresh_token doner
      return NextResponse.json(
        {
          access_token: result.accessToken,
          token_type: result.tokenType,
          expires_in: result.expiresIn,
          refresh_token: result.refreshToken,
          scope: result.scope,
        },
        { headers: NO_STORE }
      );
    } catch (err) {
      if (err instanceof AppError) {
        return tokenError(err.code.toLowerCase(), err.message, err.statusCode);
      }
      throw err;
    }
  } catch (err) {
    logger.error('[oauth] token endpoint failed', { err });
    return tokenError('server_error', 'Token endpoint başarısız', 500);
  }
}

/**
 * GET endpoint: token introspection'a benzer minimal doğrulama.
 * Token yoksa 400; geçersizse 200 active:false; geçerliyse metadata.
 *
 * NOT: Production'da /introspect (RFC 7662) ayrı endpoint olarak
 * expose edilmeli; burada sadece basit validate için.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (!token) {
      return NextResponse.json(
        { active: false, error: 'token parametresi gerekli' },
        { status: 400 }
      );
    }
    const result = await validateAccessToken(token);
    if (!result) {
      return NextResponse.json({ active: false }, { status: 200 });
    }
    return NextResponse.json({
      active: true,
      client_id: result.clientId,
      user_id: result.userId,
      scope: result.scopes.join(' '),
    });
  } catch (err) {
    logger.error('[oauth] token GET validate failed', { err });
    return NextResponse.json(
      { active: false, error: 'server_error' },
      { status: 500 }
    );
  }
}
