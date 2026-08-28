/**
 * POST /api/partners/lead
 *
 * Public endpoint: Partner landing page'den gelen lead kayitlari.
 * Body: { partnerSlug, customerEmail, customerName?, source?, metadata? }
 *
 * Auth gerektirmez — public landing page'den cagrilir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { partnerService } from '@/modules/partners';
import { handleApiError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

const LeadSubmissionSchema = z.object({
  partnerSlug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(60),
  customerEmail: z.string().email().max(254),
  customerName: z.string().min(1).max(120).optional(),
  source: z.string().max(40).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    if (!json) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz JSON gövdesi' },
        { status: 400 }
      );
    }

    const parsed = LeadSubmissionSchema.safeParse(json);
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

    const lead = await partnerService.submitLead(parsed.data);

    return NextResponse.json({
      success: true,
      data: {
        id: lead.id,
        status: lead.status,
        partnerSlug: parsed.data.partnerSlug,
      },
    });
  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ success: false, error: message }, { status: statusCode });
  }
}