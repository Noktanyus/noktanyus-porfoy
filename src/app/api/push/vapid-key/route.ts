/**
 * GET /api/push/vapid-key
 *
 * Frontend'in pushManager.subscribe() cagirmasi icin gereken
 * VAPID public key'i doner. Key yoksa 503 doner.
 */

import { pushService } from '@/modules/push-notifications';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withErrorHandling(async () => {
    if (!pushService.isEnabled()) {
      throw new AppError(
        'Push notifications are not configured on this server.',
        503,
        'PUSH_DISABLED'
      );
    }
    return ok({ publicKey: pushService.getPublicKey() });
  });
}