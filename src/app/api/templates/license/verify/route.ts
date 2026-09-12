/**
 * @file /api/templates/license/verify - POST
 * @description Lisans anahtari dogrulama endpoint'i.
 *              Public — 3rd party scriptler / CLI'lar lisans anahtarini
 *              dogrulamak icin kullanabilir.
 *              Body: { licenseKey: string }
 *              Response: { valid, template: {...}, permissions: {...} }
 */

import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { z } from 'zod';
import { verifyLicenseKey } from '@/modules/marketplace/templateService';
import {
  NotFoundError,
  ForbiddenError,
} from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

/** Body schema — licenseKey zorunlu, min 8 max 128 karakter. */
const VerifyLicenseBodySchema = z.object({
  licenseKey: z
    .string()
    .min(8, 'Gecersiz lisans anahtari (en az 8 karakter)')
    .max(128, 'Gecersiz lisans anahtari'),
});

/** Lisans tipine gore permissions map. */
const LICENSE_TYPE_PERMISSIONS: Record<string, string[]> = {
  single: ['use-single-domain'],
  'white-label': ['use-single-domain', 'rebrand', 'custom-domain'],
  agency: ['use-single-domain', 'rebrand', 'custom-domain', 'multi-client'],
};

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json();
    const { licenseKey } = VerifyLicenseBodySchema.parse(body);

    let result;
    try {
      result = await verifyLicenseKey(licenseKey);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return ok({ valid: false, reason: 'not_found' });
      }
      if (err instanceof ForbiddenError) {
        return ok({ valid: false, reason: err.message });
      }
      throw err;
    }

    const permissions = LICENSE_TYPE_PERMISSIONS[result.type] ?? [];

    return ok({
      valid: true,
      licenseKey: result.licenseKey,
      status: result.status,
      type: result.type,
      expiresAt: result.expiresAt,
      permissions,
      template: result.template,
    });
  });
}
