import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { reorderPoint } from '@/modules/tr-api';

const BodySchema = z.object({
  dailyDemand: z.number().nonnegative(),
  leadTimeDays: z.number().nonnegative(),
  safetyStock: z.number().nonnegative().optional(),
  currentStock: z.number().nonnegative(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: reorderPoint(data) });
});
