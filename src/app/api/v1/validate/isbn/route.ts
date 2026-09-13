import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateIsbn10, validateIsbn13 } from '@/modules/tr-api';

const BodySchema = z.object({ isbn: z.string().min(10).max(20), version: z.enum(['10','13','auto']).optional() });

export const POST = withTrApi(BodySchema, async (data) => {
  const v = data.version ?? 'auto';
  const digits = data.isbn.replace(/[-\s]/g, '');
  const result = v === '10' || (v === 'auto' && digits.length === 10)
    ? validateIsbn10(data.isbn)
    : validateIsbn13(data.isbn);
  return NextResponse.json({ success: true, data: result });
});
