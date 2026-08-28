/**
 * Admin Campaigns API
 *
 * GET  — Tum campaign'leri istatistiklerle listele.
 * POST — Yeni campaign olustur.
 *
 * Auth: NextAuth session zorunlu (admin paneli).
 */

import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailMarketingService } from '@/modules/email-marketing/service';
import { emailCampaignRepository } from '@/modules/email-marketing/repository';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 });
    }

    const campaigns = await emailCampaignRepository.findWithStats();
    return ok({ campaigns });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 });
    }

    const body = await req.json();
    const campaign = await emailMarketingService.createCampaign(body);
    return ok({ campaign }, { status: 201 });
  });
}