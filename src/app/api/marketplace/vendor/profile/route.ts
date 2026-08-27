/**
 * /api/marketplace/vendor/profile
 *
 * GET  → Oturum açmış kullanıcının vendor profilini getirir (yoksa null).
 * POST → Yeni vendor profili oluşturur (slug çakışma kontrolü).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { vendorService } from '@/modules/marketplace';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';

const CreateProfileSchema = z.object({
  displayName: z.string().min(2).max(100),
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  bio: z.string().max(2000).optional(),
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
  website: z.string().url().optional().or(z.literal('')),
  twitter: z.string().max(50).optional(),
  github: z.string().max(50).optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ok({ profile: null });
    }
    const userId = (session.user as { id: string }).id;
    const profile = await vendorService.getMyProfile(userId);
    return ok({ profile });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Vendor profili oluşturmak için giriş yapmalısınız');
    }
    const userId = (session.user as { id: string }).id;

    const body = await req.json();
    const data = CreateProfileSchema.parse(body);

    const profile = await vendorService.createProfile(userId, {
      displayName: data.displayName,
      slug: data.slug,
      bio: data.bio,
      avatar: data.avatar,
      banner: data.banner,
      website: data.website || undefined,
      twitter: data.twitter,
      github: data.github,
    });

    return ok({ profile }, { status: 201 });
  });
}