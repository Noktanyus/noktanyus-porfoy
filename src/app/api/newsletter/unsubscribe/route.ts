/**
 * GET /api/newsletter/unsubscribe
 *
 * Abonelik iptal. Email footer'daki unsubscribe linkine tıklandığında çağrılır.
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
    await newsletterService.unsubscribe(token);
    logger.info('Newsletter unsubscribed via link');
    return redirect('/?newsletter=unsubscribed');
  });
}