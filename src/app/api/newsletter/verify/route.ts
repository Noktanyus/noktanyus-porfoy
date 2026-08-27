/**
 * GET /api/newsletter/verify
 *
 * Double opt-in doğrulama. Email içindeki linke tıklandığında
 * subscriber verifiedAt set edilir ve blog'a yönlendirilir.
 * Query: ?token=xxx
 */

import { NextRequest } from 'next/server';
import { newsletterService } from '@/modules/newsletter';
import { withErrorHandling } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  return withErrorHandling(async () => {
    await newsletterService.verify(token);
    logger.info('Newsletter verified via link');
    // Başarılı doğrulama sonrası blog'a yönlendir
    return redirect('/blog?newsletter=verified');
  });
}