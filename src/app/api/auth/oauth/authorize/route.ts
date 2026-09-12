/**
 * @file GET /api/auth/oauth/authorize — OAuth 2.0 Authorization Endpoint
 * @description RFC 6749 § 4.1.1 + PKCE (RFC 7636).
 *
 *              Akış:
 *              1. Query params validate (AuthorizeRequestSchema)
 *              2. client_id DB'de var mı + aktif mi?
 *              3. redirect_uri client whitelist'inde mi?
 *              4. Kullanıcı login mi?
 *                 - Değilse → /giris?callbackUrl=... (returnTo olarak current URL)
 *              5. Consent UI'ya redirect et (/auth/oauth/consent)
 *                 - state, code_challenge, scope bilgileri query string'de iletilir
 *
 *              Hata durumları:
 *              - invalid_request → 400 JSON
 *              - invalid_client → 400 JSON
 *              - redirect_uri mismatch → user-agent'a hata gösterilir (URI'ye yönlendirilmez)
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthorizeRequestSchema } from '@/modules/oauth/schemas';
import {
  findActiveClient,
  validateRedirectUri,
  validateScopes,
} from '@/modules/oauth/service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Query params validate
    const url = new URL(req.url);
    const raw = {
      response_type: url.searchParams.get('response_type'),
      client_id: url.searchParams.get('client_id'),
      redirect_uri: url.searchParams.get('redirect_uri'),
      scope: url.searchParams.get('scope') ?? 'read:profile',
      state: url.searchParams.get('state') ?? undefined,
      code_challenge: url.searchParams.get('code_challenge'),
      code_challenge_method: url.searchParams.get('code_challenge_method') ?? 'S256',
    };

    const parsed = AuthorizeRequestSchema.safeParse(raw);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Geçersiz istek';
      return NextResponse.json(
        {
          success: false,
          error: { code: 'invalid_request', message },
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }
    const req_data = parsed.data;

    // 2. Client lookup
    const client = await findActiveClient(req_data.client_id);
    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'invalid_client',
            message: 'Bilinmeyen veya iptal edilmiş client',
          },
        },
        { status: 400 }
      );
    }

    // 3. Redirect URI whitelist check
    if (!validateRedirectUri(client, req_data.redirect_uri)) {
      logger.warn('[oauth] redirect_uri not in whitelist', {
        clientId: req_data.client_id,
        redirectUri: req_data.redirect_uri,
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'invalid_request',
            message: 'redirect_uri client whitelist\'inde değil',
          },
        },
        { status: 400 }
      );
    }

    // 4. Scope subset check
    const requestedScopes = req_data.scope.trim().split(/\s+/);
    const scopeCheck = validateScopes(client, requestedScopes);
    if (!scopeCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'invalid_scope',
            message: 'Client bu scope\'ları talep edemez',
          },
        },
        { status: 400 }
      );
    }

    // 5. Login kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      // ReturnTo olarak current URL'i encode et
      const returnTo = encodeURIComponent(req.url);
      return NextResponse.redirect(
        new URL(`/giris?callbackUrl=${returnTo}`, req.url)
      );
    }

    // 6. Consent UI'ya redirect — tüm OAuth parametreleri query string'de
    const consentUrl = new URL('/auth/oauth/consent', req.url);
    consentUrl.searchParams.set('client_id', req_data.client_id);
    consentUrl.searchParams.set('redirect_uri', req_data.redirect_uri);
    consentUrl.searchParams.set('scope', req_data.scope);
    consentUrl.searchParams.set('code_challenge', req_data.code_challenge);
    consentUrl.searchParams.set('code_challenge_method', req_data.code_challenge_method);
    if (req_data.state) consentUrl.searchParams.set('state', req_data.state);

    logger.info('[oauth] authorize → consent', {
      clientId: req_data.client_id,
      userId: (session.user as any).id,
      scopes: requestedScopes,
    });

    return NextResponse.redirect(consentUrl);
  } catch (err) {
    logger.error('[oauth] authorize endpoint failed', { err });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'server_error',
          message: 'OAuth yetkilendirme başarısız',
        },
      },
      { status: 500 }
    );
  }
}
