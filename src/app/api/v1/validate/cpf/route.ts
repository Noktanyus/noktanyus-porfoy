import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateCpf } from '@/modules/tr-api';

const BodySchema = z.object({
  cpf: z.string().min(11).max(18),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateCpf(data.cpf) });
});
