/**
 * @file Sandbox seed endpoint
 * @description Admin-only endpoint that wipes all transactional data and
 *              re-seeds a minimal `About` row. Intended for local dev and
 *              staging only; refuses to run when sandbox mode is off.
 */

import { NextRequest } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    if (!isSandboxMode()) {
      return fail({
        code: 'NOT_SANDBOX',
        message: 'Sandbox modu aktif değil — bu endpoint yalnızca test/dev ortamında kullanılabilir',
        statusCode: 403,
      } as any);
    }

    // Reset transactional data (DANGEROUS — sandbox only).
    // Order matters: child tables before parents.
    await prisma.$transaction([
      prisma.license.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.order.deleteMany(),
      prisma.bundlePurchase.deleteMany(),
      prisma.digitalProduct.deleteMany(),
      prisma.userSubscription.deleteMany(),
      prisma.coupon.deleteMany(),
      prisma.monitor.deleteMany(),
      prisma.message.deleteMany(),
    ]);

    // Re-seed the minimal row needed for the public site
    await prisma.about.upsert({
      where: { id: 'sandbox-about' },
      update: {
        name: 'Sandbox',
        title: 'Sandbox User',
        headerTitle: 'Sandbox Mode',
        content: 'Sandbox ortamı — tüm veriler test amaçlıdır.',
      },
      create: {
        id: 'sandbox-about',
        name: 'Sandbox',
        title: 'Sandbox User',
        headerTitle: 'Sandbox Mode',
        content: 'Sandbox ortamı — tüm veriler test amaçlıdır.',
      },
    });

    await logAudit({
      action: 'UPDATE',
      resource: 'sandbox',
      resourceId: 'reset',
      details: { action: 'seed', cleared: true },
    });

    return ok({ reset: true, mode: 'sandbox' });
  });
}