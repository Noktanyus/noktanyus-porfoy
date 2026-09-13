import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateSpanishDni } from '@/modules/tr-api';

const BodySchema = z.object({
  dni: z.string().min(8).max(16),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateSpanishDni(data.dni) });
});
