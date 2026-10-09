/**
 * POST /api/v1/invoice/ubl-validate — UBL-TR XML yapısal lint
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateUblXml } from '@/modules/tr-api/ubl';

const BodySchema = z.object({
  xml: z.string().min(20).max(2_000_000),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = validateUblXml(data);
  return NextResponse.json({ success: true, data: result });
});
