/**
 * POST /api/v1/validate/identity — TCKN veya VKN format doğrulama
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateTckn, validateVkn } from '@/modules/tr-api';

const BodySchema = z.object({
  type: z.enum(['tckn', 'vkn']),
  value: z.string().min(1).max(32),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result =
    data.type === 'tckn' ? validateTckn(data.value) : validateVkn(data.value);

  return NextResponse.json({
    success: true,
    data: {
      type: data.type,
      ...result,
    },
  });
});
