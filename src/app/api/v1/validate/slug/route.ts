import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateSlug } from '@/modules/tr-api';

const BodySchema = z.object({
  slug: z.string().min(1).max(128),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateSlug(data.slug) });
});
