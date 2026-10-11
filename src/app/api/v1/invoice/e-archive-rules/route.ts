/**
 * POST /api/v1/invoice/e-archive-rules — GİB e-Arşiv Limiti & KDV İstisna Kodları API
 * 509 Sıra No'lu VUK Genel Tebliği limitleri ve UBL-TR istisna kodları servisi.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import {
  checkEArchiveRequirement,
  searchVatExemptionCodes,
  OFFICIAL_THRESHOLDS,
} from '@/modules/tr-api/eArchiveRules';

const EArchiveRulesSchema = z.object({
  totalAmountIncludingVat: z.number().nonnegative().optional(),
  recipientType: z.enum(['taxpayer', 'consumer']).optional().default('taxpayer'),
  sameDayPreviousInvoicesTotal: z.number().nonnegative().optional().default(0),
  searchExemptionQuery: z.string().optional(),
  exemptionCategory: z.enum(['all', 'tam_istisna', 'kismi_istisna', 'diger']).optional().default('all'),
});

export const POST = withTrApi(EArchiveRulesSchema, async (data) => {
  let thresholdResult = null;
  if (data.totalAmountIncludingVat !== undefined) {
    thresholdResult = checkEArchiveRequirement({
      totalAmountIncludingVat: data.totalAmountIncludingVat,
      recipientType: data.recipientType ?? 'taxpayer',
      sameDayPreviousInvoicesTotal: data.sameDayPreviousInvoicesTotal ?? 0,
    });
  }

  const exemptionCodes = searchVatExemptionCodes(data.searchExemptionQuery, data.exemptionCategory);

  return NextResponse.json({
    success: true,
    data: {
      thresholds: OFFICIAL_THRESHOLDS,
      evaluation: thresholdResult,
      exemptionCodes,
    },
  });
});
