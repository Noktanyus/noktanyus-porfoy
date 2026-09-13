import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateCnpj } from '@/modules/tr-api';

const BodySchema = z.object({
  cnpj: z.string().min(14).max(22),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateCnpj(data.cnpj) });
});
