/**
 * POST /api/v1/legal/enforcement-cost — Türkiye İcra Takibi Açılış Harç ve Masraf API
 * 2004 s. İcra ve İflas Kanunu ve 492 s. Harçlar Kanunu (1) sayılı Tarife uyarınca
 * ilamlı/ilamsız icra takibi açılışında peşin harç, başvurma harcı, vekalet harcı,
 * baro pulu ve tebligat giderleri döküm motoru.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateEnforcementCost } from '@/modules/tr-api/enforcementCost';

const EnforcementCostSchema = z.object({
  claimAmount: z.number().positive(),
  enforcementType: z.enum(['without_judgment', 'with_judgment']).optional().default('without_judgment'),
  hasAttorney: z.boolean().optional().default(true),
  debtorCount: z.number().int().positive().optional().default(1),
  noticeType: z.enum(['postal', 'electronic']).optional().default('postal'),
  customApplicationFee: z.number().nonnegative().optional(),
});

export const POST = withTrApi(EnforcementCostSchema, async (data) => {
  const result = calculateEnforcementCost({
    claimAmount: data.claimAmount,
    enforcementType: data.enforcementType ?? 'without_judgment',
    hasAttorney: data.hasAttorney ?? true,
    debtorCount: data.debtorCount ?? 1,
    noticeType: data.noticeType ?? 'postal',
    customApplicationFee: data.customApplicationFee,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
