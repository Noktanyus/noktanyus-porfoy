/**
 * POST /api/tools/email-mx — ücretsiz tarayıcı aracı (API key yok, basit rate limit)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateEmailMx } from '@/modules/tr-api/emailMx';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  email: z.string().min(3).max(254),
});

const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || row.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (row.count >= MAX_PER_WINDOW) return false;
  row.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMIT', message: 'Çok fazla istek — bir dakika bekleyin' } },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Geçersiz e-posta' } },
      { status: 400 }
    );
  }

  const data = await validateEmailMx(parsed.data.email);
  return NextResponse.json({
    success: true,
    data: {
      email: data.normalized,
      syntaxValid: !data.reason?.includes('format'),
      valid: data.valid,
      hasMx: Boolean(data.hasMx),
      mxHosts: data.mxHosts ?? [],
      note: data.reason ?? (data.valid ? 'Format ve MX OK' : undefined),
    },
  });
}
