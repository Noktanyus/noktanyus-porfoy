/**
 * /api/marketplace/vendor/profile/update
 *
 * PUT → Vendor profil bilgilerini günceller (auth zorunlu).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { vendorService } from '@/modules/marketplace';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(2000).optional(),
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
  website: z.string().url().optional().or(z.literal('')),
  twitter: z.string().max(50).optional(),
  github: z.string().max(50).optional(),
});

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Profil güncellemek için giriş yapmalısınız');
    }
    const userId = (session.user as { id: string }).id;

    const body = await req.json();
    const data = UpdateProfileSchema.parse(body);

    const profile = await vendorService.updateProfile(userId, {
      ...data,
      website: data.website || undefined,
    });

    return ok({ profile });
  });
}