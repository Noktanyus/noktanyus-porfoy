/**
 * /api/user/partner
 *
 * GET  → Authenticated user'in partner istatistiklerini getir
 * POST → Yeni partner kaydi olustur (Zod validation)
 *
 * Auth: NextAuth session zorunlu.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { partnerService } from '@/modules/partners';
import { handleApiError } from '@/lib/error-handler';
import { UnauthorizedError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const CreatePartnerSchema = z.object({
  companyName: z.string().min(2).max(120),
  contactEmail: z.string().email().max(254),
  website: z.string().url().max(254).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  commissionPercent: z.number().min(0).max(100).optional(),
  webhookUrl: z.string().url().max(500).optional().or(z.literal('')),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError();
    const userId = (session.user as { id?: string }).id;
    if (!userId) throw new UnauthorizedError();

    const stats = await partnerService.getStats(userId);
    if (!stats) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Henüz bir iş ortağı kaydınız yok',
      });
    }

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ success: false, error: message }, { status: statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError();
    const userId = (session.user as { id?: string }).id;
    if (!userId) throw new UnauthorizedError();

    const json = await req.json().catch(() => null);
    if (!json) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz JSON gövdesi' },
        { status: 400 }
      );
    }

    const parsed = CreatePartnerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Doğrulama hatası',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const partner = await partnerService.createPartner({
      userId,
      companyName: parsed.data.companyName,
      contactEmail: parsed.data.contactEmail,
      website: parsed.data.website || undefined,
      description: parsed.data.description || undefined,
      commissionPercent: parsed.data.commissionPercent,
      webhookUrl: parsed.data.webhookUrl || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: partner.id,
        slug: partner.slug,
        companyName: partner.companyName,
        commissionPercent: partner.commissionPercent,
      },
    });
  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ success: false, error: message }, { status: statusCode });
  }
}