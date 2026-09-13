import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateEthAddressEip55 } from '@/modules/tr-api';

const BodySchema = z.object({ address: z.string().min(40).max(64) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateEthAddressEip55(data.address) });
});
