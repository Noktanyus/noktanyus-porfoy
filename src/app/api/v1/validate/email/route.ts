import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateEmailMx } from '@/modules/tr-api';

const BodySchema = z.object({
  email: z.string().min(3).max(254),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = await validateEmailMx(data.email);
  return NextResponse.json({ success: true, data: result });
});
