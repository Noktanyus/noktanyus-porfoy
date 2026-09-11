/**
 * iyzico Checkout Form callback.
 *
 * Canlı iyzico token'ı application/x-www-form-urlencoded POST body ile gönderir.
 * Mock / bookmark akışı GET ?token= kullanır.
 * Başarılı fulfillment sonrası /odeme/basarili'ya yönlendirir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/seo';
import { fulfillIyzicoToken } from '@/modules/commerce/iyzicoCallback';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, getBaseUrl()));
}

async function handleToken(token: string | null) {
  if (!token) {
    return redirectTo('/odeme/basarili?iyzico_error=no_token');
  }

  const result = await fulfillIyzicoToken(token);
  if (!result.ok) {
    logger.warn('[iyzico callback] fulfill failed', { reason: result.reason });
    return redirectTo(`/odeme/basarili?iyzico_error=${result.reason}`);
  }

  if (result.kind === 'order') {
    return redirectTo(
      `/odeme/basarili?iyzico=success&order=${encodeURIComponent(result.orderNumber)}`
    );
  }

  return redirectTo(
    `/odeme/basarili?iyzico=success&plan=${encodeURIComponent(result.planSlug)}`
  );
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const token = (form?.get('token') as string | null) ?? null;
  return handleToken(token);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  return handleToken(token);
}
