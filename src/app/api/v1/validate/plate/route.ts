import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validatePlate } from '@/modules/tr-api';

const BodySchema = z.object({
  plate: z.string().min(1).max(16),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = validatePlate(data.plate);
  return NextResponse.json({ success: true, data: result });
});
