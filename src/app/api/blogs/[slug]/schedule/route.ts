/**
 * @file /api/blogs/[id]/schedule - Blog yazisini zamanlanmis olarak ayarla
 * @description POST: Mevcut bir blog yazisini status="scheduled" yaparak
 *              belirtilen tarihte otomatik yayinlanacak sekilde ayarlar.
 *              Auth gerektirir (admin session).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';
import { blogService } from '@/modules/content/service';

const Schema = z.object({
  scheduledAt: z.coerce.date().refine((d) => d > new Date(), {
    message: 'Gelecek tarih olmalı',
  }),
});

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }

    const body = await req.json();
    const { scheduledAt } = Schema.parse(body);

    const post = await blogService.schedulePost(params.id, scheduledAt);
    return ok({ post });
  });
}
