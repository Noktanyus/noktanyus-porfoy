/**
 * POST /api/affiliate/payout — affiliate payout talebi olustur
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { affiliateService } from '@/modules/affiliate';

const PayoutSchema = z.object({
  method: z.enum(['bank_transfer', 'paypal', 'stripe']),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const body = await req.json();
    const data = PayoutSchema.parse(body);

    const payout = await affiliateService.requestPayout(userId, data.method, data.notes);
    return ok({ payout }, { status: 201 });
  });
}