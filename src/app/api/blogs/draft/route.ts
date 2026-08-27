/**
 * @file /api/blogs/draft - Taslak blog yazisi olustur
 * @description POST: Yeni bir taslak olusturur (status="draft").
 *              Auth gerektirir (admin session).
 *              Body: title, description, content, category, thumbnail?, tags?, author?, slug?
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';
import { z } from 'zod';
import { generateSlug } from '@/lib/utils';
import { blogService } from '@/modules/content/service';

const DraftSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(500),
  content: z.string().min(50),
  category: z.string().min(1).max(50),
  thumbnail: z.string().url().optional().nullable(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional().default([]),
  author: z.string().min(1).max(100).optional(),
  slug: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }

    const body = await req.json();
    const data = DraftSchema.parse(body);

    // Slug otomatik veya elle verilmis
    const slug = data.slug ?? generateSlug(data.title);

    const payload = {
      slug,
      title: data.title,
      description: data.description,
      content: data.content,
      category: data.category,
      thumbnail: data.thumbnail ?? null,
      tags: data.tags ?? [],
      author: data.author ?? (session.user.name ?? 'Admin'),
    };

    const draft = await blogService.createDraft(payload);
    return ok({ draft }, { status: 201 });
  });
}
