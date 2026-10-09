/**
 * POST /api/partner/apply — iş ortağı başvurusu
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { created, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ValidationError, ConflictError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  companyName: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  contactEmail: z.string().email(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const existing = await prisma.partner.findUnique({ where: { userId } });
    if (existing) throw new ConflictError('Zaten partner kaydınız var');

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError('Geçersiz başvuru', parsed.error.flatten());
    }

    const clash = await prisma.partner.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (clash) throw new ConflictError('Bu slug kullanımda');

    const partner = await prisma.partner.create({
      data: {
        userId,
        companyName: parsed.data.companyName,
        slug: parsed.data.slug,
        contactEmail: parsed.data.contactEmail,
        website: parsed.data.website || null,
        description: parsed.data.description,
        verified: false,
        active: true,
      },
    });

    return created({ partner: { id: partner.id, slug: partner.slug } });
  });
}
