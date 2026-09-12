/**
 * @file POST /api/auth/oauth/authorize/decision — Allow/Deny Endpoint
 * @description Consent UI'dan gelen kararı işler. Kullanıcı Allow seçtiyse
 *              authorization code üretir ve client'a redirect eder
 *              (?code=...&state=...). Deny seçtiyse error parametresi ile
 *              redirect eder.
 *
 *              RFC 6749 § 4.1.2 (successful response) ve § 4.1.2.1 (error response).
 *
 *              Güvenlik:
 *              - Login zorunlu (session yoksa 401)
 *              - Client lookup + redirect_uri whitelist
 *              - Scope subset check (UI'da da server'da da doğrulanır)
 *              - Authorization code 10dk TTL, tek kullanımlık
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthorizeDecisionSchema } from '@/modules/oauth/schemas';
import {
  findActiveClient,
  validateRedirectUri,
  validateScopes,
  createAuthorizationCode,
} from '@/modules/oauth/service';
import { UnauthorizedError, ValidationError } from '@/modules/shared/errors';
import { logger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    // 1. Body parse — form-data veya JSON kabul et (consent form HTML form-data gönderir)
    const ct = req.headers.get('content-type') ?? '';
    let body: Record<string, unknown>;
    if (ct.includes('application/json')) {
      body = await req.json().catch(() => ({}));
    } else {
      const form = await req.formData().catch(() => null);
      body = form
        ? Object.fromEntries(
            Array.from(form.entries()).map(([k, v]) => [k, String(v)])
          )
        : {};
    }

    const parsed = AuthorizeDecisionSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Geçersiz karar';
      throw new ValidationError(message);
    }
    const data = parsed.data;

    // 2. Client lookup + redirect_uri whitelist
    const client = await findActiveClient(data.client_id);
    if (!client) {
      throw new ValidationError('Geçersiz client');
    }
    if (!validateRedirectUri(client, data.redirect_uri)) {
      throw new ValidationError('redirect_uri whitelist dışı');
    }

    // 3. Scope subset check (UI'da gizlenmiş olsa bile server doğrular)
    const requestedScopes = data.scope.trim().split(/\s+/);
    const scopeCheck = validateScopes(client, requestedScopes);
    if (!scopeCheck.valid) {
      throw new ValidationError('Client bu scope\'ları talep edemez');
    }

    // 4. Build redirect URL — error veya code ile
    const redirectUrl = new URL(data.redirect_uri);

    if (data.decision === 'deny') {
      redirectUrl.searchParams.set('error', 'access_denied');
      redirectUrl.searchParams.set(
        'error_description',
        'Kullanıcı erişimi reddetti'
      );
      if (data.state) redirectUrl.searchParams.set('state', data.state);

      logger.info('[oauth] authorization denied', {
        userId,
        clientId: data.client_id,
      });
      return NextResponse.redirect(redirectUrl);
    }

    // 5. Allow → code üret ve redirect
    const { code } = await createAuthorizationCode({
      clientId: data.client_id,
      userId,
      redirectUri: data.redirect_uri,
      scopes: scopeCheck.granted,
      codeChallenge: data.code_challenge,
      codeChallengeMethod: data.code_challenge_method,
    });

    redirectUrl.searchParams.set('code', code);
    if (data.state) redirectUrl.searchParams.set('state', data.state);

    logger.info('[oauth] authorization granted', {
      userId,
      clientId: data.client_id,
      scopes: scopeCheck.granted,
    });

    return NextResponse.redirect(redirectUrl);
  });
}
