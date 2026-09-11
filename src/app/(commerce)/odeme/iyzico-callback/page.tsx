/**
 * iyzico Checkout Callback (GET fallback)
 *
 * iyzico canlıda token'ı POST ile /api/checkout/iyzico-callback'e gönderir.
 * Bu sayfa eski bookmark / mock GET ?token= için aynı fulfillment'ı çalıştırır.
 *
 * NOT: next/navigation redirect() throw eder; catch içinde yutulmamalı.
 */

import { redirect } from 'next/navigation';
import { fulfillIyzicoToken } from '@/modules/commerce/iyzicoCallback';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function isNextRedirect(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    String((err as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')
  );
}

interface PageProps {
  searchParams: { token?: string; status?: string };
}

export default async function IyzicoCallbackPage({ searchParams }: PageProps) {
  const token = searchParams.token;

  if (!token) {
    redirect('/odeme/basarili?iyzico_error=no_token');
  }

  try {
    const result = await fulfillIyzicoToken(token);

    if (!result.ok) {
      redirect(`/odeme/basarili?iyzico_error=${result.reason}`);
    }

    if (result.kind === 'order') {
      redirect(`/odeme/basarili?iyzico=success&order=${encodeURIComponent(result.orderNumber)}`);
    }

    redirect(`/odeme/basarili?iyzico=success&plan=${encodeURIComponent(result.planSlug)}`);
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    logger.error('[iyzico] callback page failed', { error: err });
    redirect('/odeme/basarili?iyzico_error=verify_failed');
  }
}
