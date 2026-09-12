/**
 * @file Cookie Consent API — KVKK/GDPR uyumlu consent kayıt endpoint'i.
 *
 * POST /api/user/cookie-consent
 *   body: { necessary, analytics, marketing, preferences, consentText? }
 *   - Opsiyonel auth: user varsa userId ile, yoksa sessionToken ile kayıt.
 *   - 12 aylık geçerlilik (KVKK Madde 5/2 — düzenli yenileme).
 *   - Audit log yazılır (CONSENT_GRANT veya CONSENT_REVOKE).
 *
 * Public endpoint — auth zorunlu değil (KVKK anonim ziyaretçi hakları).
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';

const CONSENT_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000; // 12 ay

const BodySchema = z.object({
  necessary: z.literal(true).default(true),
  analytics: z.boolean().default(false),
  marketing: z.boolean().default(false),
  preferences: z.boolean().default(false),
  consentText: z.string().max(5000).optional(),
  revoke: z.boolean().optional(), // Tüm izni iptal flag'i
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json();
    const data = BodySchema.parse(body);

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    // Session token — cookie'den veya yeni oluştur
    const cookieStore = await cookies();
    let sessionToken = cookieStore.get('nok_session')?.value;
    if (!sessionToken) {
      sessionToken = `anon_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
      cookieStore.set('nok_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
      });
    }

    // IP / UA (audit için)
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? 'unknown';

    const expiresAt = new Date(Date.now() + CONSENT_VALIDITY_MS);

    // Mevcut kayıt varsa güncelle, yoksa oluştur
    const existing = userId
      ? await prisma.cookieConsent.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        })
      : await prisma.cookieConsent.findUnique({
          where: { sessionToken },
        });

    const isRevoke = data.revoke === true;
    const persisted = await prisma.cookieConsent.upsert({
      where: existing?.id ? { id: existing.id } : { id: '__new__' },
      create: {
        userId: userId ?? null,
        sessionToken: userId ? null : sessionToken,
        necessary: true,
        analytics: isRevoke ? false : data.analytics,
        marketing: isRevoke ? false : data.marketing,
        preferences: isRevoke ? false : data.preferences,
        ipAddress,
        userAgent,
        consentText: data.consentText ?? null,
        expiresAt,
      },
      update: {
        necessary: true,
        analytics: isRevoke ? false : data.analytics,
        marketing: isRevoke ? false : data.marketing,
        preferences: isRevoke ? false : data.preferences,
        ipAddress,
        userAgent,
        consentText: data.consentText ?? null,
        expiresAt,
      },
    });

    // Audit log (fire-and-forget)
    void logAudit({
      userId,
      action: isRevoke ? 'CONSENT_REVOKE' : 'CONSENT_GRANT',
      resource: 'cookie_consent',
      resourceId: persisted.id,
      ipAddress,
      userAgent,
      details: {
        analytics: persisted.analytics,
        marketing: persisted.marketing,
        preferences: persisted.preferences,
      },
    });

    logger.info('Cookie consent saved', {
      userId: userId ?? 'anonymous',
      sessionTokenHash: sessionToken.slice(0, 12),
      analytics: persisted.analytics,
      marketing: persisted.marketing,
      preferences: persisted.preferences,
    });

    return ok({
      id: persisted.id,
      analytics: persisted.analytics,
      marketing: persisted.marketing,
      preferences: persisted.preferences,
      expiresAt: persisted.expiresAt.toISOString(),
    });
  });
}

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
      // Anonim — mevcut cookie'deki session token'ı kullan
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('nok_session')?.value;
      if (!sessionToken) return ok({ consent: null });
      const c = await prisma.cookieConsent.findUnique({
        where: { sessionToken },
      });
      return ok({ consent: c ? serialize(c) : null });
    }
    const c = await prisma.cookieConsent.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ consent: c ? serialize(c) : null });
  });
}

function serialize(c: {
  id: string;
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: c.id,
    necessary: c.necessary,
    analytics: c.analytics,
    marketing: c.marketing,
    preferences: c.preferences,
    expiresAt: c.expiresAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
